import os
import json
import time
from datetime import datetime

LINKS_FILE = "messenger_audios/meta/messenger_audios_links.json"
VTT_DIR = "messenger_audios/transcripts_youtube_raw"
NEXT_TASK = "Convert VTT to JSON & Update Index"

def load_target_count():
    with open(LINKS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return len(data)

def count_vtt_files():
    if not os.path.exists(VTT_DIR):
        return 0
    return len([f for f in os.listdir(VTT_DIR) if f.endswith(".vtt")])

def main():
    target = load_target_count()
    print(f"Target Subtitles: {target}")
    
    while True:
        completed = count_vtt_files()
        percent = (completed / target) * 100 if target > 0 else 0
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Subtitles: {completed}/{target} ({percent:.1f}%) downloaded. Next: {NEXT_TASK}")
        
        if completed >= target:
            print("\nSubtitle Download Complete!")
            break
            
        time.sleep(5)

if __name__ == "__main__":
    main()
