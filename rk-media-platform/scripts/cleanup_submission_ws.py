import boto3
import os
import json
import threading
from concurrent.futures import ThreadPoolExecutor

# --- CONFIGURATION ---
DRY_RUN = False  # Set to False to actually modify files
TARGET_STRING = "(www.submission.ws)"
PREFIXES_TO_SCAN = [
    "media/quran-study-v2/",
    "media/VIDEO PROGRAMS/",
    "media/FRIDAY SERMONS/",
    "media/messenger_audios/",
    "media/messenger_quran_studies/"
]
# ---------------------

def load_env_local():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env.local')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#') and '=' in line:
                    key, value = line.strip().split('=', 1)
                    value = value.strip()
                    if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
                        value = value[1:-1]
                    os.environ[key] = value

load_env_local()

R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME')
R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')
R2_ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

def get_s3_client():
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY
    )

s3 = get_s3_client()
print_lock = threading.Lock()

def process_file(key):
    try:
        # Check extension
        if not key.endswith('.json') and not key.endswith('.vtt'):
            return

        response = s3.get_object(Bucket=R2_BUCKET_NAME, Key=key)
        content = response['Body'].read().decode('utf-8')
        
        if TARGET_STRING in content:
            with print_lock:
                print(f"[FOUND] {key}")
            
            if not DRY_RUN:
                new_content = content.replace(TARGET_STRING, "")
                
                # Check if it's JSON and valid
                if key.endswith('.json'):
                    try:
                        # Validate JSON integrity
                        json.loads(new_content) 
                    except json.JSONDecodeError:
                        with print_lock:
                            print(f"[ERROR] Corrupt JSON after replacing in {key}. Skipping upload.")
                        return

                s3.put_object(
                    Bucket=R2_BUCKET_NAME,
                    Key=key,
                    Body=new_content,
                    ContentType='application/json' if key.endswith('.json') else 'text/vtt'
                )
                with print_lock:
                    print(f"[CLEANED] {key}")
    except Exception as e:
        with print_lock:
            print(f"[ERROR] processing {key}: {e}")

def main():
    print(f"Starting Scan. DRY_RUN={DRY_RUN}")
    print(f"Target: '{TARGET_STRING}'")
    
    files_to_scan = []
    
    for prefix in PREFIXES_TO_SCAN:
        print(f"Listing {prefix}...")
        paginator = s3.get_paginator('list_objects_v2')
        for page in paginator.paginate(Bucket=R2_BUCKET_NAME, Prefix=prefix):
            if 'Contents' in page:
                for obj in page['Contents']:
                    files_to_scan.append(obj['Key'])
                    
    print(f"Found {len(files_to_scan)} files total. Scanning contents...")
    
    # Process in parallel
    with ThreadPoolExecutor(max_workers=10) as executor:
        executor.map(process_file, files_to_scan)

    print("Scan Complete.")

if __name__ == "__main__":
    main()
