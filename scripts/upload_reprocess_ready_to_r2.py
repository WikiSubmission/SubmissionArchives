import boto3
import os
import sys
from dotenv import load_dotenv

# Force UTF-8
sys.stdout.reconfigure(encoding='utf-8')

load_dotenv('.env.local')

R2_ACCOUNT_ID = os.getenv('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.getenv('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.getenv('R2_SECRET_ACCESS_KEY')
R2_BUCKET_NAME = os.getenv('R2_BUCKET_NAME')

s3 = boto3.client(
    's3',
    endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name='auto'
)

LOCAL_DIR = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\rk-media-platform\reprocess_ready"
ALL_MEDIA_FILES = "all_media_files.txt"

def get_windows_safe_name(key_name):
    # Extract filename from key
    filename = key_name.split('/')[-1]
    # Replace invalid chars
    # Based on observation: ":" -> " -"
    # "Q.10:79" -> "Q.10 -79"
    safe_name = filename.replace(':', ' -')
    return safe_name

def upload():
    with open(ALL_MEDIA_FILES, 'r', encoding='utf-8') as f:
        all_keys = [line.strip() for line in f if line.strip().endswith('.json')]
    
    uploaded_count = 0
    
    # Map local files
    local_files = {f: True for f in os.listdir(LOCAL_DIR)}
    
    for key in all_keys:
        # We only care about keys that look like Quran Studies
        if "Quran Study" not in key:
            continue
            
        safe_name = get_windows_safe_name(key)
        
        # Check if precise match exists
        if safe_name in local_files:
            local_path = os.path.join(LOCAL_DIR, safe_name)
            print(f"Uploading {safe_name} -> {key}")
            try:
                with open(local_path, 'rb') as f:
                    content = f.read()
                s3.put_object(
                    Bucket=R2_BUCKET_NAME,
                    Key=key,
                    Body=content,
                    ContentType='application/json'
                )
                uploaded_count += 1
            except Exception as e:
                print(f"Failed to upload {key}: {e}")
        else:
            # Try finding loose match?
            # Sometimes safe name might vary (e.g. multiple spaces).
            pass

    print(f"Total uploaded: {uploaded_count}")

if __name__ == "__main__":
    upload()
