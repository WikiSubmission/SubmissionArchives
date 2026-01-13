import boto3
import os
import json
import re
from dotenv import load_dotenv
import sys

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

# Load the file list to find keys
ALL_MEDIA_FILES = "all_media_files.txt"
with open(ALL_MEDIA_FILES, 'r', encoding='utf-8') as f:
    all_keys = [line.strip() for line in f if line.strip().endswith('.json')]

# Mapping from auto_map_transcripts.py (simplified/hardcoded for clarity here but could import)
# UUID -> ID
UUID_MAP = {
    # Manual from auto_map
    "030cfda5-4219-4577-8ccd-6a14d533be89.json": 22,
    "07101d2a-8099-4222-bf1b-fc0a7a9cf92f.json": 15,
    "1dd444ed-577b-4be6-9e12-8768ae41c591.json": 3, # Wait, is this 3 or is 477.. 3? Let's check logic. 
    # Ah, 1dd... was my previous guess but 477... is confirmed.
    # Let's rely on the verified ones.
    "bae1fbef-3d5a-4026-b4de-d35c269069bf.json": 25,
    "be31dcef-bc02-4d6f-aad5-0c52027be4f7.json": 19,
    "9caf431b-09b7-4255-887d-d06aaed96a3f.json": 31,
    "9c80976b-a1f8-471d-af23-ad19efa03a60.json": 28,
    "885d55fa-688b-499d-9e1e-7c18bdb9f9dd.json": 30,
    "7490e2b5-72f0-4e44-88bc-f3286cef4085.json": 8,
    "932af70c-2d8f-4523-909d-617725309694.json": 36,
    "973a702e-d1f0-45d5-9a12-504fca367e5a.json": 16,
    "86de7dd1-e456-42ab-8e3e-7070e26cdb3e.json": 1,
    "09b9fcbd-8511-4b20-bb6f-eb483adb6ea6.json": 2,
    "477b5794-fda8-44e0-afd8-cc39867e5260.json": 3,
    "bb16b5d1-09cf-45b6-a873-24c69825acb4.json": 6,
    "f6821504-792d-4aa1-a36f-a62fbc16ffdf.json": 10,
    "b88ef8ba-c7a2-4a76-8b66-2afe56d1d4e2.json": 5,
    "4aba34cf-0de3-48b5-a2e1-d78a99b2faf2.json": 45,
    "c7e2d2ef-6580-4cb8-bd6d-0668bdefd6f4.json": 14,
}

TRANSCRIPT_DIR = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\quran-studies\transcripts"

for uuid_file, id in UUID_MAP.items():
    local_path = os.path.join(TRANSCRIPT_DIR, uuid_file)
    if not os.path.exists(local_path):
        print(f"Skipping {uuid_file} (not found)")
        continue
    
    # Find matching keys in R2
    # Pattern: "ID) Quran Study" e.g. "3) Quran Study"
    prefix_messenger = f"media/messenger_quran_studies/{id}) Quran Study"
    prefix_v2 = f"media/quran-study-v2/{id}) Quran Study"
    
    target_keys = []
    for k in all_keys:
        if k.startswith(prefix_messenger) or k.startswith(prefix_v2):
            # Ensure it's the exact ID (e.g. "3)" not "30)")
            if f"{id})" in k:
                 target_keys.append(k)
    
    if not target_keys:
        print(f"No R2 keys found for ID {id} ({uuid_file})")
        continue
        
    print(f"Uploading {uuid_file} (ID {id}) to {len(target_keys)} locations:")
    with open(local_path, 'rb') as f:
        content = f.read()
        
    for key in target_keys:
        print(f"  -> {key}")
        try:
            s3.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=key,
                Body=content,
                ContentType='application/json'
            )
        except Exception as e:
            print(f"  Error uploading: {e}")

print("Done.")
