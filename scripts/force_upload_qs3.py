import boto3
import os
import sys
from dotenv import load_dotenv
import json

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

LOCAL_PATH = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\rk-media-platform\reprocess_ready\3) Quran Study - Q.10 -79-92, Q.73, Q.3 -110-117, RK Sermon (01-19&26-1990).json"
KEYS_TO_UPDATE = [
    "media/messenger_quran_studies/3) Quran Study - Q.10:79-92, Q.73, Q.3:110-117, RK Sermon (01-19&26-1990).json",
    "media/quran-study-v2/3) Quran Study - Q.10 -79-92, Q.73, Q.3 -110-117, RK Sermon (01-19&26-1990).json"
]

def verify_and_upload():
    print(f"Checking local file: {LOCAL_PATH}")
    with open(LOCAL_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Check specifically for the split
    found_split = False
    for seg in data:
        if "Ismail Barakat" in seg.get('speaker', '') and "He won't let me speak" in seg.get('content', ''):
             if seg.get('start_time') > 13.012: # Should be the second part
                 found_split = True
                 print("Verified: Found split segment for Ismail Barakat.")
                 break
    
    if not found_split:
        print("WARNING: Local file does NOT appear fixed!")
    
    # Upload
    with open(LOCAL_PATH, 'rb') as f:
        content = f.read()

    for key in KEYS_TO_UPDATE:
        print(f"Uploading to {key}")
        s3.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
            Body=content,
            ContentType='application/json'
        )
        print("Success.")

if __name__ == "__main__":
    verify_and_upload()
