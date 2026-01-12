import boto3
import os
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

def list_playlist():
    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=R2_BUCKET_NAME)
    
    files = []
    for page in pages:
        if 'Contents' not in page: continue
        for obj in page['Contents']:
            key = obj['Key']
            # Look for likely playlist items (temp_X or just based on the user's description)
            if 'temp_' in key and key.endswith(('.mp4', '.mp3')):
                files.append(key)
    
    # Sort them to try and reconstruct the order: temp_1, temp_2, etc.
    def sort_key(k):
        try:
            # Extract the first number after temp_
            base = k.split('/')[-1]
            parts = base.split('_')
            # likely temp_NUM_NUM or temp_NUM
            if len(parts) > 1 and parts[1].isdigit():
                return int(parts[1])
        except:
            return 9999
        return 9999

    import sys
    # sys.stdout.reconfigure(encoding='utf-8')
    
    files.sort(key=sort_key)
    
    with open('playlist_full.txt', 'w', encoding='utf-8') as f:
        for file in files:
            f.write(file + '\n')
            print(file)

if __name__ == "__main__":
    list_playlist()
