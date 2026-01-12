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

def upload_files():
    files = [
        "downloads/temp_15_15 Friday Sermon by dr Rashad Khalifa Universal Unity Through Devotion to GOD Alone.mp4",
        "downloads/temp_17_17 Friday Sermon by dr Rashad Khalifa Evidence is Increasing This Life is a School for the Eternal Life.mp4",
        "downloads/temp_20_20 Friday Sermon by dr Rashad Khalifa the Mohammadans Discoveries by Atef and Lisa 1987 12 04.mp4"
    ]

    for local_file in files:
        if not os.path.exists(local_file):
            print(f"Skipping missing file: {local_file}")
            continue
            
        filename = os.path.basename(local_file)
        key = f"media/FRIDAY SERMONS/{filename}"
        
        print(f"Uploading {filename} to {key}...")
        try:
            with open(local_file, "rb") as f:
                s3.upload_fileobj(f, R2_BUCKET_NAME, key)
            print("Success.")
        except Exception as e:
            print(f"Failed to upload {filename}: {e}")

if __name__ == "__main__":
    upload_files()
