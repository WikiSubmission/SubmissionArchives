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

def check():
    prefixes = [
        'rkmediaassets/media/messenger_quran_studies/',
        'media/messenger_quran_studies/',
        'messenger_quran_studies/'
    ]
    
    print(f"Bucket: {R2_BUCKET_NAME}")
    
    for p in prefixes:
        print(f"\nChecking prefix: {p}")
        resp = s3.list_objects_v2(Bucket=R2_BUCKET_NAME, Prefix=p, MaxKeys=50)
        
        if 'Contents' in resp:
            count = len(resp['Contents'])
            print(f"  FOUND {count} items.")
            for obj in resp['Contents'][:3]:
                print(f"   - {obj['Key']}")
        else:
            print("  NO items found.")

if __name__ == "__main__":
    check()
