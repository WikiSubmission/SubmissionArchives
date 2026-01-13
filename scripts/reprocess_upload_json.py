
import os
import boto3
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

INPUT_DIR = "reprocess_ready"
R2_PREFIX = "media/quran-study-v2/"

def upload_json_only():
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
    json_files = [f for f in files if f.endswith('.json')]
    
    total = len(json_files)
    print(f"Found {total} JSON files to upload.")
    
    for i, fname in enumerate(json_files, 1):
        local_path = os.path.join(INPUT_DIR, fname)
        r2_key = f"{R2_PREFIX}{fname}"
        
        print(f"[{i}/{total}] Uploading {fname} ...")
        try:
            with open(local_path, "rb") as f:
                s3.upload_fileobj(f, R2_BUCKET_NAME, r2_key)
        except Exception as e:
            print(f"Error uploading {fname}: {e}")
            
    print("=== JSON UPLOAD COMPLETE ===")

if __name__ == "__main__":
    upload_json_only()
