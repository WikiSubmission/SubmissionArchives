import csv
import re
import sys
import os

def is_valid_speaker(name):
    lower = name.lower()
    if re.match(r'^\d', lower): return False
    if re.match(r'^\[', lower): return False
    if lower in ['say', 'said', 'says']: return False
    if re.match(r'^verse', lower): return False
    if re.match(r'^ok\.', lower): return False
    if re.match(r'^chapter', lower): return False
    if re.match(r'^sura', lower): return False
    if re.match(r'^iron$', lower): return False
    if re.match(r'^unity$', lower): return False
    if re.match(r'^believers$', lower): return False
    if re.match(r'^idol worship$', lower): return False
    if re.match(r'^following', lower): return False
    if re.match(r'^materials', lower): return False
    if 'order' in lower: return False
    if 'miracle' in lower: return False
    if 'title' in lower: return False
    if 'quran' in lower: return False
    if len(lower) > 50: return False

    known_prefixes = [
        'dr.', 'dr', 'a man', 'a woman', 'a child', 'a person', 'a kid',
        'the messenger', 'the footnote', 'audience', 'people'
    ]
    if any(lower.startswith(p) for p in known_prefixes):
        return True
    
    if re.match(r'^a\s+(man|woman|child|person|kid)$', lower, re.I):
        return True
    
    if re.match(r'^[A-Z][a-z]+$', name) or re.match(r'^[A-Z][a-z]+\s+[A-Z][a-z]+$', name):
        return True
    
    if re.match(r'^Dr\.?\s+', name, re.I):
        return True
        
    return False

def normalize_speaker(name):
    lower = name.lower()
    if any(x in lower for x in ['khalifa', 'khlaifa', 'khalfia']) or lower == 'rashad':
        return 'Dr. Khalifa'
    if lower in ['kathryn', 'cathy', 'kathy']: return 'Catherine'
    if any(x in lower for x in ['ismail', 'isamil', 'ismali', 'isamail']):
        if 'barakat' in lower or 'barakt' in lower:
            return 'Ismail Barakat'
    if 'mahmood' in lower and 'abib' in lower: return 'Mahmood Abib'
    if any(x in lower for x in ['parivash', 'parviash', 'praivash']): return 'Parivash'
    if 'muhtesem' in lower or 'muhteshem' in lower: return 'Muhtesem'
    if 'sabahi' in lower or 'sabahai' in lower: return 'Dr. Sabahi'
    if lower in ['laurie', 'lauri']: return 'Lori'
    if lower == 'laila': return 'Leila'
    if lower == 'the messenger': return 'Dr. Khalifa'
    return name

def parse_time(time_str):
    parts = time_str.split(':')
    if len(parts) == 3:
        return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
    elif len(parts) == 2:
        return float(parts[0]) * 60 + float(parts[1])
    return float(parts[0])

def format_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02}:{minutes:02}:{secs:02}.{millis:03}"

# The regex matches a speaker pattern anywhere in the text
speaker_pattern = re.compile(r'(?:^|\s)((?:[Aa]\s+woman\s+and\s+a\s+group\s+of\s+children)|(?:[Tt]he\s+messenger)|(?:[Aa]\s+(?:man|woman|child|person|kid))|(?:(?:[Dd]r\.?\s+)?(?:[Tt]he\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)):\s*')

def process_csv(filepath):
    print(f"Processing {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = list(csv.DictReader(f))
    
    current_speaker = 'Dr. Khalifa'
    new_rows = []
    
    for row in reader:
        content = row['Text'].strip()
        if not content:
            continue
            
        start_time = parse_time(row['Start Time'])
        end_time = parse_time(row['End Time'])
        total_duration = end_time - start_time
        
        matches = list(speaker_pattern.finditer(content))
        valid_matches = []
        for m in matches:
            speaker_name = m.group(1).strip()
            if is_valid_speaker(speaker_name):
                valid_matches.append(m)
                
        if not valid_matches:
            new_rows.append({
                'Video Title': row['Video Title'],
                'Link': row['Link'],
                'Start Time': row['Start Time'],
                'End Time': row['End Time'],
                'Text': content,
                'Speaker': current_speaker
            })
        else:
            sub_segments = []
            first_match_start = valid_matches[0].start()
            if first_match_start > 0:
                pre_text = content[0:first_match_start].strip()
                if pre_text:
                    sub_segments.append({'speaker': current_speaker, 'content': pre_text})
                    
            for i in range(len(valid_matches)):
                match = valid_matches[i]
                speaker_name = normalize_speaker(match.group(1).strip())
                content_start = match.end()
                content_end = valid_matches[i+1].start() if i < len(valid_matches) - 1 else len(content)
                
                speech_text = content[content_start:content_end].strip()
                if speech_text:
                    sub_segments.append({'speaker': speaker_name, 'content': speech_text})
                    
            total_length = sum(len(s['content']) for s in sub_segments) or 1
            current_time_cursor = start_time
            
            for sub in sub_segments:
                ratio = len(sub['content']) / total_length
                sub_duration = total_duration * ratio
                current_speaker = sub['speaker']
                
                new_rows.append({
                    'Video Title': row['Video Title'],
                    'Link': row['Link'],
                    'Start Time': format_time(current_time_cursor),
                    'End Time': format_time(current_time_cursor + sub_duration),
                    'Text': sub['content'],
                    'Speaker': current_speaker
                })
                
                current_time_cursor += sub_duration

    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['Video Title', 'Link', 'Start Time', 'End Time', 'Text', 'Speaker']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(new_rows)
        
    print(f"Done processing {filepath}")

import glob
csvs = glob.glob('data/sources/playlists/audio-transcripts/70*.csv') + glob.glob('data/sources/playlists/audio-transcripts/71*.csv') + glob.glob('data/sources/playlists/audio-transcripts/72*.csv')
for c in csvs:
    process_csv(c)
