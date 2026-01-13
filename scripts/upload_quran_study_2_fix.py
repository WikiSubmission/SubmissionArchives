import boto3
import os
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

LOCAL_FILE = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\quran-studies\transcripts\09b9fcbd-8511-4b20-bb6f-eb483adb6ea6.json"

KEYS_TO_UPDATE = [
    "media/messenger_quran_studies/2) Quran Study - Q.95 & Q.96 - Quran Is Not Ink & Paper (08-04-1989).json",
    "media/quran-study-v2/2) Quran Study - Q.95 & Q.96 - Quran Is Not Ink & Paper (08-4-1989).json"
]

def upload_fix():
    if not os.path.exists(LOCAL_FILE):
        print(f"Error: Local file not found: {LOCAL_FILE}")
        return

    print("Reading local fixed file...")
    with open(LOCAL_FILE, 'rb') as f:
        file_content = f.read()

    for key in KEYS_TO_UPDATE:
        print(f"Uploading to: {key}")
        try:
            s3.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=key,
                Body=file_content,
                ContentType='application/json'
            )
            print("Success.")
        except Exception as e:
            print(f"Failed to upload to {key}: {e}")

if __name__ == "__main__":
    upload_fix()
