
import os
import boto3
import time
from botocore.exceptions import NoCredentialsError, ClientError
from boto3.s3.transfer import TransferConfig

def load_env_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'): continue
            if '=' in line:
                key, val = line.split('=', 1)
                os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))

load_env_file('.env')
load_env_file('.env.local')

R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME")
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_PREFIX = "media/quran-study-v2/"

# List of missing files identifyed previously
MISSING_FILES = [
    "16) Quran Study - Q.64, Q.59, Q.70 - Nothing Happens & Angels Are The Best Surgeons.mp3",
    "17) Quran Study - Q.82-83, Q.90-91 (07-21-1989).mp3",
    "18) Quran Study - Q.61, Q.87. Q.94, Q.81.mp3",
    "19) Quran Study - Q.2 -89 - Witchcraft, Reverting, Intro To Blue Quran.mp3",
    "24) Quran Study - Q.55 & Q.56.mp3",
    "29) Quran Study - 1985 Tucson, Mehri's Questions, Admission Test & Final Test.mp3",
    "48) Quran Study - Rashad's Speech - Salat, Zakat, Fazeli Argues (01-11-1989).mp3",
    "49) Quran Study - Rashad's Speech, 19 Math (11-05-1989).mp3",
    "7) Quran Study - Q.62 & Q.63 - God's Religion Will Dominate (03-24-1989).mp3",
    "44) Quran Study - Q.64, Q.70 - Nothing Happens, Worry, Chastity.mp3",
    "46) Quran Study - Q.37 -159, Q.38 -25, Q.9 -50, Q.39 -11 - Admission Test, No Insurance Compromise, Jinns, Hypocrites, Apology.mp3",
    "35) Quran Study - Rashad Makes Deliberate Mistakes To Destroy idols (11-09-1989).mp3",
    "37) Quran Study - Q.11 -68 (11-04-1989).mp3",
    "39) Quran Study - Q.60-61 - Rich Believer, Certainty, Insurance (12-28-1989).mp3"
]

INPUT_DIR = "reprocess_ready"

def upload_missing_robust():
    print(f"Starting robust serial upload for {len(MISSING_FILES)} files...")
    
    session = boto3.Session(
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    )
    s3 = session.client('s3', endpoint_url=R2_ENDPOINT_URL)
    
    # Config to help with timeouts: Smaller chunks (5MB), less concurrency
    config = TransferConfig(
        multipart_threshold=1024 * 1024 * 5, 
        max_concurrency=4, 
        multipart_chunksize=1024 * 1024 * 5, 
        use_threads=True
    )

    for filename in MISSING_FILES:
        local_path = os.path.join(INPUT_DIR, filename)
        if not os.path.exists(local_path):
            print(f"⚠️ LOCAL MISSING: {filename}")
            continue
            
        r2_key = f"{R2_PREFIX}{filename}"
        
        success = False
        attempts = 0
        while not success and attempts < 10:
            attempts += 1
            print(f"Uploading {filename} (Attempt {attempts}/10)...")
            try:
                # Check if exists first to skip if manually done? 
                # Nope, trust the list for now.
                
                with open(local_path, "rb") as f:
                    s3.upload_fileobj(f, R2_BUCKET_NAME, r2_key, Config=config)
                print(f"✅ DONE: {filename}")
                success = True
            except Exception as e:
                print(f"❌ FAILED Attempt {attempts}: {e}")
                time.sleep(2) # Wait a bit before retry
        
        if not success:
            print(f"💀 PERMANENT FAILURE: {filename}")

if __name__ == "__main__":
    upload_missing_robust()
