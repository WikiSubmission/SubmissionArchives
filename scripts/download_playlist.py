import os
import time
import glob
import boto3
import yt_dlp
from botocore.config import Config

# --- CONFIGURATION ---
PLAYLIST_URL = "https://youtube.com/playlist?list=PL4-yu8H59XsxBcN-P_tfVwG8Ze72zEy5Y&si=UHuZumGwpbfJlV4h"
ENV_FILE = ".env.local"
SLEEP_SECONDS = 30  # Wait time between downloads to avoid YouTube blocks

# --- LOAD ENV VARS ---
def load_env(filepath):
    config = {}
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'): continue
                if '=' in line:
                    key, val = line.split('=', 1)
                    config[key.strip()] = val.strip().strip('"').strip("'")
    return config

env = load_env(ENV_FILE)
R2_ACCOUNT_ID = env.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = env.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = env.get("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = env.get("R2_BUCKET_NAME", "rkmediaassets")

if not R2_ACCOUNT_ID or not R2_ACCESS_KEY_ID or not R2_SECRET_ACCESS_KEY:
    print("ERROR: Missing R2 credentials in .env.local")
    exit(1)

# --- INITIALIZE S3 CLIENT (R2) ---
s3 = boto3.client(
    's3',
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    config=Config(signature_version='s3v4')
)

def get_target_folder(index):
    # 1-11 (VP)
    if 1 <= index <= 11: return "media/VIDEO PROGRAMS/"
    # 12-33 (FS)
    if 12 <= index <= 33: return "media/FRIDAY SERMONS/"
    # 34 (VP)
    if index == 34: return "media/VIDEO PROGRAMS/"
    # 35-44 (FS)
    if 35 <= index <= 44: return "media/FRIDAY SERMONS/"
    # 45-50 (VP)
    if 45 <= index <= 999: return "media/VIDEO PROGRAMS/" # Catch all end
    return "media/MISC/"

# --- LOGGING SETUP ---
LOG_FILE = "download_log.txt"
def log_message(msg):
    print(msg, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

def progress_hook(d):
    if d['status'] == 'finished':
        log_message(f"\nDownload complete: {d['filename']}")

# --- RESUME CONFIG ---
RESUME_FROM_INDEX = 30 # Resuming from video 30

def process_video(entry, index):
    if index < RESUME_FROM_INDEX:
        return

    video_url = entry['url']
    video_title = entry.get('title', f'Video {index}')
    target_folder = get_target_folder(index)
    
    log_message(f"\n[{index}] Processing: {video_title}")
    log_message(f"Target: R2://{R2_BUCKET_NAME}/{target_folder}")

    # Configure Download
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': f'temp_{index}_%(title)s.%(ext)s',
        'quiet': True,
        'progress_hooks': [progress_hook],
        'retries': 10,
        'fragment_retries': 10,
        # SUBTITLES
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['en'],
        'subtitlesformat': 'vtt',
    }

    filename = None
    sub_filename = None
    
    try:
        # DOWNLOAD
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            filename = ydl.prepare_filename(info)
            
            # Predict subtitle filename (usually same basename with .en.vtt)
            base, _ = os.path.splitext(filename)
            # yt-dlp usually adds .en.vtt
            candidates_sub = glob.glob(f"{base}*.vtt")
            if candidates_sub:
                sub_filename = candidates_sub[0]
        
        if not os.path.exists(filename):
            candidates = glob.glob(f'temp_{index}_*')
            # Filter out .vtt from candidates check if possible, or just look for video extensions
            video_candidates = [c for c in candidates if not c.endswith('.vtt')]
            if video_candidates:
                filename = video_candidates[0]
                # Re-check subs if filename changed
                base, _ = os.path.splitext(filename)
                candidates_sub = glob.glob(f"{base}*.vtt")
                if candidates_sub:
                    sub_filename = candidates_sub[0]
            else:
                log_message("ERROR: File not found after download.")
                return

        # UPLOAD VIDEO
        s3_key = f"{target_folder}{os.path.basename(filename)}"
        log_message(f"Uploading VIDEO to {s3_key}...")
        s3.upload_file(filename, R2_BUCKET_NAME, s3_key)
        
        # UPLOAD SUBTITLE
        if sub_filename and os.path.exists(sub_filename):
            s3_key_sub = f"{target_folder}{os.path.basename(sub_filename)}"
            log_message(f"Uploading SUBTITLE to {s3_key_sub}...")
            s3.upload_file(sub_filename, R2_BUCKET_NAME, s3_key_sub)
        else:
            log_message("WARNING: No subtitle file found/downloaded.")

        log_message("Upload success.")

    except Exception as e:
        log_message(f"ERROR processing video {index}: {e}")
        return

    finally:
        # CLEANUP
        if filename and os.path.exists(filename):
            log_message(f"Deleting local file: {filename}")
            os.remove(filename)
        if sub_filename and os.path.exists(sub_filename):
            log_message(f"Deleting local subtitle: {sub_filename}")
            os.remove(sub_filename)

# --- MAIN LOOP ---
log_message("Fetching playlist info...")
with yt_dlp.YoutubeDL({'quiet': True, 'extract_flat': True}) as ydl:
    playlist_info = ydl.extract_info(PLAYLIST_URL, download=False)

if 'entries' not in playlist_info:
    log_message("ERROR: No entries found in playlist.")
    exit(1)

entries = list(playlist_info['entries'])
log_message(f"Found {len(entries)} videos. Resuming from #{RESUME_FROM_INDEX}...")

for i, entry in enumerate(entries, start=1):
    if i < RESUME_FROM_INDEX:
        continue
        
    process_video(entry, i)
    
    if i < len(entries):
        log_message(f"Sleeping for {SLEEP_SECONDS} seconds...")
        time.sleep(SLEEP_SECONDS)

log_message("\nAll Done!")
