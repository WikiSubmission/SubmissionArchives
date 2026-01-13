import boto3
import os
import json
from dotenv import load_dotenv

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

def rename_files():
    with open('rename_map.json', 'r', encoding='utf-8') as f:
        mapping = json.load(f)

    for item in mapping:
        old_key = item['old']
        new_key = item['new']
        
        if old_key == new_key:
            print(f"Skipping {old_key} (no change)")
            continue

        print(f"Renaming {old_key} -> {new_key}...")
        
        try:
            # Copy object
            s3.copy_object(
                Bucket=R2_BUCKET_NAME,
                CopySource={'Bucket': R2_BUCKET_NAME, 'Key': old_key},
                Key=new_key
            )
            # Delete old object
            s3.delete_object(Bucket=R2_BUCKET_NAME, Key=old_key)
            print("Success.")

            # Handle Transcripts (heuristic: check common extensions)
            base_old = os.path.splitext(old_key)[0]
            base_new = os.path.splitext(new_key)[0]
            
            extensions = ['.en-US.vtt', '.en-US.json', '_diarized.json']
            for ext in extensions:
                old_ts = base_old + ext
                new_ts = base_new + ext
                try:
                    s3.head_object(Bucket=R2_BUCKET_NAME, Key=old_ts)
                    # If exists, rename it too
                    print(f"Renaming transcript {old_ts} -> {new_ts}...")
                    s3.copy_object(
                        Bucket=R2_BUCKET_NAME,
                        CopySource={'Bucket': R2_BUCKET_NAME, 'Key': old_ts},
                        Key=new_ts
                    )
                    s3.delete_object(Bucket=R2_BUCKET_NAME, Key=old_ts)
                except:
                    pass # Output silent if transcript doesn't exist
                    
        except Exception as e:
            print(f"Failed to rename {old_key}: {e}")

if __name__ == "__main__":
    rename_files()
