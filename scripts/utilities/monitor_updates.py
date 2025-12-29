import os
import json
import time
from datetime import datetime, timedelta

LINKS_FILE = "messenger_audios/meta/messenger_audios_links.json"
AUDIO_DIR = "messenger_audios"
NEXT_TASK = "Re-transcribe updated audios & Verify Index"

def load_target_count():
    with open(LINKS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return len(data)

def count_recent_files(minutes=30):
    count = 0
    now = datetime.now()
    cutoff = now - timedelta(minutes=minutes)
    
    if not os.path.exists(AUDIO_DIR):
        return 0
        
    for f in os.listdir(AUDIO_DIR):
        if f.lower().endswith(".mp3"):
            path = os.path.join(AUDIO_DIR, f)
            mtime = datetime.fromtimestamp(os.path.getmtime(path))
            if mtime > cutoff:
                count += 1
    return count

def main():
    target = load_target_count()
    print(f"Target Files: {target}")
    
    while True:
        completed = count_recent_files()
        percent = (completed / target) * 100 if target > 0 else 0
        
        # Clear line and print
        # timestamp = datetime.now().strftime("%H:%M:%S")
        # print(f"[{timestamp}] Progress: {completed}/{target} ({percent:.1f}%) | Next: {NEXT_TASK}", end='\r')
        
        # For agent terminal logs, separate lines are better than \r
        print(f"Progress: {completed}/{target} ({percent:.1f}%) COMPLETED. Next Task: {NEXT_TASK}")
        
        if completed >= target:
            print("\nDownload Complete!")
            break
            
        time.sleep(10)

if __name__ == "__main__":
    main()
