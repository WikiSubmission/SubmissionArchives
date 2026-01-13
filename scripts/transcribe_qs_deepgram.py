import boto3
import os
import requests
import json
import time
from dotenv import load_dotenv

load_dotenv('.env.local')

R2_ACCOUNT_ID = os.getenv('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.getenv('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.getenv('R2_SECRET_ACCESS_KEY')
R2_BUCKET_NAME = os.getenv('R2_BUCKET_NAME')
DEEPGRAM_API_KEY = os.getenv('DEEPGRAM_API_KEY')

s3 = boto3.client(
    's3',
    endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name='auto'
)

def get_presigned_url(key):
    return s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': R2_BUCKET_NAME, 'Key': key},
        ExpiresIn=3600
    )

def transcribe_file(key):
    print(f"Processing {key}...")
    
    # 1. Get Presigned URL
    audio_url = get_presigned_url(key)
    
    # 2. Call Deepgram
    headers = {
        'Authorization': f'Token {DEEPGRAM_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Nova-2 model with diarization
    url = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&diarize=true&punctuate=true"
    
    payload = {'url': audio_url}
    
    print("  Sending to Deepgram...")
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=300) # 5 min timeout
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"  Deepgram failed: {e}")
        return False

    # 3. Convert to Flat JSON
    segments = []
    try:
        # Deepgram response structure: results -> channels[0] -> alternatives[0] -> paragraphs -> paragraphs
        # OR results -> channels[0] -> alternatives[0] -> words (if we want word level, but paragraphs is better for segments)
        
        # Check if paragraphs exist (smart_format usually enables it)
        if 'results' in data and 'channels' in data['results']:
            alt = data['results']['channels'][0]['alternatives'][0]
            if 'paragraphs' in alt and 'paragraphs' in alt['paragraphs']:
                 for para in alt['paragraphs']['paragraphs']:
                     speaker_id = para.get('speaker', 0)
                     # Combine sentences in paragraph
                     text = " ".join([s['text'] for s in para['sentences']])
                     start = para['start']
                     end = para['end']
                     
                     segments.append({
                         "start": start,
                         "end": end,
                         "text": text,
                         "speaker": f"Speaker {speaker_id}"
                     })
            else:
                # Fallback to simple transcript words or transcript block? 
                # If paragraphs missing, fallback to full text (not ideal for subtitles)
                # Let's try splitting by word timestamps if needed, but nova-2 usually returns paragraphs.
                print("  Warning: No paragraphs found, using fallback raw text.")
                segments.append({
                    "start": 0,
                    "end": alt['words'][-1]['end'] if 'words' in alt else 0,
                    "text": alt['transcript']
                })

    except Exception as e:
        print(f"  Formatting failed: {e}")
        return False
        
    # 4. Upload to R2
    base_key = os.path.splitext(key)[0]
    json_key = f"{base_key}.json" # Native .json format expectation
    
    print(f"  Uploading transcript to {json_key}...")
    try:
        s3.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=json_key,
            Body=json.dumps(segments, indent=2),
            ContentType='application/json'
        )
        print("  Success.")
        return True
    except Exception as e:
        print(f"  Upload failed: {e}")
        return False

def main():
    prefix = 'media/messenger_quran_studies/'
    
    # List files
    paginator = s3.get_paginator('list_objects_v2')
    processed = 0
    
    for page in paginator.paginate(Bucket=R2_BUCKET_NAME, Prefix=prefix):
        for obj in page.get('Contents', []):
            key = obj['Key']
            if key.endswith('.mp3'):
                # Check if JSON exists
                base_key = os.path.splitext(key)[0]
                json_key = f"{base_key}.json"
                
                try:
                    s3.head_object(Bucket=R2_BUCKET_NAME, Key=json_key)
                    # print(f"Skipping {key} (transcript exists)")
                except:
                    # Transcript missing, process it
                    success = transcribe_file(key)
                    if success:
                        processed += 1
                        # Rate limit specifically if worried, but Deepgram scales okay.
                        pass

    print(f"Total processed: {processed}")

if __name__ == "__main__":
    main()
