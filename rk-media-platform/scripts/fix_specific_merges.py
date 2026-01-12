import json
import os
import re

DIR = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\rk-media-platform\reprocess_ready"

# Map of issues to fix
# Format: (filename_pattern, issue_description, fix_function)

def find_file(pattern):
    """Find file matching pattern"""
    for f in os.listdir(DIR):
        if pattern in f and f.endswith('.json'):
            return os.path.join(DIR, f)
    return None

def fix_qs12_messenger(filepath):
    """Fix QS 12: 'The messenger:' merged with Dr. Sabahi"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified = False
    for i, seg in enumerate(data):
        if seg.get('speaker') == 'Dr. Sabahi' and 'The messenger:' in seg.get('content', ''):
            content = seg['content']
            # Find "The messenger:" and split
            match = re.search(r'(.*?)\s*The messenger:\s*(.*)', content, re.IGNORECASE)
            if match:
                before_text = match.group(1).strip()
                after_text = match.group(2).strip()
                
                if before_text:
                    seg['content'] = before_text
                    
                    # Create new segment for The messenger
                    duration = seg['end_time'] - seg['start_time']
                    split_ratio = len(before_text) / (len(before_text) + len(after_text)) if (len(before_text) + len(after_text)) > 0 else 0.5
                    split_time = seg['start_time'] + (duration * split_ratio)
                    
                    new_seg = {
                        'id': f"{seg['id']}_messenger",
                        'start_time': split_time,
                        'end_time': seg['end_time'],
                        'speaker': 'The messenger',
                        'content': after_text,
                        'segment_index': seg['segment_index'] + 1
                    }
                    
                    seg['end_time'] = split_time
                    data.insert(i + 1, new_seg)
                    modified = True
                    print(f"Fixed QS12: Split 'The messenger:' from Dr. Sabahi")
                    break
    
    if modified:
        # Re-index
        for idx, s in enumerate(data):
            s['segment_index'] = idx
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    return modified

def fix_qs17_girl(filepath):
    """Fix QS 17: 'A girl:' merged with Dr. Khalifa"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified = False
    for i, seg in enumerate(data):
        if seg.get('speaker') == 'Dr. Khalifa' and 'A girl:' in seg.get('content', ''):
            content = seg['content']
            match = re.search(r'(.*?)\s*A girl:\s*(.*)', content, re.IGNORECASE)
            if match:
                before_text = match.group(1).strip()
                after_text = match.group(2).strip()
                
                if before_text:
                    seg['content'] = before_text
                    
                    duration = seg['end_time'] - seg['start_time']
                    split_ratio = len(before_text) / (len(before_text) + len(after_text)) if (len(before_text) + len(after_text)) > 0 else 0.5
                    split_time = seg['start_time'] + (duration * split_ratio)
                    
                    new_seg = {
                        'id': f"{seg['id']}_girl",
                        'start_time': split_time,
                        'end_time': seg['end_time'],
                        'speaker': 'A girl',
                        'content': after_text,
                        'segment_index': seg['segment_index'] + 1
                    }
                    
                    seg['end_time'] = split_time
                    data.insert(i + 1, new_seg)
                    modified = True
                    print(f"Fixed QS17: Split 'A girl:' from Dr. Khalifa")
                    break
    
    if modified:
        for idx, s in enumerate(data):
            s['segment_index'] = idx
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    return modified

def fix_qs21_footnote(filepath):
    """Fix QS 21: 'The footnote' as speaker"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified = False
    for seg in data:
        if seg.get('speaker') == 'The footnote':
            # Change speaker to Dr. Khalifa and prepend to content
            seg['content'] = f"The footnote: {seg['content']}"
            seg['speaker'] = 'Dr. Khalifa'
            modified = True
    
    if modified:
        print(f"Fixed QS21: Changed 'The footnote' speaker to Dr. Khalifa")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    return modified

def fix_qs22_parivash(filepath):
    """Fix QS 22: 'Parivash:' merged with Dr. Khalifa"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified = False
    for i, seg in enumerate(data):
        if seg.get('speaker') == 'Dr. Khalifa' and 'Parivash:' in seg.get('content', ''):
            content = seg['content']
            match = re.search(r'(.*?)\s*Parivash:\s*(.*)', content, re.IGNORECASE)
            if match:
                before_text = match.group(1).strip()
                after_text = match.group(2).strip()
                
                if before_text:
                    seg['content'] = before_text
                    
                    duration = seg['end_time'] - seg['start_time']
                    split_ratio = len(before_text) / (len(before_text) + len(after_text)) if (len(before_text) + len(after_text)) > 0 else 0.5
                    split_time = seg['start_time'] + (duration * split_ratio)
                    
                    new_seg = {
                        'id': f"{seg['id']}_parivash",
                        'start_time': split_time,
                        'end_time': seg['end_time'],
                        'speaker': 'Parivash',
                        'content': after_text,
                        'segment_index': seg['segment_index'] + 1
                    }
                    
                    seg['end_time'] = split_time
                    data.insert(i + 1, new_seg)
                    modified = True
                    print(f"Fixed QS22: Split 'Parivash:' from Dr. Khalifa")
                    break
    
    if modified:
        for idx, s in enumerate(data):
            s['segment_index'] = idx
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    return modified

def fix_qs25_khalifa(filepath):
    """Fix QS 25: 'Dr. Khalifa:' merged with A man"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified = False
    for i, seg in enumerate(data):
        if seg.get('speaker') == 'A man' and 'Dr. Khalifa:' in seg.get('content', ''):
            content = seg['content']
            match = re.search(r'(.*?)\s*Dr\.\s*Khalifa:\s*(.*)', content, re.IGNORECASE)
            if match:
                before_text = match.group(1).strip()
                after_text = match.group(2).strip()
                
                if before_text:
                    seg['content'] = before_text
                    
                    duration = seg['end_time'] - seg['start_time']
                    split_ratio = len(before_text) / (len(before_text) + len(after_text)) if (len(before_text) + len(after_text)) > 0 else 0.5
                    split_time = seg['start_time'] + (duration * split_ratio)
                    
                    new_seg = {
                        'id': f"{seg['id']}_khalifa",
                        'start_time': split_time,
                        'end_time': seg['end_time'],
                        'speaker': 'Dr. Khalifa',
                        'content': after_text,
                        'segment_index': seg['segment_index'] + 1
                    }
                    
                    seg['end_time'] = split_time
                    data.insert(i + 1, new_seg)
                    modified = True
                    print(f"Fixed QS25: Split 'Dr. Khalifa:' from A man")
                    break
    
    if modified:
        for idx, s in enumerate(data):
            s['segment_index'] = idx
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    return modified

# Execute fixes
fixes = [
    ("12) Quran Study", "Behrouz", fix_qs12_messenger),
    ("17) Quran Study", "Q.82-83", fix_qs17_girl),
    ("21) Quran Study", "Hypocrites", fix_qs21_footnote),
    ("22) Quran Study", "Q.39", fix_qs22_parivash),
    ("25) Quran Study", "Q.58", fix_qs25_khalifa),
]

print("Fixing transcript speaker merges...")
for pattern1, pattern2, fix_func in fixes:
    # Try to find file with both patterns
    filepath = None
    for f in os.listdir(DIR):
        if pattern1 in f and pattern2 in f and f.endswith('.json'):
            filepath = os.path.join(DIR, f)
            break
    
    if filepath:
        print(f"\nProcessing: {os.path.basename(filepath)}")
        fix_func(filepath)
    else:
        print(f"\nWarning: Could not find file matching '{pattern1}' and '{pattern2}'")

print("\nDone!")
