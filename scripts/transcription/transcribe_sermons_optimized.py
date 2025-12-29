import os
import json
import requests
import time
import glob
import subprocess

# Configuration
API_KEY = "bc6383daf25d2c698b1ecf95809f33072bbdef55"
SOURCE_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Sermons"
OUTPUT_DIR = os.path.join(SOURCE_DIR, "transcripts")
# Temp dir for extracted audio
TEMP_DIR = os.path.join(SOURCE_DIR, "temp_audio")
MODEL = "nova-2"

def extract_audio(video_path, audio_path):
    """Extracts audio from video using ffmpeg."""
    # -vn: no video, -acodec libmp3lame: mp3 encoding, -q:a 4: decent quality (VBR)
    # -y: overwrite
    # -map 0:a:0? : map first audio track if exists
    cmd = [
        "ffmpeg", 
        "-i", video_path, 
        "-vn", 
        "-acodec", "libmp3lame", 
        "-q:a", "4",
        "-y", 
        audio_path
    ]
    print(f"  Extracting audio: {os.path.basename(video_path)} -> {os.path.basename(audio_path)}")
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except subprocess.CalledProcessError as e:
        print(f"  Error extracting audio: {e}")
        return False

def transcribe_file(filepath):
    url = "https://api.deepgram.com/v1/listen"
    
    headers = {
        "Authorization": f"Token {API_KEY}",
        "Content-Type": "audio/mp3" # Changed to audio/mp3
    }
    
    params = {
        "model": MODEL,
        "smart_format": "true",
        "diarize": "true",
        "punctuate": "true",
        "paragraphs": "true",
        "filler_words": "false"
    }

    print(f"  Uploading {os.path.basename(filepath)} ({os.path.getsize(filepath)/1024/1024:.1f} MB)...")
    
    with open(filepath, "rb") as audio:
        response = requests.post(url, headers=headers, params=params, data=audio, timeout=600) # Increased timeout
        
    if response.status_code == 200:
        return response.json()
    else:
        print(f"  Error: {response.status_code} - {response.text}")
        return None

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    if not os.path.exists(TEMP_DIR):
        os.makedirs(TEMP_DIR)
        
    mp4_files = glob.glob(os.path.join(SOURCE_DIR, "*.mp4"))
    print(f"Found {len(mp4_files)} MP4 files in {SOURCE_DIR}")
    
    for i, file_path in enumerate(mp4_files):
        basename = os.path.splitext(os.path.basename(file_path))[0]
        output_filename = f"{basename}_diarized.json"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        if os.path.exists(output_path):
            print(f"[{i+1}/{len(mp4_files)}] Skipping {basename} (Transcript exists)")
            continue
            
        print(f"[{i+1}/{len(mp4_files)}] Processing {basename}...")
        
        # 1. Extract Audio
        temp_audio_path = os.path.join(TEMP_DIR, f"{basename}.mp3")
        
        # Check if temp audio already exists (resuming)
        if not os.path.exists(temp_audio_path):
            success = extract_audio(file_path, temp_audio_path)
            if not success:
                continue
        else:
             print(f"  Using existing extracted audio")

        # 2. Transcribe
        try:
            result = transcribe_file(temp_audio_path)
            if result:
                with open(output_path, "w", encoding="utf-8") as f:
                    json.dump(result, f, indent=2)
                print(f"  ✓ Saved to {output_filename}")
                
                # Cleanup temp audio on success to save space
                try:
                    os.remove(temp_audio_path)
                except:
                    pass
            else:
                print(f"  ✗ Failed to transcribe")
                
        except Exception as e:
            print(f"  Exception processing {basename}: {e}")
            
    # Cleanup temp dir if empty
    try:
        os.rmdir(TEMP_DIR)
    except:
        pass
            
    print("\nBatch transcription complete.")

if __name__ == "__main__":
    main()
