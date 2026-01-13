
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
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME")
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

def debug_listing():
    session = boto3.Session(
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    )
    s3 = session.client('s3', endpoint_url=R2_ENDPOINT_URL)

    prefix = "media/quran-study-v2/"
    print(f"Listing items with prefix: '{prefix}'")


    try:
        paginator = s3.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=R2_BUCKET_NAME, Prefix=prefix)
        
        r2_filenames = set()
        
        for page in pages:
            if 'Contents' in page:
                for obj in page['Contents']:
                    key = obj['Key']
                    if key.endswith('.mp3'):
                        filename = key.replace(prefix, '')
                        r2_filenames.add(filename)
        
        print(f"Total MP3s on R2: {len(r2_filenames)}")
        
        # Check against local
        local_dir = "reprocess_ready"
        local_files = [f for f in os.listdir(local_dir) if f.endswith(".mp3")]
        print(f"Total MP3s local: {len(local_files)}")
        
        missing = []
        for f in local_files:
            if f not in r2_filenames:
                missing.append(f)
        
        if missing:
            print("\n--- MISSING FILES ON R2 ---")
            for m in sorted(missing):
                print(m)
        else:
            print("\nAll local MP3s are present on R2.")

    except Exception as e:
        print(f"Error: {e}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_listing()
