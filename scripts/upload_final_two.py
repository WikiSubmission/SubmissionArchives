
import os
import boto3
import time
from botocore.exceptions import NoCredentialsError, ClientError
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

# Final missing files
MISSING_FILES = [
    "36) Quran Study - Q.30 -25 - Miracle From Biggest Brewery, Intercession, Allegory.mp3",
    "38) Quran Study - Certainty (11-29).mp3"
]

INPUT_DIR = "reprocess_ready"

def upload_missing_robust():
    print(f"Starting FINAL upload for {len(MISSING_FILES)} files...")
    
    session = boto3.Session(
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    )
    s3 = session.client('s3', endpoint_url=R2_ENDPOINT_URL)
    
    # Robust config
    config = TransferConfig(
        multipart_threshold=1024 * 1024 * 5, 
        max_concurrency=4, 
        multipart_chunksize=1024 * 1024 * 5, 
        use_threads=True
    )

    for filename in MISSING_FILES:
        local_path = os.path.join(INPUT_DIR, filename)
        if not os.path.exists(local_path):
            print(f"⚠️ LOCAL MISSING: {filename}")
            continue
            
        r2_key = f"{R2_PREFIX}{filename}"
        
        success = False
        attempts = 0
        while not success and attempts < 10:
            attempts += 1
            print(f"Uploading {filename} (Attempt {attempts}/10)...")
            try:
                with open(local_path, "rb") as f:
                    s3.upload_fileobj(f, R2_BUCKET_NAME, r2_key, Config=config)
                print(f"✅ DONE: {filename}")
                success = True
            except Exception as e:
                print(f"❌ FAILED Attempt {attempts}: {e}")
                time.sleep(2)
        
        if not success:
            print(f"💀 PERMANENT FAILURE: {filename}")

if __name__ == "__main__":
    upload_missing_robust()
