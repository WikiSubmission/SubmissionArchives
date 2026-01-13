
import os
import boto3
import threading
from botocore.exceptions import NoCredentialsError

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

# R2 Configuration
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "rk-media-bucket")
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_PREFIX = "media/quran-study-v2/"

INPUT_DIR = "reprocess_ready"

def upload_file(s3, local_path, r2_key):
    try:
        # Check if already exists? 
        # For now, let's just upload. Or head_object to save time?
        # Given this is a fix, let's check size.
        should_upload = True
        try:
            head = s3.head_object(Bucket=R2_BUCKET_NAME, Key=r2_key)
            if head['ContentLength'] > 0:
                print(f"Skipping {r2_key} (already exists)")
                should_upload = False
        except:
             pass 

        if should_upload:
            print(f"Uploading {r2_key} ...")
            with open(local_path, "rb") as f:
                s3.upload_fileobj(f, R2_BUCKET_NAME, r2_key)
            print(f"DONE: {r2_key}")
    except Exception as e:
        print(f"Error uploading {r2_key}: {e}")

def upload_worker(files_subset):
    session = boto3.Session(
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    )
    s3 = session.client('s3', endpoint_url=R2_ENDPOINT_URL)
    
    for f in files_subset:
        local_path = os.path.join(INPUT_DIR, f)
        r2_key = f"{R2_PREFIX}{f}"
        upload_file(s3, local_path, r2_key)

def upload_all_mp3s():
    files = sorted([f for f in os.listdir(INPUT_DIR) if f.endswith(".mp3")])
    if not files:
        print("No MP3 files found.")
        return

    print(f"Found {len(files)} MP3 files to upload/check.")
    
    # Threading for speed
    num_threads = 2
    chunk_size = len(files) // num_threads + 1
    threads = []
    
    for i in range(0, len(files), chunk_size):
        chunk = files[i:i + chunk_size]
        t = threading.Thread(target=upload_worker, args=(chunk,))
        t.start()
        threads.append(t)
        
    for t in threads:
        t.join()
        
    print("All uploads execution finished.")

if __name__ == "__main__":
    upload_all_mp3s()
