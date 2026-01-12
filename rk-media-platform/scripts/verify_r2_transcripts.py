import os
import boto3
from botocore.config import Config

# --- CONFIGURATION ---
ENV_FILE = ".env.local"
FOLDERS_TO_CHECK = [
    "media/messenger_quran_studies/"
]

# --- LOAD ENV VARS ---
def load_env(filepath):
    config = {}
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'): continue
                if '=' in line:
                    key, val = line.split('=', 1)
                    config[key.strip()] = val.strip().strip('"').strip("'")
    return config

env = load_env(ENV_FILE)
R2_ACCOUNT_ID = env.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = env.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = env.get("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = env.get("R2_BUCKET_NAME", "rkmediaassets")

if not R2_ACCOUNT_ID or not R2_ACCESS_KEY_ID or not R2_SECRET_ACCESS_KEY:
    print("ERROR: Missing R2 credentials in .env.local")
    exit(1)

# --- INITIALIZE S3 CLIENT ---
s3 = boto3.client(
    's3',
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    config=Config(signature_version='s3v4')
)

def check_folder(prefix):
    print(f"\n--- Checking {prefix} ---")
    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=R2_BUCKET_NAME, Prefix=prefix)

    mp3_count = 0
    json_count = 0
    missing = []
    
    # Store found bases
    found_mp3s = set()
    found_jsons = set()

    for page in pages:
        if 'Contents' in page:
            for obj in page['Contents']:
                key = obj['Key']
                if key.endswith('.mp3'):
                    mp3_count += 1
                    found_mp3s.add(os.path.splitext(key)[0])
                elif key.endswith('.json'):
                    json_count += 1
                    found_jsons.add(os.path.splitext(key)[0])

    print(f"  MP3s: {mp3_count}")
    print(f"  JSONs: {json_count}")
    
    # Diff
    for base in found_mp3s:
        if base not in found_jsons:
            missing.append(os.path.basename(base) + ".mp3")

    if missing:
        print(f"  MISSING ({len(missing)}):")
        for m in missing[:5]:
            print(f"   - {m}")
        if len(missing) > 5: print("   ... and more")
    else:
        print("  ALL TRANSCRIPTS PRESENT.")

    return mp3_count, json_count

total_videos = 0
total_transcripts = 0

for folder in FOLDERS_TO_CHECK:
    v, t = check_folder(folder)
    total_videos += v
    total_transcripts += t

print(f"\n=== OVERALL SUMMARY ===")
print(f"Total MP3s: {total_videos}")
print(f"Total JSONs: {total_transcripts}")

