
import os
import json
import re
import shutil
import html

TARGET_TITLES_FILE = "quran_study_titles_target.json"
INPUT_DIR = "reprocess_temp"
OUTPUT_DIR = "reprocess_ready"

def parse_vtt_timestamp(timestamp):
    # Format: HH:MM:SS.mmm or MM:SS.mmm
    parts = timestamp.split(':')
    seconds = 0
    if len(parts) == 3:
        seconds += int(parts[0]) * 3600
        seconds += int(parts[1]) * 60
        seconds += float(parts[2])
    elif len(parts) == 2:
        seconds += int(parts[0]) * 60
        seconds += float(parts[1])
    return seconds

def parse_vtt(vtt_path):
    segments = []
    with open(vtt_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    current_start = None
    current_end = None
    current_content = []
    
    current_speaker = "Dr. Rashad Khalifa"
    
    # Simple WebVTT parser
    # 00:00:00.000 --> 00:00:05.000
    # Text
    
    time_pattern = re.compile(r'(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})\s-->\s(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})')
    speaker_pattern = re.compile(r'^([A-Za-z .]+): (.+)')
    
    index = 0
    for line in lines:
        line = line.strip()
        if not line: continue
        if line.startswith('WEBVTT') or line.startswith('NOTE') or line.startswith('Kind:') or line.startswith('Language:'): continue
        
        match = time_pattern.search(line)
        if match:
            # Save previous if exists
            if current_start is not None and current_content:
                text = " ".join(current_content).strip()
                # Remove tags
                text = re.sub(r'<[^>]+>', '', text)
                text = html.unescape(text)
                text = text.replace('\u00a0', ' ')
                
                # Check for speaker in text
                sp_match = speaker_pattern.match(text)
                if sp_match:
                    # Found a speaker label
                    current_speaker = sp_match.group(1).strip()
                    # Clean content? User said "words actually spoken". 
                    # Usually we keep the content as is if we want fidelity, OR remove speaker label.
                    # The user example: "Catherine: And if..." -> "speaker": "Dr. Rashad" (User complained).
                    # If I set "speaker": "Catherine", keeping "Catherine:" in text is redundant but harmless.
                    # Removing it is cleaner.
                    text = sp_match.group(2).strip()
                
                if text:
                    segments.append({
                        "id": index,
                        "start_time": current_start,
                        "end_time": current_end,
                        "speaker": current_speaker, 
                        "content": text,
                        "segment_index": index
                    })
                    index += 1
            
            # Start new
            current_start = parse_vtt_timestamp(match.group(1))
            current_end = parse_vtt_timestamp(match.group(2))
            current_content = []
        else:
            # Content line?
            # Check if it's just a number (cue id)
            if line.isdigit(): continue
            current_content.append(line)
            
    # Save last
    if current_start is not None and current_content:
        text = " ".join(current_content).strip()
        text = re.sub(r'<[^>]+>', '', text)
        text = html.unescape(text)
        text = text.replace('\u00a0', ' ')
        
        sp_match = speaker_pattern.match(text)
        if sp_match:
            current_speaker = sp_match.group(1).strip()
            text = sp_match.group(2).strip()

        if text:
            segments.append({
                "id": index,
                "start_time": current_start,
                "end_time": current_end,
                "speaker": current_speaker,
                "content": text,
                "segment_index": index
            })

    return segments

def main():
    with open(TARGET_TITLES_FILE, 'r', encoding='utf-8') as f:
        target_titles = json.load(f)
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    files = os.listdir(INPUT_DIR)
    
    # Group by index
    # Format: INDEX_ID.ext
    groups = {}
    for fname in files:
        match = re.match(r'^(\d+)_', fname)
        if match:
            idx = int(match.group(1))
            if idx not in groups: groups[idx] = {'audio': None, 'sub': None}
            
            if fname.endswith('.mp3'):
                groups[idx]['audio'] = fname
            elif fname.endswith('.vtt') or fname.endswith('.json3'):
                # Prefer English
                if '.en.' in fname or '.en-US.' in fname or groups[idx]['sub'] is None:
                     groups[idx]['sub'] = fname
    
    processed_count = 0
    
    for idx_str in range(1, 53):
        # target_titles is 0-indexed list of strings
        if idx_str > len(target_titles): break
        
        target_title_raw = target_titles[idx_str - 1] 
        # Extract title part? No, using full string as filename is safer for now, 
        # but user list has "1) Quran Study: ..." 
        # We usually want "1) Quran Study - ..." 
        # Let's sanitize file name
        safe_name = target_title_raw.replace(':', ' -').replace('/', '-').replace('\\', '-').replace('"', '').replace('?', '').replace('*', '').replace('<', '').replace('>', '').replace('|', '')
        
        # Ensure it looks good.
        # "1) Quran Study - Q.72-19-28..."
        
        group = groups.get(idx_str)
        if not group:
            print(f"Missing download for index {idx_str}")
            continue
            
        print(f"Processing #{idx_str}: {safe_name}")
        
        # Audio
        if group['audio']:
            src_audio = os.path.join(INPUT_DIR, group['audio'])
            dst_audio = os.path.join(OUTPUT_DIR, safe_name + ".mp3")
            shutil.copy2(src_audio, dst_audio)
        else:
             print(f"  Missing AUDIO for #{idx_str}")

        # Transcript
        if group['sub']:
            src_sub = os.path.join(INPUT_DIR, group['sub'])
            dst_sub_json = os.path.join(OUTPUT_DIR, safe_name + ".json")
            
            # Convert
            # Assuming VTT for now as it makes sense with yt-dlp default
            try:
                # We need proper parsing. Let's assume VTT is typical.
                # If json3, we might need different logic.
                if src_sub.endswith('.vtt'):
                    segments = parse_vtt(src_sub)
                    with open(dst_sub_json, 'w', encoding='utf-8') as out:
                        json.dump(segments, out, indent=2)
                else:
                    print(f"  Unsupported sub format for now: {src_sub}")
            except Exception as e:
                print(f"  Error converting sub: {e}")
        else:
            print(f"  Missing SUB for #{idx_str}")
            
        processed_count += 1

    print(f"Processed {processed_count} items.")

if __name__ == "__main__":
    main()
