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

def check_transcripts():
    prefix = 'media/messenger_quran_studies/'
    print(f"Listing transcripts in {prefix}...")
    
    paginator = s3.get_paginator('list_objects_v2')
    mp3_count = 0
    transcript_count = 0
    
    transcripts = set()
    mp3s = []
    
    for page in paginator.paginate(Bucket=R2_BUCKET_NAME, Prefix=prefix):
        for obj in page.get('Contents', []):
            key = obj['Key']
            if key.endswith('.mp3'):
                mp3_count += 1
                mp3s.append(key)
            elif key.endswith('.json') or key.endswith('.vtt'):
                transcript_count += 1
                transcripts.add(key)
                # print(f"Found transcript: {key}")

    print(f"Total MP3s: {mp3_count}")
    print(f"Total Transcripts: {transcript_count}")
    
    print("\nMissing Transcripts for:")
    for mp3 in mp3s:
        base = os.path.splitext(mp3)[0]
        # Check specific expected formats
        json_path = base + '.json'
        vtt_path = base + '.vtt'
        diarized = base + '_diarized.json'
        
        found = False
        if json_path in transcripts: found = True
        if vtt_path in transcripts: found = True
        if diarized in transcripts: found = True
        
        if not found:
            print(f"- {os.path.basename(mp3)}")

if __name__ == "__main__":
    check_transcripts()
