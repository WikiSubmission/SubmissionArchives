
import os
import json
import boto3
from dotenv import load_dotenv

load_dotenv('.env.local')

r2_account_id = os.getenv('R2_ACCOUNT_ID')
r2_access_key_id = os.getenv('R2_ACCESS_KEY_ID')
r2_secret_access_key = os.getenv('R2_SECRET_ACCESS_KEY')
r2_bucket_name = os.getenv('R2_BUCKET_NAME')

s3 = boto3.client(
    's3',
    endpoint_url=f'https://{r2_account_id}.r2.cloudflarestorage.com',
    aws_access_key_id=r2_access_key_id,
    aws_secret_access_key=r2_secret_access_key,
)

# 1. Get List of all Quran Study Audio Files from R2
# We need to know the duration. R2 HeadObject returns ContentLength, but not duration.
# However, MP3 size is roughly proportional to duration if bitrate is constant.
# Better: We can rely on the fact that we have many of these files locally or can get their size.
# BUT, we need precise duration to match with JSON.
# Actually, the JSON "end_time" of the last segment is the best proxy for duration.

# Strategy:
# A. Get all JSON files in transcripts/ folder. Parse them and get the 'max_end_time'.
# B. We need the duration of the MP3 files. Since we can't easily get duration from R2 without downloading,
#    we will assume the user has the MP3s local or we can get their size.
#    Wait, the user has 'recovery_output' with some files.
#    Let's use the 'all_media_files.txt' or similar list if it has duration.
#    If not, we can assume that if we have a match in "size vs duration" ratio or just unique durations, we can match.

# Let's try to get the size of all R2 Quran Study files first.
PREFIX = "media/messenger_quran_studies/"

print("Listing R2 Audio Files...")
audio_files = {} # Key -> Size
paginator = s3.get_paginator('list_objects_v2')
for page in paginator.paginate(Bucket=r2_bucket_name, Prefix=PREFIX):
    for obj in page.get('Contents', []):
        if obj['Key'].endswith('.mp3'):
            audio_files[obj['Key']] = obj['Size']

print(f"Found {len(audio_files)} audio files on R2.")

# 2. Analyze Transcripts
TRANSCRIPT_DIR = "transcripts"
transcript_durations = {} # Filename -> Duration (sec)

for f in os.listdir(TRANSCRIPT_DIR):
    if f.endswith(".json") and f != "messenger_transcripts":
        path = os.path.join(TRANSCRIPT_DIR, f)
        try:
            with open(path, 'r', encoding='utf-8') as jf:
                data = json.load(jf)
                if isinstance(data, list) and len(data) > 0:
                    last_seg = data[-1]
                    dur = last_seg.get('end_time', 0)
                    transcript_durations[f] = dur
        except:
            pass

print(f"Analyzed {len(transcript_durations)} transcripts.")

# 3. Correlation
# We don't have exact duration of MP3s, but we have size.
# MP3 128kbps = 16KB/s approx.
# Duration (sec) ~= Size (bytes) / 16000 (roughly)
# Let's print out the list so the user (me) can see if there's a correlation or unique matching.
# We will output a CSV-like list: AudioFile, Size, ApproxDuration, | TranscriptFile, Duration

# But wait, we can't blindly match.
# Let's just dump the data to a file for analysis.

with open('duration_match_debug.csv', 'w', encoding='utf-8') as f:
    f.write("Type,Name,Value\n")
    for k, v in audio_files.items():
        f.write(f"AUDIO,{k},{v}\n")
    for k, v in transcript_durations.items():
        f.write(f"TRANSCRIPT,{k},{v}\n")

print("Dumped data to duration_match_debug.csv")
