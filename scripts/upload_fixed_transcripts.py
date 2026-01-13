import boto3
import os
import sys
from dotenv import load_dotenv

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

# Only upload the 5 files we just fixed
FILES_TO_UPLOAD = [
    "12) Quran Study - Behrouz's Sermon & Edip's Exposure (01-25-1990).json",
    "17) Quran Study - Q.82-83, Q.90-91 (07-21-1989).json",
    "21) Quran Study - Q.9 -52, Q.56 -75 - The Hypocrites.json",
    "22) Quran Study - Q.39 -11, Q.37 -164, Q.28 - Admission Test, No Insurance Compromise.json",
    "25) Quran Study - Q.58.json"
]

def get_r2_key(filename):
    """Convert local filename to R2 key format"""
    # R2 uses : instead of - in some cases
    r2_name = filename.replace(' -', ' -').replace('&', '&')
    
    # Try both paths
    return [
        f"media/messenger_quran_studies/{r2_name}",
        f"media/quran-study-v2/{r2_name}"
    ]

count = 0
for filename in FILES_TO_UPLOAD:
    local_path = os.path.join(LOCAL_DIR, filename)
    
    if not os.path.exists(local_path):
        print(f"Warning: {filename} not found locally")
        continue
    
    with open(local_path, 'rb') as f:
        content = f.read()
    
    # Upload to both R2 locations
    for key in get_r2_key(filename):
        try:
            s3.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=key,
                Body=content,
                ContentType='application/json'
            )
            print(f"Uploaded: {key}")
            count += 1
        except Exception as e:
            print(f"Error uploading {key}: {e}")

print(f"\nTotal uploaded: {count}")
