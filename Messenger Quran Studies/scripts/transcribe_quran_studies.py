import os
import glob
import json
import logging
import threading
import time
from datetime import datetime
from deepgram import (
    DeepgramClient,
)

# Configuration
DEEPGRAM_API_KEY = "67aa1f83ddbb57aada100813e5e8f3d51ffc2518"

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', handlers=[
    logging.FileHandler("deepgram_audio.log"),
    logging.StreamHandler()
])

# Global Status Tracker
STATUS = {}
STATUS_LOCK = threading.Lock()

def update_status(filename, status):
    with STATUS_LOCK:
        if filename not in STATUS:
            STATUS[filename] = {"status": "Waiting", "start_time": None}
        
        STATUS[filename]["status"] = status
        
        if status == "Transcribing" and STATUS[filename]["start_time"] is None:
            STATUS[filename]["start_time"] = datetime.now()

def print_dashboard():
    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        print("\n" + "="*80)
        print(f"   DEEPGRAM AUDIO DASHBOARD - {datetime.now().strftime('%H:%M:%S')}")
        print("="*80)
        print(f"{'AUDIO FILE':<40} | {'STATUS':<30} | {'ELAPSED'}")
        print("-" * 80)
        
        with STATUS_LOCK:
            for filename in sorted(STATUS.keys()):
                info = STATUS[filename]
                status = info["status"]
                elapsed = ""
                if info["start_time"]:
                    delta = datetime.now() - info["start_time"]
                    elapsed = str(delta).split('.')[0]
                
                display_name = (filename[:37] + '...') if len(filename) > 37 else filename
                print(f"{display_name:<40} | {status:<30} | {elapsed}")
        
        print("="*80 + "\n")
        time.sleep(2)

def main():
    try:
        deepgram = DeepgramClient(api_key=DEEPGRAM_API_KEY)
    except Exception as e:
        logging.error(f"Failed to init Deepgram: {e}")
        return

    # Find all MP3 files
    audio_files = glob.glob("*.mp3")
    
    # Ensure transcripts directory exists
    os.makedirs("transcripts", exist_ok=True)

    for f in audio_files:
        STATUS[f] = {"status": "Waiting", "start_time": None}
        # Check in transcripts folder
        json_name = os.path.basename(f).replace(".mp3", "_diarized.json")
        if os.path.exists(os.path.join("transcripts", json_name)):
             STATUS[f]["status"] = "Done (Previously)"

    dashboard_thread = threading.Thread(target=print_dashboard, daemon=True)
    dashboard_thread.start()

    for audio_file in audio_files:
        json_name = os.path.basename(audio_file).replace(".mp3", "_diarized.json")
        output_file = os.path.join("transcripts", json_name)
        
        if os.path.exists(output_file):
            continue
            
        update_status(audio_file, "Transcribing")
        
        try:
            with open(audio_file, "rb") as buffer:
                # Deepgram options
                options = {
                    "model": "nova-2",
                    "smart_format": True,
                    "diarize": True,
                    "punctuate": True,
                    "utterances": True,
                    "language": "en"
                }
                
                response = deepgram.listen.v1.media.transcribe_file(request=buffer, **options)
                
                # Convert Deepgram response to our expected format
                dg_result = response.results.channels[0].alternatives[0]
                
                final_segments = []
                
                # Use utterances (sentences) as they map well to subtitles
                if response.results.utterances:
                    for utt in response.results.utterances:
                        segment = {
                            "start": utt.start,
                            "end": utt.end,
                            "speaker": f"SPEAKER_{int(utt.speaker):02d}" if utt.speaker is not None else "SPEAKER_UNKNOWN",
                            "text": utt.transcript,
                            "words": []
                        }
                        
                        # Find words belonging to this utterance
                        for w in utt.words:
                            segment["words"].append({
                                "word": w.word,
                                "start": w.start,
                                "end": w.end,
                                "speaker": f"SPEAKER_{int(w.speaker):02d}" if w.speaker is not None else "SPEAKER_UNKNOWN"
                            })
                        
                        final_segments.append(segment)
                
                final_output = {
                    "text": dg_result.transcript,
                    "segments": final_segments
                }
                
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(final_output, f, indent=2)
                    
            update_status(audio_file, "Done")
            
        except Exception as e:
            update_status(audio_file, f"Error: {str(e)[:20]}")
            logging.error(f"Error processing {audio_file}: {e}")
            
    # Wait for completion
    while True:
        all_done = True
        with STATUS_LOCK:
            for f in STATUS:
                if STATUS[f]["status"] not in ["Done", "Done (Previously)"] and not STATUS[f]["status"].startswith("Error"):
                    all_done = False
                    break
        if all_done:
            break
        time.sleep(2)
        
    print("\nAll tasks completed.")

if __name__ == "__main__":
    main()
