
import os
import boto3
import json
import re

# --- Config ---
LOCAL_JSON_5 = "reprocess_ready/5) Quran Study - Q.56 -75 & Q.57 (02-17-1989).json"
MEGA_JSON_PATH = "ALL_QURAN_STUDIES_TRANSCRIPTS_MEGA.json"
INPUT_DIR = "reprocess_ready"

R2_PREFIX_INDIVIDUAL = "media/quran-study-v2/"
R2_PREFIX_DATA = "media/data/"

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

def run_fix():
    print("--- 1. Uploading Individual JSON for #5 ---")
    session = boto3.Session(
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    )
    s3 = session.client('s3', endpoint_url=R2_ENDPOINT_URL)
    
    if os.path.exists(LOCAL_JSON_5):
        fname = os.path.basename(LOCAL_JSON_5)
        r2_key = f"{R2_PREFIX_INDIVIDUAL}{fname}"
        print(f"Uploading {fname} to {r2_key}...")
        try:
            with open(LOCAL_JSON_5, "rb") as f:
                s3.upload_fileobj(f, R2_BUCKET_NAME, r2_key)
            print("SUCCESS: Individual JSON uploaded.")
        except Exception as e:
            print(f"FAILED: {e}")
            return
    else:
        print(f"ERROR: Local file {LOCAL_JSON_5} not found!")
        return

    print("\n--- 2. Regenerating Mega JSON ---")
    
    files = [f for f in os.listdir(INPUT_DIR) if f.endswith(".json") and not f.endswith("MEGA.json")]
    
    def get_index(fname):
        match = re.search(r'^(\d+)\)', fname)
        if match: return int(match.group(1))
        return 9999

    files.sort(key=get_index)
    master_list = []
    
    print(f"Combining {len(files)} transcripts...")
    for fname in files:
        index = get_index(fname)
        path = os.path.join(INPUT_DIR, fname)
        with open(path, 'r', encoding='utf-8') as f:
            transcript_data = json.load(f)
        
        # Ensure we capture title correctly or from filename
        entry = {
            "index": index,
            "filename": fname,
            "title": fname.replace(".json", ""),
            "transcript": transcript_data
        }
        master_list.append(entry)
        
    print(f"Writing {MEGA_JSON_PATH}...")
    with open(MEGA_JSON_PATH, 'w', encoding='utf-8') as out:
        json.dump(master_list, out, indent=2)
    
    size_mb = os.path.getsize(MEGA_JSON_PATH) / (1024 * 1024)
    print(f"Mega JSON Size: {size_mb:.2f} MB")

    print("\n--- 3. Uploading Mega JSON to R2 ---")
    r2_key_mega = f"{R2_PREFIX_DATA}{MEGA_JSON_PATH}"
    print(f"Uploading to {r2_key_mega}...")
    
    try:
        with open(MEGA_JSON_PATH, "rb") as f:
            s3.upload_fileobj(f, R2_BUCKET_NAME, r2_key_mega)
        print("SUCCESS: Mega JSON uploaded.")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    run_fix()
