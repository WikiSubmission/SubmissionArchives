
import os
import boto3
from botocore.exceptions import NoCredentialsError

# R2 Config
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME")
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

INPUT_DIR = "reprocess_ready"
DEST_PREFIX = "media/quran-study-v2"

def upload_files():
    s3 = boto3.client('s3',
        endpoint_url=ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY
    )

    if not os.path.exists(INPUT_DIR):
        print("Input directory not found.")
        return

    files = sorted(os.listdir(INPUT_DIR))
    print(f"Found {len(files)} files to upload.")

    for f in files:
        file_path = os.path.join(INPUT_DIR, f)
        object_key = f"{DEST_PREFIX}/{f}"
        
        # Determine content type
        content_type = "application/octet-stream"
        if f.endswith(".mp3"): content_type = "audio/mpeg"
        elif f.endswith(".json"): content_type = "application/json"
        
        print(f"Uploading {f} to {object_key}...")
        try:
            with open(file_path, "rb") as data:
                s3.put_object(
                    Bucket=R2_BUCKET_NAME,
                    Key=object_key,
                    Body=data,
                    ContentType=content_type
                )
            print("  Done.")
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    upload_files()
