import os
import json
import glob
import re

VTT_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts_youtube_raw"
TRANSCRIPTS_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts"
BACKUP_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts\backup_old_versions"
AUDIO_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies"

def parse_vtt_time(time_str):
    parts = time_str.split(':')
    seconds = 0
    if len(parts) == 3:
        seconds += int(parts[0]) * 3600
        seconds += int(parts[1]) * 60
        seconds += float(parts[2])
    elif len(parts) == 2:
        seconds += int(parts[0]) * 60
        seconds += float(parts[1])
    return seconds

def get_audio_title(number):
    # Find existing audio file to get the correct title
    pattern = os.path.join(AUDIO_DIR, f"{number}) *.mp3")
    audio_files = glob.glob(pattern)
    if audio_files:
        basename = os.path.basename(audio_files[0])
        return os.path.splitext(basename)[0]
    return None

def convert_all_vtts():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    # Move current transcripts to backup
    print("Backing up existing transcripts...")
    current_jsons = glob.glob(os.path.join(TRANSCRIPTS_DIR, "*.json"))
    for f in current_jsons:
        shutil.move(f, os.path.join(BACKUP_DIR, os.path.basename(f)))
        
    print(f"Backed up {len(current_jsons)} files.")
    
    # Process VTT files
    vtt_files = glob.glob(os.path.join(VTT_DIR, "*.vtt"))
    print(f"\nProcessing {len(vtt_files)} VTT files...")
    
    count = 0
    for vtt_path in vtt_files:
        basename = os.path.basename(vtt_path)
        parts = basename.split('_', 1)
        if len(parts) < 2: 
            continue
            
        try:
            number = str(int(parts[0])) # Strip leading zeros
        except:
            continue
            
        # Get standardized title from audio filename
        title = get_audio_title(number)
        if not title:
            print(f"Starting fallback title for {number}")
            title = f"{number}) Quran Study (YouTube) - Rashad Khalifa"
            
        # Parse VTT
        segments = []
        current_segment = None
        
        with open(vtt_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line: continue
                if '-->' in line:
                    times = line.split(' --> ')
                    start = parse_vtt_time(times[0])
                    end = parse_vtt_time(times[1].split()[0])
                    current_segment = {'start': start, 'end': end, 'text': ''}
                elif current_segment:
                    current_segment['text'] = line
                    segments.append(current_segment)
                    current_segment = None
        
        # Save JSON
        output_filename = f"{title}.json"
        output_path = os.path.join(TRANSCRIPTS_DIR, output_filename)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({"segments": segments}, f, indent=2, ensure_ascii=False)
            
        print(f"✓ Created: {output_filename}")
        count += 1
        
    print(f"\n✅ Successfully generated {count} transcripts from YouTube VTTs.")
    
import shutil
if __name__ == "__main__":
    convert_all_vtts()
