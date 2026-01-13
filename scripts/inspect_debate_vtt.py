import boto3
import os
from dotenv import load_dotenv

load_dotenv('.env.local')

s3 = boto3.client(
    's3',
    endpoint_url=f"https://{os.getenv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
    aws_access_key_id=os.getenv('R2_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('R2_SECRET_ACCESS_KEY'),
    region_name='auto'
)

BUCKET = os.getenv('R2_BUCKET_NAME')
PREFIX = "media/VIDEO PROGRAMS/"

# Find the file
paginator = s3.get_paginator('list_objects_v2')
target_key = None

for page in paginator.paginate(Bucket=BUCKET, Prefix=PREFIX):
    if 'Contents' in page:
        for obj in page['Contents']:
            # TARGET SPECIFIC FILE: temp_8
            if 'temp_8' in obj['Key'] and obj['Key'].endswith('.vtt'):
                target_key = obj['Key']
                break
    if target_key: break

if target_key:
    print(f"Found: {target_key}")
    # Download
    s3.download_file(BUCKET, target_key, 'debug_debate.vtt')
    
    print("\n--- FIRST 50 LINES ---")
    with open('debug_debate.vtt', 'r', encoding='utf-8') as f:
        for i in range(50):
            print(f.readline().strip())
            
    # Search for "Abdel Rahman"
    print("\n--- SEARCHING FOR SPEAKERS ---")
    with open('debug_debate.vtt', 'r', encoding='utf-8') as f:
        content = f.read()
        pos = content.find('Abdel Rahman')
        if pos != -1:
            print(content[pos-100:pos+200])
        else:
            print("Abdel Rahman not found in text.")

else:
    print("Could not find Debate VTT")
