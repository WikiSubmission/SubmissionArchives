import os
import boto3

# Load env
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

R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "rk-media-bucket")
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_PREFIX = "media/messenger_quran_studies/"

INPUT_DIR = "reprocess_ready"
FILENAME = "5) Quran Study - Q.56 -75 & Q.57 (02-17-1989).mp3"

def upload_qs5():
    print(f"Connecting to {R2_ENDPOINT_URL}...")
    s3 = boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY
    )

    local_path = os.path.join(INPUT_DIR, FILENAME)
    r2_key = f"{R2_PREFIX}{FILENAME}"

    if not os.path.exists(local_path):
        print(f"ERROR: Local file not found at {local_path}")
        return

    print(f"Uploading {FILENAME} to {r2_key}...")
    with open(local_path, "rb") as f:
        s3.upload_fileobj(f, R2_BUCKET_NAME, r2_key)
    
    print("SUCCESS: Upload complete.")

if __name__ == "__main__":
    upload_qs5()
