import os
import re
import json
import glob
from datetime import timedelta

SUBS_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts_youtube_raw"
TRANSCRIPTS_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts"
BACKUP_SUFFIX = ".bak_original_deepgram"

def parse_timestamp(ts_str):
    # Format: HH:MM:SS.mmm
    h, m, s = ts_str.split(':')
    s, ms = s.split('.')
    return timedelta(hours=int(h), minutes=int(m), seconds=int(s), milliseconds=int(ms)).total_seconds()

def interpolate_words(text, start, end, speaker):
    words = text.split()
    if not words: return []
    
    duration = end - start
    per_word = duration / len(words)
    
    word_objs = []
    current_time = start
    for w in words:
        word_objs.append({
            "word": w,
            "start": round(current_time, 3),
            "end": round(current_time + per_word, 3),
            "speaker": speaker
        })
        current_time += per_word
    return word_objs

def parse_vtt(vtt_path):
    segments = []
    with open(vtt_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple block parser
    # 00:00:00.000 --> 00:00:01.653
    # Speaker: Text...
    
    pattern = re.compile(r'(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})\n(.*?)(?=\n\n|\Z)', re.DOTALL)
    
    matches = pattern.findall(content)
    current_speaker = "Unknown"
    
    for start_str, end_str, text_block in matches:
        start = parse_timestamp(start_str)
        end = parse_timestamp(end_str)
        text = text_block.replace('\n', ' ').strip()
        
        # Check for speaker prefix "Name: "
        # But distinguish from "Verse 19," etc?
        # Names found: "Dr. Khalifa:", "Catherine:", "A man:", "Edip:"
        # Heuristic: Uppercase/Titlecase followed by ": " at start.
        
        sp_match = re.match(r'^([A-Z][a-zA-z .]+): (.*)', text)
        if sp_match:
            current_speaker = sp_match.group(1)
            text = sp_match.group(2)
        
        # Clean text tags like &nbsp;
        text = text.replace('&nbsp;', ' ')
        
        # Build segment
        words_list = interpolate_words(text, start, end, current_speaker)
        
        segments.append({
            "text": text,
            "start": start,
            "end": end,
            "speaker": current_speaker,
            "words": words_list
        })
        
    return {"segments": segments}

def main():
    # Loop 1 to 52
    for i in range(1, 53):
        # 1. Find Sub File
        # Pattern: {i}_*.vtt (e.g., 01_... or 1_... yt-dlp might pad?)
        # yt-dlp %(playlist_index)s usually sends "01" or "1" depending. 
        # Check actual files: "01_..."
        
        sub_pattern = os.path.join(SUBS_DIR, f"{i:02d}_*.vtt")
        sub_files = glob.glob(sub_pattern)
        
        if not sub_files:
            # Try single digit for 1-9 just in case
            sub_pattern = os.path.join(SUBS_DIR, f"{i}_*.vtt")
            sub_files = glob.glob(sub_pattern)
            
        if not sub_files:
            print(f"Skipping {i}: No subtitle file found.")
            continue
        
        # Select best file
        # Prioritize ".en-US.vtt" -> Then any ".en*.vtt"
        # Avoid ".en-tr.vtt" (Turkish?)
        selected_sub = None
        for s in sub_files:
            if "en-US.vtt" in s and "en-en" not in s: 
                selected_sub = s
                break
        
        if not selected_sub:
             # Fallback
             for s in sub_files:
                 if ".en." in s or ".en-" in s:
                     selected_sub = s
                     break
                     
        if not selected_sub:
            selected_sub = sub_files[0]
            
        # 2. Find Transcript File
        target_file = None
        for f in os.listdir(TRANSCRIPTS_DIR):
            if f.startswith(f"{i})") and f.endswith("_diarized.json"):
                target_file = os.path.join(TRANSCRIPTS_DIR, f)
                break
        
        if not target_file:
            print(f"Skipping {i}: No target transcript found.")
            continue
            
        print(f"Processing {i}: {os.path.basename(selected_sub)} -> {os.path.basename(target_file)}")
        
        # 3. Process
        try:
            new_data = parse_vtt(selected_sub)
            
            # 4. Backup
            if not os.path.exists(target_file + BACKUP_SUFFIX):
                # Copy simple read/write to avoid shutil import if lazy?
                import shutil
                shutil.copy2(target_file, target_file + BACKUP_SUFFIX)
                
            # 5. Write
            # Preserve original "speakers" metadata?
            # The original JSON structure is { "segments": [...] }. 
            # Does it have other top-level keys? "num_speakers", "duration"?
            # Let's peek.
            
            # We'll just replace segments.
            with open(target_file, 'w', encoding='utf-8') as f:
                json.dump(new_data, f, indent=2)
                
        except Exception as e:
            print(f"Error processing {i}: {e}")

if __name__ == "__main__":
    main()
