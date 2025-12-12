import whisperx
import torch
import json
import os
import glob
import logging
import gc
import requests
import time
import pandas as pd

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', handlers=[
    logging.FileHandler("diarization.log"),
    logging.StreamHandler()
])

# Configuration
PYANNOTE_API_KEY = "sk_6eaf1e2300854d83b20d5c223cecd0d0"
DEVICE = "cpu" 
COMPUTE_TYPE = "int8" 

HEADERS = {
    "Authorization": f"Bearer {PYANNOTE_API_KEY}"
}

def upload_file(file_path):
    object_key = f"media://{os.path.basename(file_path)}"
    logging.info(f"   Requesting upload URL for {object_key}...")
    
    res = requests.post(
        "https://api.pyannote.ai/v1/media/input",
        headers=HEADERS,
        json={"url": object_key}
    )
    
    if res.status_code != 200 and res.status_code != 201:
        logging.error(f"   Failed to get upload URL: {res.text}")
        return None
    
    data = res.json()
    upload_url = data["url"]
    
    logging.info(f"   Uploading file...")
    with open(file_path, "rb") as f:
        put_res = requests.put(upload_url, data=f, headers={"Content-Type": "application/octet-stream"})
        
    if put_res.status_code != 200:
        logging.error(f"   Upload failed: {put_res.text}")
        return None
        
    return object_key

def get_diarization(object_key):
    logging.info("   Starting diarization job...")
    res = requests.post(
        "https://api.pyannote.ai/v1/diarize",
        headers=HEADERS,
        json={"url": object_key}
    )
    
    if res.status_code != 200 and res.status_code != 201:
        logging.error(f"   Failed to start job: {res.text}")
        return None
            
    job_id = res.json()["jobId"]
    logging.info(f"   Job ID: {job_id}. Polling...")
    
    while True:
        res = requests.get(
            f"https://api.pyannote.ai/v1/jobs/{job_id}",
            headers=HEADERS
        )
        if res.status_code != 200:
            logging.error(f"   Polling failed: {res.text}")
            return None
            
import whisperx
import torch
import json
import os
import glob
import logging
import gc
import requests
import time
import pandas as pd
import subprocess
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', handlers=[
    logging.FileHandler("diarization.log"),
    logging.StreamHandler()
])

# Configuration
PYANNOTE_API_KEY = "sk_6eaf1e2300854d83b20d5c223cecd0d0"
DEVICE = "cpu" 
COMPUTE_TYPE = "int8" 

HEADERS = {
    "Authorization": f"Bearer {PYANNOTE_API_KEY}"
}

# Global Status Tracker
# Format: { "filename": {"status": "Waiting", "start_time": None, "job_id": None} }
STATUS = {}
STATUS_LOCK = threading.Lock()

def update_status(filename, status, job_id=None):
    with STATUS_LOCK:
        if filename not in STATUS:
            STATUS[filename] = {"status": "Waiting", "start_time": None, "job_id": None}
        
        STATUS[filename]["status"] = status
        if job_id:
            STATUS[filename]["job_id"] = job_id
        
        if status == "Transcribing" and STATUS[filename]["start_time"] is None:
            STATUS[filename]["start_time"] = datetime.now()

def print_dashboard():
    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        print("\n" + "="*80)
        print(f"   TRANSCRIPTION DASHBOARD - {datetime.now().strftime('%H:%M:%S')}")
        print("="*80)
        print(f"{'VIDEO FILE':<40} | {'STATUS':<30} | {'ELAPSED'}")
        print("-" * 80)
        
        with STATUS_LOCK:
            # Sort by filename
            for filename in sorted(STATUS.keys()):
                info = STATUS[filename]
                status = info["status"]
                elapsed = ""
                if info["start_time"]:
                    delta = datetime.now() - info["start_time"]
                    # Round to seconds
                    elapsed = str(delta).split('.')[0]
                
                # Truncate filename if too long
                display_name = (filename[:37] + '...') if len(filename) > 37 else filename
                print(f"{display_name:<40} | {status:<30} | {elapsed}")
        
        print("="*80 + "\n")
        time.sleep(5)

def upload_file(file_path):
    object_key = f"media://{os.path.basename(file_path)}"
    
    res = requests.post(
        "https://api.pyannote.ai/v1/media/input",
        headers=HEADERS,
        json={"url": object_key}
    )
    
    if res.status_code != 200 and res.status_code != 201:
        logging.error(f"Failed to get upload URL: {res.text}")
        return None
    
    data = res.json()
    upload_url = data["url"]
    
    with open(file_path, "rb") as f:
        put_res = requests.put(upload_url, data=f, headers={"Content-Type": "application/octet-stream"})
        
    if put_res.status_code != 200:
        logging.error(f"Upload failed: {put_res.text}")
        return None
        
    return object_key

