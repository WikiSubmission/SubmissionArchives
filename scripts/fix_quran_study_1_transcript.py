
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

local_file = r'recovery_output\1) Quran Study - Q.7219-28, Q.73 - Jinns (05-26-1989).json'
target_key = 'media/messenger_quran_studies/1) Quran Study - Q.72:19-28, Q.73 - Jinns (05-26-1989).json'

print(f"Uploading {local_file} to {target_key}")

try:
    with open(local_file, 'rb') as f:
        s3.upload_fileobj(
            f, 
            r2_bucket_name, 
            target_key,
            ExtraArgs={'ContentType': 'application/json'}
        )
    print("Upload successful!")
except Exception as e:
    print(f"Error uploading: {e}")
