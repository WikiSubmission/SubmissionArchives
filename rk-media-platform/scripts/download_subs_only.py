import os
import time
import glob
import boto3
import yt_dlp
from botocore.config import Config

# --- CONFIGURATION ---
PLAYLIST_URL = "https://youtube.com/playlist?list=PL4-yu8H59XsxBcN-P_tfVwG8Ze72zEy5Y&si=UHuZumGwpbfJlV4h"
ENV_FILE = ".env.local"
SLEEP_SECONDS = 5 # Faster because subs are small, but still don't spam

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

# --- INITIALIZE S3 CLIENT ---
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
    if 45 <= index <= 999: return "media/VIDEO PROGRAMS/" 
    return "media/MISC/"

def process_video_subs(entry, index):
    video_url = entry['url']
    video_title = entry.get('title', f'Video {index}')
    target_folder = get_target_folder(index)
    
    print(f"\n[{index}] Video: {video_title}")

    # Configure Download - SUBS ONLY
    ydl_opts = {
        'skip_download': True, # CRITICAL: Don't download video
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['en', 'en-US', 'en-orig'], # More inclusive
        'subtitlesformat': 'vtt',
        'outtmpl': f'temp_{index}_%(title)s.%(ext)s', # Matches video naming
        'quiet': True,
        'ignoreerrors': True,
    }

    sub_filename = None
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            # info['requested_subtitles'] might help debug if missing
            
            # Predict filename
            # Since we skipped download, we can't rely on 'filename' from info as reliably? 
            # actually ydl.prepare_filename works.
            filename_template = ydl.prepare_filename(info)
            base, _ = os.path.splitext(filename_template)
            
            # Look for any VTT generated
            candidates = glob.glob(f"{base}*.vtt")
            if candidates:
                sub_filename = candidates[0]
            else:
                # Fallback: check more broadly for temp_{index}_*.vtt 
                # in case title sanitization varied slightly or lang code differs
                broad_candidates = glob.glob(f"temp_{index}_*.vtt")
                if broad_candidates:
                    sub_filename = broad_candidates[0]

        if sub_filename and os.path.exists(sub_filename):
            s3_key_sub = f"{target_folder}{os.path.basename(sub_filename)}"
            print(f"Uploading SUBTITLE to {s3_key_sub}...")
            s3.upload_file(sub_filename, R2_BUCKET_NAME, s3_key_sub)
            print("Success.")
            
            # Cleanup
            os.remove(sub_filename)
        else:
            print("WARNING: Still no subtitle found.")

    except Exception as e:
        print(f"ERROR processing {index}: {e}")

# --- MAIN LOOP ---
print("Fetching playlist info for subtitles...")
with yt_dlp.YoutubeDL({'quiet': True, 'extract_flat': True}) as ydl:
    playlist_info = ydl.extract_info(PLAYLIST_URL, download=False)

entries = list(playlist_info['entries'])
print(f"Found {len(entries)} entries. Starting subtitle backfill...")

for i, entry in enumerate(entries, start=1):
    process_video_subs(entry, i)
    if i < len(entries):
        time.sleep(SLEEP_SECONDS)

print("\nSubtitle Backfill Done!")
