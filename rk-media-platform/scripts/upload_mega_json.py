
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

FILE_NAME = "ALL_QURAN_STUDIES_TRANSCRIPTS_MEGA.json"
# We place it in a 'data' folder or root of media? 
# Let's put it in 'media/data/' or just 'media/'
R2_KEY = f"media/data/{FILE_NAME}"

def upload_mega_json():
    if not os.path.exists(FILE_NAME):
        print(f"File {FILE_NAME} not found.")
        return

    print("Connecting to Cloudflare R2...")
    s3 = boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY
    )

    print(f"Uploading {FILE_NAME} to {R2_KEY} ...")
    try:
        with open(FILE_NAME, "rb") as f:
            s3.upload_fileobj(f, R2_BUCKET_NAME, R2_KEY)
        print("SUCCESS: Upload complete.")
    except Exception as e:
        print(f"Error uploading: {e}")

if __name__ == "__main__":
    upload_mega_json()
