import os
import json
import requests
import time
import glob

# Configuration
API_KEY = "bc6383daf25d2c698b1ecf95809f33072bbdef55"
SOURCE_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Sermons"
OUTPUT_DIR = os.path.join(SOURCE_DIR, "transcripts")
MODEL = "nova-2"

def transcribe_file(filepath):
    url = "https://api.deepgram.com/v1/listen"
    
    headers = {
        "Authorization": f"Token {API_KEY}",
        "Content-Type": "video/mp4"
    }
    
    params = {
        "model": MODEL,
        "smart_format": "true",
        "diarize": "true",
        "punctuate": "true",
        "paragraphs": "true",
        "filler_words": "false"
    }

    print(f"Uploading {os.path.basename(filepath)}...")
    
    with open(filepath, "rb") as audio:
        response = requests.post(url, headers=headers, params=params, data=audio, timeout=300)
        
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

def process_response(data):
    # Normalize Deepgram response to our standard format
    # We want a clean list of segments or words
    # The verify app supports 'results.channels[0].alternatives[0].words'
    return data

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    # Get all MP4 files
    mp4_files = glob.glob(os.path.join(SOURCE_DIR, "*.mp4"))
    print(f"Found {len(mp4_files)} MP4 files in {SOURCE_DIR}")
    
    for i, file_path in enumerate(mp4_files):
        basename = os.path.splitext(os.path.basename(file_path))[0]
        output_filename = f"{basename}_diarized.json"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        if os.path.exists(output_path):
            print(f"[{i+1}/{len(mp4_files)}] Skipping {basename} (Already exists)")
            continue
            
        print(f"[{i+1}/{len(mp4_files)}] Transcribing {basename}...")
        
        try:
            result = transcribe_file(file_path)
            if result:
                with open(output_path, "w", encoding="utf-8") as f:
                    json.dump(result, f, indent=2)
                print(f"✓ Saved to {output_filename}")
            else:
                print(f"✗ Failed to transcribe {basename}")
                
        except Exception as e:
            print(f"Exception processing {basename}: {e}")
            
    print("\nBatch transcription complete.")

if __name__ == "__main__":
    main()
