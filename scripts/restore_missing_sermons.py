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

# Mappings (Source -> Destination)
# Note: Using the exact paths found in all_media_files.txt
moves = [
    # Item 15: Universal Unity
    (
        "media/disorganized_sermons/Friday Sermon, August 1987 No.3 Universal Unity, by Dr. Rashad Khalifa [dQRAAWAjHzU].mp4",
        "media/FRIDAY SERMONS/temp_15_15 Friday Sermon by dr Rashad Khalifa Universal Unity Through Devotion to GOD Alone GOD is Close to.mp4"
    ),
    # Item 20: 12/4/1987 (Mohammadans)
    (
        "media/disorganized_sermons/Dr. Rashad Khalifa's  Friday Sermons of Nov. 1987, 12⧸4⧸1987 [j6WwnOk44MU].mp4",
        "media/FRIDAY SERMONS/temp_20_20 Friday Sermon by dr Rashad Khalifa the Mohammadans Discoveries by Atef and Lisa 1987 12 04.mp4"
    )
]

def restore_files():
    for src, dest in moves:
        print(f"Restoring {dest}...")
        try:
            # Copy object
            s3.copy_object(
                Bucket=R2_BUCKET_NAME,
                CopySource={'Bucket': R2_BUCKET_NAME, 'Key': src},
                Key=dest
            )
            print(f"Success: {dest}")
        except Exception as e:
            print(f"Failed to copy {src} to {dest}: {e}")

if __name__ == "__main__":
    restore_files()
