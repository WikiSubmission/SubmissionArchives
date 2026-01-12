import boto3
import os
import json

def load_env_local():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env.local')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    if '=' in line:
                        key, value = line.strip().split('=', 1)
                        value = value.strip()
                        if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
                            value = value[1:-1]
                        os.environ[key] = value

load_env_local()

R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME')
R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')
R2_ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

s3 = boto3.client(
    's3',
    endpoint_url=R2_ENDPOINT_URL,
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY
)

def main():
    # Prefer the .json file if it exists, otherwise fall back to .en-US.json
    key_primary = "media/VIDEO PROGRAMS/City Council Al-Fateha Recitation.json"
    key_fallback = "media/VIDEO PROGRAMS/City Council Al-Fateha Recitation.en-US.json"
    
    target_key = key_primary
    
    print(f"Checking for {target_key}...")
    try:
        s3.head_object(Bucket=R2_BUCKET_NAME, Key=target_key)
        print("Found primary file.")
    except:
        print("Primary not found, checking fallback...")
        target_key = key_fallback
    
    print(f"Downloading {target_key}...")
    try:
        response = s3.get_object(Bucket=R2_BUCKET_NAME, Key=target_key)
        content = response['Body'].read().decode('utf-8')
        data = json.loads(content)
        
        if isinstance(data, list):
            segments = data
        elif isinstance(data, dict):
            segments = data.get('segments', [])
        else:
            print("Unknown JSON format")
            return

        modified_count = 0
        
        # Phrases to identify the "Man" speaker (City Council intro)
        intro_phrases = [
            "Roll call",
            "Mr. Miller",
            "Mr. Behram",
            "Mr. Ford",
            "Mr. Wallace", 
            "Mr. Davis",
            "Hear item 2",
            "Invocation pledge",
            "The invocation of this evening",
            "Will you please remain standing"
        ]
        
        for seg in segments:
            # Check if segment is in the first minute AND contains intro keywords
            # OR just brute force based on the user's report (timestamps < 40s)
            
            # User provided timestamps end around 33.5s. Let's be safe with 40s.
            if seg.get('start_time', 100) < 40:
                # Double check content
                text = seg.get('content', '')
                if any(phrase.lower() in text.lower() for phrase in intro_phrases):
                    if seg.get('speaker') != "Man":
                        print(f"Modifying segment at {seg['start_time']}s: {text[:30]}...")
                        seg['speaker'] = "Man"
                        modified_count += 1
        
        if modified_count > 0:
            print(f"Modified {modified_count} segments. Uploading to {key_primary}...")
            
            # Always save to the primary .json key to ensure it takes precedence
            new_body = json.dumps(segments, indent=2)
            s3.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=key_primary,
                Body=new_body,
                ContentType='application/json'
            )
            print("Upload complete.")
        else:
            print("No segments matched criteria. No changes made.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
