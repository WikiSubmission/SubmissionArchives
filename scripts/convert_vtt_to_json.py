import boto3
import os
import re
import json
import webvtt
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

R2_ACCOUNT_ID = os.getenv('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.getenv('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.getenv('R2_SECRET_ACCESS_KEY')
R2_BUCKET_NAME = os.getenv('R2_BUCKET_NAME')

# R2 Client
s3 = boto3.client(
    's3',
    endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name='auto'  # Must be auto for Cloudflare R2
)

TARGET_PREFIX = "media/VIDEO PROGRAMS/"

def get_vtt_timestamp(seconds):
    # Convert seconds to VTT timestamp mostly for reference if needed, 
    # but we store number in JSON.
    return seconds

def parse_vtt_and_convert(vtt_path, filename=""):
    segments = []
    
    # default speaker logic
    default_speaker = "Dr. Rashad Khalifa"
    # Specific override for "The Great Debate" (Index 8)
    if "temp_8_" in filename or "Great Debate" in filename:
        default_speaker = "Abdel Rahman"

    # Use webvtt-py if available, or manual parsing? 
    # Manual simple parsing to avoid dependencies if possible, 
    # but webvtt is standard. 
    # Let's do a robust manual parse similar to the TypeScript one we wrote,
    # but with merging logic.
    
    with open(vtt_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    cues = []
    current_cue = None
    
    # Basic VTT Parser
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.startswith('WEBVTT') or line.startswith('NOTE') or line.startswith('Kind:') or line.startswith('Language:'):
            continue
        
        # Timestamp match: 00:00:00.000 --> 00:00:00.000
        # or 00:00.000
        time_match = re.search(r'((?:\d{2}:)?\d{2}:\d{2}\.\d{3})\s-->\s((?:\d{2}:)?\d{2}:\d{2}\.\d{3})', line)
        if time_match:
            start_str, end_str = time_match.groups()
            
            def parse_time(t_str):
                parts = t_str.split(':')
                if len(parts) == 3:
                    return int(parts[0])*3600 + int(parts[1])*60 + float(parts[2])
                elif len(parts) == 2:
                    return int(parts[0])*60 + float(parts[1])
                return 0.0

            if current_cue:
                cues.append(current_cue)
            
            current_cue = {
                'start': parse_time(start_str),
                'end': parse_time(end_str),
                'text': []
            }
        elif current_cue:
            # Clean tags
            clean_text = re.sub(r'<[^>]+>', '', line)
            # Decode HTML entities
            clean_text = clean_text.replace('&nbsp;', ' ') \
                                   .replace('&amp;', '&') \
                                   .replace('&lt;', '<') \
                                   .replace('&gt;', '>') \
                                   .replace('&#39;', "'") \
                                   .replace('&quot;', '"')
            
            clean_text = clean_text.strip()
            
            if clean_text:
                current_cue['text'].append(clean_text)
                
    if current_cue:
        cues.append(current_cue)

    # --- MERGING LOGIC ---
    # Merge cues into sentences or larger blocks to form "speech bubbles"
    merged_segments = []
    if not cues:
        return []

    current_segment = {
        'start': cues[0]['start'],
        'end': cues[0]['end'],
        'content': " ".join(cues[0]['text']),
        'speaker': default_speaker 
    }

    for i in range(1, len(cues)):
        cue = cues[i]
        text = " ".join(cue['text'])
        
        # Heuristics for merging:
        # 1. If current segment content ends with [.?!], start new segment
        # 2. If pause between cues is > 1.0 second, start new segment
        # 3. If segment duration > 15 seconds, start new segment (prevent huge blocks)
        
        pause = cue['start'] - current_segment['end']
        duration = current_segment['end'] - current_segment['start']
        
        ended_sentence = bool(re.search(r'[.?!]$', current_segment['content']))
        
        if ended_sentence or pause > 2.0 or duration > 30:
            merged_segments.append(current_segment)
            current_segment = {
                'start': cue['start'],
                'end': cue['end'],
                'content': text,
                'speaker': default_speaker
            }
        else:
            # Merge
            current_segment['end'] = cue['end']
            current_segment['content'] += " " + text
            
    merged_segments.append(current_segment)
    
    # --- SPEAKER SPLIT POST-PROCESSING ---
    final_segments = []
    
    # Regex to catch "Name Name:" or "Dr. Name:"
    # Examples: "Abdel Rahman:", "Dr. Khalifa:", "Question:", "Audience:"
    speaker_pattern = re.compile(r'(?:^|\s)((?:Dr\.?\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?):')

    for seg in merged_segments:
        content = seg['content']
        total_duration = seg['end'] - seg['start']
        total_length = len(content)
        
        # Find all speaker matches
        matches = list(speaker_pattern.finditer(content))
        
        if not matches:
            # No speaker changes detected, keep original (defaulting to RK if generic)
            # But if the VTT text itself had no tags, we assume it's the main speaker.
            final_segments.append(seg)
            continue

        # If we have matches, we split
        current_idx = 0
        last_match_start = 0
        
        # Determine segments
        # Case 1: Text starts with Speaker
        # Case 2: Text has intro then Speaker
        
        sub_segments = []
        
        # If first match is not at start, we have "pre-speaker" text.
        # Who is it? previous speaker? or Default?
        first_match_start = matches[0].start()
        # Find start of the Name (group 1 is name, match start might include space)
        # We want the split point BEFORE the name.
        
        if first_match_start > 0:
             # Text before the first speaker label is assigned to DEFAULT (Dr. Rushad Khalifa)
             # or we could try to inherit from previous loop... assuming default for now.
             pre_text = content[0:first_match_start].strip()
             if pre_text:
                 sub_segments.append({
                     'speaker': default_speaker, 
                     'content': pre_text
                 })


        for i, match in enumerate(matches):
            speaker_name = match.group(1).strip()
            
            # Start of this speech content is 'end' of this match
            content_start = match.end()
            
            # End of this speech content is start of next match or end of string
            if i < len(matches) - 1:
                content_end = matches[i+1].start()
            else:
                content_end = len(content)
                
            speech_text = content[content_start:content_end].strip()
            
            # Add to list
            if speech_text:
                sub_segments.append({
                    'speaker': speaker_name,
                    'content': speech_text
                })

        # Now distribute timestamps proportionally
        # Total text length of all sub segments (excluding labels)
        segment_total_len = sum(len(s['content']) for s in sub_segments)
        if segment_total_len == 0: segment_total_len = 1 # avoid div zero
        
        current_time_cursor = seg['start']
        
        for sub in sub_segments:
            # Calc duration
            ratio = len(sub['content']) / segment_total_len
            sub_duration = total_duration * ratio
            
            final_segments.append({
                'start': current_time_cursor,
                'end': current_time_cursor + sub_duration,
                'content': sub['content'],
                'speaker': sub['speaker']
            })
            
            current_time_cursor += sub_duration

    # Format for App
    final_json = []
    for idx, seg in enumerate(final_segments):
        final_json.append({
            'id': idx,
            'start_time': seg['start'],
            'end_time': seg['end'],
            'speaker': seg['speaker'],
            'content': seg['content'].strip(),
            'segment_index': idx
        })
        
    return final_json

def run():
    print("Listing VTT files in R2...")
    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=R2_BUCKET_NAME, Prefix=TARGET_PREFIX)
    
    for page in pages:
        if 'Contents' not in page:
            continue
            
        for obj in page['Contents']:
            key = obj['Key']
            if key.endswith('.vtt'):
                # Check if JSON exists? Optional, but let's overwrite for now to be safe
                json_key = key.replace('.vtt', '.json')
                
                print(f"Processing {key}...")
                local_vtt = "temp.vtt"
                
                s3.download_file(R2_BUCKET_NAME, key, local_vtt)
                
                try:
                    json_data = parse_vtt_and_convert(local_vtt, filename=key)
                    
                    local_json = "temp.json"
                    with open(local_json, 'w', encoding='utf-8') as f:
                        json.dump(json_data, f, indent=2)
                        
                    print(f"Uploading JSON to {json_key}...")
                    s3.upload_file(local_json, R2_BUCKET_NAME, json_key)
                    
                    os.remove(local_json)
                except Exception as e:
                    print(f"Failed to convert {key}: {e}")
                
                if os.path.exists(local_vtt):
                    os.remove(local_vtt)

if __name__ == "__main__":
    run()
