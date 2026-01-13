
import os
import subprocess
import json
import yt_dlp
import boto3

# --- Configuration ---
PLAYLIST_URL = "https://youtube.com/playlist?list=PL4-yu8H59XsykMGF0NTqhbUSs5yFoEzgO"
TARGET_INDEX = 5
TEMP_DIR = "reprocess_temp_fix"
OUTPUT_DIR = "reprocess_ready"
TITLES_FILE = "quran_study_titles_target.json"

# Load R2 creds
def load_env_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'): continue
            if '=' in line:
                key, val = line.split('=', 1)
                os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))

load_env_file('.env')
load_env_file('.env.local')

R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME")
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_PREFIX = "media/quran-study-v2/"

def run_repair():
    if not os.path.exists(TEMP_DIR):
        os.makedirs(TEMP_DIR)
    
    print(f"--- 1. Downloading Index {TARGET_INDEX} ---")
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': f'{TEMP_DIR}/%(playlist_index)s_%(id)s.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'playlist_items': str(TARGET_INDEX),
        'ignoreerrors': True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([PLAYLIST_URL])

    print("\n--- 2. Processing File ---")
    
    # Find downloaded file
    downloaded_file = None
    for f in os.listdir(TEMP_DIR):
        if f.startswith(f"{TARGET_INDEX}_") and f.endswith(".mp3"):
            downloaded_file = f
            break
    
    if not downloaded_file:
        print("ERROR: Download failed. File not found.")
        return

    file_path = os.path.join(TEMP_DIR, downloaded_file)
    file_size = os.path.getsize(file_path)
    print(f"Downloaded Size: {file_size / (1024*1024):.2f} MB")
    
    if file_size < 20 * 1024 * 1024:
        print("WARNING: File still seems too small!")

    # Get Title
    with open(TITLES_FILE, 'r', encoding='utf-8') as f:
        titles_list = json.load(f)
    
    target_title_raw = None
    for t in titles_list:
        if t.startswith(f"{TARGET_INDEX})"):
            target_title_raw = t
            break
            
    if not target_title_raw:
        # Fallback to index if 1-based index matches list position (0-based)
        if len(titles_list) >= TARGET_INDEX:
             target_title_raw = titles_list[TARGET_INDEX - 1]
    
    if not target_title_raw:
        print("ERROR: Title not found in list.")
        return

    # Sanitize exactly like reprocess_convert.py
    safe_name = target_title_raw.replace(':', ' -').replace('/', '-').replace('\\', '-').replace('"', '').replace('?', '').replace('*', '').replace('<', '').replace('>', '').replace('|', '')

    final_filename = f"{safe_name}.mp3"
    final_path = os.path.join(OUTPUT_DIR, final_filename)
    
    print(f"Renaming to: {final_filename}")
    
    # Move/Rename
    if os.path.exists(final_path):
        os.remove(final_path) # clear bad file
        
    os.rename(file_path, final_path)
    
    print("\n--- 3. Uploading to R2 ---")
    session = boto3.Session(
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    )
    s3 = session.client('s3', endpoint_url=R2_ENDPOINT_URL)
    
    r2_key = f"{R2_PREFIX}{final_filename}"
    print(f"Uploading to {r2_key}...")
    
    with open(final_path, "rb") as f:
        s3.upload_fileobj(f, R2_BUCKET_NAME, r2_key)
        
    print("SUCCESS: File repaired and uploaded.")

if __name__ == "__main__":
    run_repair()
