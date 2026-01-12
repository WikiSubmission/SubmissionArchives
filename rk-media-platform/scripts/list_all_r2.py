import boto3
import os
from dotenv import load_dotenv
import sys

# Force UTF-8 for file writing safety
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

def list_all():
    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=R2_BUCKET_NAME)
    
    with open('all_media_files.txt', 'w', encoding='utf-8') as f:
        for page in pages:
            if 'Contents' not in page: continue
            for obj in page['Contents']:
                # Write simple key
                f.write(obj['Key'] + '\n')
    
    print("Done writing all_media_files.txt")

if __name__ == "__main__":
    list_all()
