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

def check():
    key = "media/messenger_quran_studies/1) Quran Study - Q.72:19-28, Q.73 - Jinns (05-26-1989).json"
    print(f"Checking {key}...")
    try:
        obj = s3.get_object(Bucket=R2_BUCKET_NAME, Key=key)
        data = json.loads(obj['Body'].read().decode('utf-8'))
        print("Found JSON!")
        print(f"Item count: {len(data)}")
        if len(data) > 0:
            print(f"Sample: {data[0]}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    check()
