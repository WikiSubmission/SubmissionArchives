
import os
import boto3
import re
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
INDEX_PREFIX = "33) "

def upload_single_mp3():
    if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY]):
        print("Error: R2 credentials missing.")
        return

    print("Connecting to Cloudflare R2...")
    s3 = boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY
    )

    files = sorted(os.listdir(INPUT_DIR))
    target_file = None
    for f in files:
        if f.startswith(INDEX_PREFIX) and f.endswith(".mp3"):
            target_file = f
            break
            
    if not target_file:
        print(f"Error: Could not find MP3 file starting with '{INDEX_PREFIX}' in {INPUT_DIR}")
        return

    local_path = os.path.join(INPUT_DIR, target_file)
    r2_key = f"{R2_PREFIX}{target_file}"
    
    print(f"Uploading {target_file} to {r2_key} ...")
    try:
        with open(local_path, "rb") as f:
            s3.upload_fileobj(f, R2_BUCKET_NAME, r2_key)
        print("SUCCESS: Upload complete.")
    except Exception as e:
        print(f"Error uploading {target_file}: {e}")

if __name__ == "__main__":
    upload_single_mp3()
