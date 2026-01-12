
import boto3
import os
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv('.env.local')

r2_account_id = os.getenv('R2_ACCOUNT_ID')
r2_access_key_id = os.getenv('R2_ACCESS_KEY_ID')
r2_secret_access_key = os.getenv('R2_SECRET_ACCESS_KEY')
r2_bucket_name = os.getenv('R2_BUCKET_NAME')

if not all([r2_account_id, r2_access_key_id, r2_secret_access_key, r2_bucket_name]):
    print("Missing R2 environment variables")
    exit(1)

s3 = boto3.client(
    's3',
    endpoint_url=f'https://{r2_account_id}.r2.cloudflarestorage.com',
    aws_access_key_id=r2_access_key_id,
    aws_secret_access_key=r2_secret_access_key,
    config=Config(signature_version='s3v4')
)

prefix = "media/messenger_quran_studies/1)"

print(f"Listing objects with prefix: {prefix}")

try:
    target_key = 'media/messenger_quran_studies/1) Quran Study - Q.72:19-28, Q.73 - Jinns (05-26-1989).json'
    try:
        obj = s3.head_object(Bucket=r2_bucket_name, Key=target_key)
        print(f"File found: {target_key} | Size: {obj['ContentLength']} bytes", flush=True)
    except Exception as e:
        print(f"File not found: {target_key}", flush=True)
except Exception as e:
    print(f"Error: {e}")
