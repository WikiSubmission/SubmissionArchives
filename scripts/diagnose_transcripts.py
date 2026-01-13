import os
import json
import re
from collections import Counter

DIRECTORIES = [
    r"C:\Users\Jonathan\Desktop\RKM\rk-media-platform\public\messenger_transcripts",
    r"C:\Users\Jonathan\Desktop\RKM\rk-media-platform\transcripts"
]

def analyze_transcripts():
    speaker_counts = Counter()
    issues = []
    
    total_files = 0
    total_segments = 0
    
    for directory in DIRECTORIES:
        if not os.path.exists(directory):
            print(f"Directory not found: {directory}")
            continue
            
        print(f"Scanning directory: {directory}")
        for filename in os.listdir(directory):
            if not filename.endswith(".json"):
                continue
                
            filepath = os.path.join(directory, filename)
            total_files += 1
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                if not isinstance(data, list):
                    continue
                    
                for item in data:
                    total_segments += 1
                    speaker = item.get('speaker', '').strip()
                    content = item.get('content', '').strip()
                    
                    speaker_counts[speaker] += 1
                    
                    # Check for potential issues
                    
                    # 1. Speaker has brackets or numbers (Verse reference bleed)
                    if re.search(r'[\[\]\d]', speaker) and len(speaker) < 10:
                        issues.append({
                            'type': 'speaker_has_numbers_brackets',
                            'file': filename,
                            'segment_index': item.get('segment_index'),
                            'speaker': speaker,
                            'content': content[:50]
                        })

                    # 2. Long speaker name (Content bleed)
                    if len(speaker) > 30:
                        issues.append({
                            'type': 'long_speaker_name',
                            'file': filename,
                            'segment_index': item.get('segment_index'),
                            'speaker': speaker,
                            'content': content[:50]
                        })
                        
                    # 3. Speaker looks like text (Spaces and length)
                    if ' ' in speaker and len(speaker) > 20 and not any(title in speaker for title in ['Dr.', 'Mr.', 'Mrs.']):
                         issues.append({
                            'type': 'speaker_looks_like_text',
                            'file': filename,
                            'segment_index': item.get('segment_index'),
                            'speaker': speaker,
                            'content': content[:50]
                        })

            except Exception as e:
                print(f"Error reading {filename}: {e}")

    output_lines = []
    output_lines.append(f"Total Files: {total_files}")
    output_lines.append(f"Total Segments: {total_segments}")
    output_lines.append("\n--- Top 20 Unique Speakers ---")
    for speaker, count in speaker_counts.most_common(20):
        output_lines.append(f"'{speaker}': {count}")
        
    output_lines.append("\n--- Potential Issues Found ---")
    output_lines.append(f"Total Issues: {len(issues)}")
    
    # Group issues by type
    issues_by_type = {}
    for issue in issues:
        t = issue['type']
        if t not in issues_by_type:
            issues_by_type[t] = []
        issues_by_type[t].append(issue)
        
    for t, items in issues_by_type.items():
        output_lines.append(f"\nType: {t} (Count: {len(items)})")
        # Print first 20 examples for better sampling
        for i in items[:20]:
            output_lines.append(f"  File: {i['file']}, Idx: {i['segment_index']}, Speaker: '{i['speaker']}'")

    with open('diagnostic_report.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(output_lines))
    print("Report written to diagnostic_report.txt")


if __name__ == "__main__":
    analyze_transcripts()
