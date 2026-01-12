import boto3
import os
import sys
from dotenv import load_dotenv

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

LOCAL_PATH = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\rk-media-platform\reprocess_ready\4) Quran Study - Q.37, Q.3 -118-129 - Asteroid (01-21&22-1990).json"

# Keys need to match how they are in R2.
# Based on previous pattern: "4) Quran Study..."
# Filename in R2 might have ":" instead of "-" in the timestamp or verse?
# The user linked: http://.../4)%20Quran%20Study%20-%20Q.37%2C%20Q.3%20-118-129%20-%20Asteroid%20(01-21%2622-1990).mp3
# That decodes to: 4) Quran Study - Q.37, Q.3 -118-129 - Asteroid (01-21&22-1990).mp3
# So the JSON key should be similar.

KEYS_TO_UPDATE = [
    "media/messenger_quran_studies/4) Quran Study - Q.37, Q.3 -118-129 - Asteroid (01-21&22-1990).json",
    "media/quran-study-v2/4) Quran Study - Q.37, Q.3 -118-129 - Asteroid (01-21&22-1990).json"
]

def upload():
    with open(LOCAL_PATH, 'rb') as f:
        content = f.read()

    for key in KEYS_TO_UPDATE:
        print(f"Uploading to {key}")
        try:
            s3.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=key,
                Body=content,
                ContentType='application/json'
            )
            print("Success.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    upload()
