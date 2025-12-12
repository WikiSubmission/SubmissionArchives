import json
import re
import os
import glob

def parse_timestamp(ts):
    """Convert VTT timestamp (HH:MM:SS.mmm) to seconds"""
    parts = ts.split(':')
    hours = int(parts[0])
    minutes = int(parts[1])
    seconds = float(parts[2])
    return hours * 3600 + minutes * 60 + seconds

def extract_speaker_from_text(text):
    """Extract speaker name from text like 'Dr. Khalifa: text' or 'Catherine: text'"""
    # Match pattern: "Name: " at start of text
    match = re.match(r'^([A-Z][a-zA-Z\s\.]+?):\s*(.+)$', text)
    if match:
        speaker = match.group(1).strip()
        remaining_text = match.group(2).strip()
        return speaker, remaining_text
    return None, text

def parse_vtt_file(vtt_path):
    """Parse VTT file and extract segments with speaker attribution"""
    segments = []
    
    with open(vtt_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by double newline to get individual cue blocks
    blocks = re.split(r'\n\n+', content)
    
    current_speaker = None
    
    for block in blocks:
        lines = block.strip().split('\n')
        
        # Skip header and empty blocks
        if not lines or lines[0].startswith('WEBVTT') or lines[0].startswith('Kind:') or lines[0].startswith('Language:'):
            continue
        
        # Find timestamp line
        timestamp_line = None
        text_lines = []
        
        for line in lines:
            if '-->' in line:
                timestamp_line = line
            elif timestamp_line and line.strip():
                text_lines.append(line.strip())
        
        if not timestamp_line or not text_lines:
            continue
        
        # Parse timestamp
        match = re.match(r'(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})', timestamp_line)
        if not match:
            continue
        
        start = parse_timestamp(match.group(1))
        end = parse_timestamp(match.group(2))
        
        # Combine text lines
        text = ' '.join(text_lines)
        
        # Remove HTML entities
        text = text.replace('&nbsp;', ' ')
        
        # Check if text contains multiple speaker changes (e.g., "Text. Dr. Khalifa: More text")
        # Split by speaker pattern
        speaker_pattern = r'([A-Z][a-zA-Z\s\.]+?):\s+'
        parts = re.split(speaker_pattern, text)
        
        if len(parts) > 1:
            # Multiple speakers in one caption block - distribute time proportionally
            # parts will be: ['initial_text', 'Speaker1', 'text1', 'Speaker2', 'text2', ...]
            
            # Calculate total text length for proportional distribution
            text_parts = []
            for i in range(0, len(parts)):
                if i == 0 and parts[i].strip():
                    text_parts.append(parts[i].strip())
                elif i % 2 == 1 and i + 1 < len(parts):
                    text_parts.append(parts[i + 1].strip())
            
            total_length = sum(len(t) for t in text_parts if t)
            if total_length == 0:
                continue
            
            duration = end - start
            current_time = start
            
            part_index = 0
            for i in range(0, len(parts)):
                if i == 0 and parts[i].strip():
                    # Initial text before any speaker label - use current speaker
                    speaker = current_speaker or "Unknown"
                    clean_text = parts[i].strip()
                    if clean_text:
                        # Calculate proportional time
                        text_duration = (len(clean_text) / total_length) * duration
                        seg_start = current_time
                        seg_end = current_time + text_duration
                        current_time = seg_end
                        
                        segments.append({
                            "text": clean_text,
                            "start": seg_start,
                            "end": seg_end,
                            "speaker": speaker,
                            "words": []
                        })
                elif i % 2 == 1 and i + 1 < len(parts):
                    # This is a speaker name, next part is their text
                    speaker = parts[i].strip()
                    clean_text = parts[i + 1].strip()
                    if clean_text:
                        current_speaker = speaker
                        # Calculate proportional time
                        text_duration = (len(clean_text) / total_length) * duration
                        seg_start = current_time
                        seg_end = min(current_time + text_duration, end)  # Don't exceed original end
                        current_time = seg_end
                        
                        segments.append({
                            "text": clean_text,
                            "start": seg_start,
                            "end": seg_end,
                            "speaker": speaker,
                            "words": []
                        })
        else:
            # Single speaker in caption
            speaker, clean_text = extract_speaker_from_text(text)
            
            # If no speaker in this segment, use previous speaker
            if speaker:
                current_speaker = speaker
            elif current_speaker:
                speaker = current_speaker
                clean_text = text
            else:
                speaker = "Unknown"
                clean_text = text
            
            if clean_text.strip():
                segments.append({
                    "text": clean_text,
                    "start": start,
                    "end": end,
                    "speaker": speaker,
                    "words": []
                })
    
    return segments

def convert_vtt_to_json(vtt_path, output_path):
    """Convert VTT file to JSON transcript format"""
    print(f"Converting: {os.path.basename(vtt_path)}")
    
    segments = parse_vtt_file(vtt_path)
    
    if not segments:
        print(f"  WARNING: No segments found in {vtt_path}")
        return False
    
    # Create JSON structure
    transcript = {
        "segments": segments
    }
    
    # Write to file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(transcript, f, indent=2, ensure_ascii=False)
    
    print(f"  ✓ Created with {len(segments)} segments")
    return True

def process_messenger_audios():
    """Process Messenger Audios VTT files"""
    VTT_DIR = r"c:\Users\Jonathan\Desktop\RKM\messenger_audios\transcripts_youtube_raw"
    OUTPUT_DIR = r"c:\Users\Jonathan\Desktop\RKM\messenger_audios\transcripts"
    AUDIO_DIR = r"c:\Users\Jonathan\Desktop\RKM\messenger_audios"
    MAPPING_FILE = r"c:\Users\Jonathan\Desktop\RKM\messenger_audios\messenger_audio_map.json"
    
    # Load the mapping file
    with open(MAPPING_FILE, 'r', encoding='utf-8') as f:
        mapping = json.load(f)
    
    # Create reverse mapping: youtube_id -> audio_files
    youtube_to_audio = {}
    for entry in mapping:
        yt_id = entry['youtube_id']
        audio_files = entry['audio_files']
        
        if yt_id not in youtube_to_audio:
            youtube_to_audio[yt_id] = []
        youtube_to_audio[yt_id].extend(audio_files)
    
    # Find all VTT files
    vtt_files = glob.glob(os.path.join(VTT_DIR, "*.vtt"))
    
    print(f"Found {len(vtt_files)} VTT files\n")
    
    converted = 0
    for vtt_path in vtt_files:
        basename = os.path.basename(vtt_path)
        # Extract YouTube ID (before .en-US.vtt)
        yt_id = basename.split('.')[0]
        
        if yt_id not in youtube_to_audio:
            print(f"WARNING: No audio mapping for {yt_id}")
            continue
        
        # Get corresponding audio file(s)
        audio_files = youtube_to_audio[yt_id]
        
        for audio_file in audio_files:
            # Remove extension
            audio_name = os.path.splitext(audio_file)[0]
            
            # Create output filename
            output_filename = f"{audio_name}_diarized.json"
            output_path = os.path.join(OUTPUT_DIR, output_filename)
            
            if convert_vtt_to_json(vtt_path, output_path):
                converted += 1
    
    print(f"\n✓ Successfully converted {converted} files")

if __name__ == "__main__":
    process_messenger_audios()