def extract_audio(video_path):
    audio_path = video_path.replace(".mp4", ".wav")
    try:
        cmd = [
            "ffmpeg", "-y", "-i", video_path, 
            "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", 
            audio_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return audio_path
    except subprocess.CalledProcessError as e:
        logging.error(f"FFmpeg extraction failed: {e}")
        return None

def poll_and_save(job_id, whisper_result, output_file, filename):
    update_status(filename, f"Cloud Diarizing (Job {job_id})", job_id)
    
    while True:
        try:
            res = requests.get(
                f"https://api.pyannote.ai/v1/jobs/{job_id}",
                headers=HEADERS
            )
            if res.status_code != 200:
                update_status(filename, f"Polling Failed: {res.status_code}")
                return
                
            job_status = res.json()
            status = job_status["status"]
            
            if status == "succeeded":
                update_status(filename, "Finalizing...")
                api_result = job_status["output"]
                
                segments = api_result["diarization"]
                diarize_df = pd.DataFrame(segments)
                
                final_result = whisperx.assign_word_speakers(diarize_df, whisper_result)
                
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(final_result, f, indent=2)
                
                update_status(filename, "Done")
                logging.info(f"Saved {output_file}")
                return
                
            elif status == "failed":
                update_status(filename, "Cloud Job Failed")
                return
                
            time.sleep(5)
        except Exception as e:
            logging.error(f"Error polling {job_id}: {e}")
            time.sleep(10)

def main():
    mp4_files = glob.glob("*.mp4")
    
    # Initialize Status
    for f in mp4_files:
        STATUS[f] = {"status": "Waiting", "start_time": None, "job_id": None}
        if os.path.exists(f.replace(".mp4", "_diarized.json")):
             STATUS[f]["status"] = "Done (Previously)"

    # Start Dashboard Thread
    dashboard_thread = threading.Thread(target=print_dashboard, daemon=True)
    dashboard_thread.start()

    logging.info("Loading Whisper model...")
    model = whisperx.load_model("large-v2", DEVICE, compute_type=COMPUTE_TYPE, language="en")
    
    logging.info("Loading Alignment model...")
    model_a, metadata = whisperx.load_align_model(language_code="en", device=DEVICE)

    with ThreadPoolExecutor(max_workers=5) as executor:
        for i, video_file in enumerate(mp4_files):
            output_file = video_file.replace(".mp4", "_diarized.json")
            
            if os.path.exists(output_file):
                continue
            
            try:
                # 1. Transcribe
                update_status(video_file, "Transcribing (Local)")
                audio = whisperx.load_audio(video_file)
                result = model.transcribe(audio, batch_size=4, language="en")
                
                # 2. Align
                update_status(video_file, "Aligning (Local)")
                result = whisperx.align(result["segments"], model_a, metadata, audio, DEVICE, return_char_alignments=False)
                
                # 3. Prepare Cloud
                update_status(video_file, "Extracting Audio")
                audio_file = extract_audio(video_file)
                if not audio_file:
                    update_status(video_file, "Extraction Failed")
                    continue
                    
                update_status(video_file, "Uploading Audio")
                object_key = upload_file(audio_file)
                
                try:
                    os.remove(audio_file)
                except:
                    pass
                    
                if not object_key:
                    update_status(video_file, "Upload Failed")
                    continue
                
                # 4. Start Cloud Job
                update_status(video_file, "Starting Cloud Job")
                res = requests.post(
                    "https://api.pyannote.ai/v1/diarize",
                    headers=HEADERS,
                    json={"url": object_key}
                )
                
                if res.status_code != 200 and res.status_code != 201:
                    update_status(video_file, f"Job Start Failed: {res.status_code}")
                    continue
                        
                job_id = res.json()["jobId"]
                
                # 5. Background Poll
                executor.submit(poll_and_save, job_id, result, output_file, video_file)
                
                del audio
                gc.collect()
                
            except Exception as e:
                update_status(video_file, f"Error: {str(e)[:20]}")
                logging.error(f"Error processing {video_file}: {e}")

    # Keep main thread alive to show dashboard until all done
    while True:
        all_done = True
        with STATUS_LOCK:
            for f in STATUS:
                if STATUS[f]["status"] not in ["Done", "Done (Previously)", "Failed", "Cloud Job Failed", "Extraction Failed", "Upload Failed"] and not STATUS[f]["status"].startswith("Error"):
                    all_done = False
                    break
        if all_done:
            break
        time.sleep(5)
    
    print("\nAll tasks completed.")

if __name__ == "__main__":
    main()
