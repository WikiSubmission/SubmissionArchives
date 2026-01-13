import boto3
import os
import json

def load_env_local():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env.local')
    if os.path.exists(env_path):
        print(f"Loading env from {env_path}")
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    if '=' in line:
                        key, value = line.strip().split('=', 1)
                        # Strip quotes if present
                        value = value.strip()
                        if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
                            value = value[1:-1]
                        os.environ[key] = value
                        print(f"Loaded key: {key}") 
    else:
        print(f"Warning: .env.local not found at {env_path}")

load_env_local()

# R2 Configuration
R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME')
R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')

if not R2_ACCOUNT_ID:
    print("ERROR: R2_ACCOUNT_ID is missing from environment!")
    exit(1)

R2_ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

def get_s3_client():
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY
    )

def verify_speakers():
    s3 = get_s3_client()
    prefix = "media/VIDEO PROGRAMS/"
    
    print(f"Listing files in {prefix} to find 'Great Debate'...")
    
    # List files to find the exact name
    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=R2_BUCKET_NAME, Prefix=prefix)
    
    target_keys = []
    
    print("Scanning for Great Debate files...")
    for page in pages:
        if 'Contents' not in page:
            continue
            
        for obj in page['Contents']:
            key = obj['Key']
            if "Great Debate" in key and key.endswith(".json"):
                print(f"Found candidate: {key}")
                target_keys.append(key)
    
    if not target_keys:
        print("Could not find ANY 'Great Debate' JSON transcript in R2.")
        return

    for target_key in target_keys:
        print(f"\nAnalyzing {target_key}...")
        try:
            response = s3.get_object(Bucket=R2_BUCKET_NAME, Key=target_key)
            content = response['Body'].read().decode('utf-8')
            # ... process data ...
            try:
                data = json.loads(content)
            except json.JSONDecodeError:
                print("Invalid JSON.")
                continue

            if isinstance(data, list):
                segments = data
            elif isinstance(data, dict):
                segments = data.get('segments', [])
            else:
                segments = []
                
            total_segments = len(segments)
            
            rashad_count = 0
            abdel_count = 0
            
            for seg in segments:
                speaker = seg.get('speaker', 'Unknown')
                if speaker == "Dr. Rashad Khalifa":
                    rashad_count += 1
                elif speaker == "Dr. Abdel Rahman":
                    abdel_count += 1
            
            print(f"  Total Segments: {total_segments}")
            print(f"  Dr. Rashad Khalifa: {rashad_count}")
            print(f"  Dr. Abdel Rahman: {abdel_count}")
            
            if rashad_count > 100 or abdel_count > 100:
                 print("  >>> THIS LOOKS LIKE THE UPDATED FILE <<<")
                 
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    verify_speakers()
