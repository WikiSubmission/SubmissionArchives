
import os
import boto3
from boto3.s3.transfer import TransferConfig

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

FILENAME = "17) Quran Study - Q.82-83, Q.90-91 (07-21-1989).mp3"
INPUT_DIR = "reprocess_ready"

def upload_single():
    session = boto3.Session(
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    )
    s3 = session.client('s3', endpoint_url=R2_ENDPOINT_URL)
    
    local_path = os.path.join(INPUT_DIR, FILENAME)
    r2_key = f"{R2_PREFIX}{FILENAME}"
    
    print(f"Uploading {FILENAME} size: {os.path.getsize(local_path)} bytes...")
    
    # Use standard config but single threaded to debug
    config = TransferConfig(use_threads=False)
    
    try:
        with open(local_path, "rb") as f:
            s3.upload_fileobj(f, R2_BUCKET_NAME, r2_key, Config=config)
        print("SUCCESS")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    upload_single()
