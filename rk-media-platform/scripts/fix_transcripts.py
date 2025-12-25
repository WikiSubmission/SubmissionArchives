import os
import json
import re

DIRECTORIES = [
    r"C:\Users\Jonathan\Desktop\RKM\rk-media-platform\public\messenger_transcripts",
    r"C:\Users\Jonathan\Desktop\RKM\rk-media-platform\transcripts"
]

KNOWN_SPEAKERS = [
    "Dr. Khalifa", "A man", "A woman", "Dr. Sabahi", "Edip", "Catherine", 
    "Dean Mahmoud", "Douglas", "Hamid", "Apamea", "Behrouz", "Ismail Barakat", 
    "Shakira", "Lisa", "Parivash", "Lori", "Robert", "Gatut", "Donna", "Gary", "Des Dean"
]

# Escape for regex
ESCAPED_SPEAKERS = [re.escape(s) for s in KNOWN_SPEAKERS]
SPEAKER_PATTERN = r'^(.*?)[\.\?!]\s+(' + '|'.join(ESCAPED_SPEAKERS) + r')$'

def fix_transcripts(dry_run=True):
    report_lines = []
    changes_count = 0
    
    report_lines.append(f"Dry Run: {dry_run}")
    report_lines.append("-" * 40)

    for directory in DIRECTORIES:
        if not os.path.exists(directory):
            continue
            
        for filename in os.listdir(directory):
            if not filename.endswith(".json"):
                continue
                
            filepath = os.path.join(directory, filename)
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                if not isinstance(data, list):
                    continue
                
                file_modified = False
                prev_speaker = ""
                
                for idx, item in enumerate(data):
                    original_speaker = item.get('speaker', '').strip()
                    original_content = item.get('content', '').strip()
                    
                    new_speaker = original_speaker
                    new_content = original_content
                    action_taken = None
                    
                    # Heuristic 1: Fix Sura/Verse Brackets (e.g., Speaker "[7")
                    # Pattern: Speaker matches ^\[\d+$ AND Content matches ^\d+\]
                    if re.match(r'^\[\d+$', original_speaker) and re.match(r'^\d+\]', original_content):
                        # Construct new content: "[7:179] ..."
                        # The speaker had "[7", content started with "179] ..."
                        # We want "[7:179] ..."
                        # So we take the number from speaker (remove bracket), add ':', then add content
                        sura_num = original_speaker.strip('[')
                        new_content = f"[{sura_num}:{original_content}" 
                        
                        # Inherit previous speaker if valid, otherwise unknown but clear the bracket junk
                        # If prev_speaker was also junk, this might propagate, but usually these come in blocks
                        # Safety check: if prev_speaker looks like junk too, maybe just empty string
                        if re.match(r'^\[\d+$', prev_speaker):
                             new_speaker = "" 
                        else:
                             new_speaker = prev_speaker
                             
                        action_taken = "Merged Bracket Speaker"

                    # Heuristic 2: Fix Trailing Speaker Name (Swap/Bleed)
                    # Pattern: "Some text. Dr. Khalifa"
                    elif len(original_speaker) > 20 and re.search(SPEAKER_PATTERN, original_speaker): 
                        match = re.search(SPEAKER_PATTERN, original_speaker)
                        text_part = match.group(1)
                        found_name = match.group(2)
                        
                        new_speaker = found_name
                        # Prepend text part to content, separated by space if needed
                        new_content = f"{text_part}. {original_content}"
                        action_taken = f"Extracted Trailing Speaker ({found_name})"

                    # Heuristic 3: Fix Full Content in Speaker (Verses in speaker field)
                    # Pattern: contains (1, (113, or Arabic
                    elif (re.search(r'\(\d+', original_speaker) and len(original_speaker) > 15) or (re.search(r'[\u0600-\u06FF]', original_speaker) and len(original_speaker) > 20):
                        # It's likely content.
                        new_speaker = "Reciter" # Default for these verse blocks
                        new_content = f"{original_speaker} {original_content}"
                        action_taken = "Moved Verse Content from Speaker"

                    # Heuristic 4: Backfill Empty Speakers
                    # If speaker is empty, inherit from previous
                    if not new_speaker and prev_speaker:
                        new_speaker = prev_speaker
                        if not action_taken: # specific action wasn't already logged
                             action_taken = "Backfilled Speaker"

                    if action_taken:
                        changes_count += 1
                        report_lines.append(f"File: {filename} | Seg: {idx}")
                        report_lines.append(f"  Action: {action_taken}")
                        report_lines.append(f"  Old Spk: '{original_speaker}'")
                        report_lines.append(f"  New Spk: '{new_speaker}'")
                        report_lines.append(f"  Old Con: '{original_content[:30]}...'")
                        report_lines.append(f"  New Con: '{new_content[:30]}...'")
                        report_lines.append("")
                        
                        item['speaker'] = new_speaker
                        item['content'] = new_content
                        file_modified = True
                    
                    # Update prev_speaker for next iteration (use NEW speaker)
                    prev_speaker = new_speaker

                if not dry_run and file_modified:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        json.dump(data, f, indent=2, ensure_ascii=False)
                        
            except Exception as e:
                print(f"Error processing {filename}: {e}")

    report_lines.append("-" * 40)
    report_lines.append(f"Total Segments Changed: {changes_count}")
    
    with open('fix_plan_report.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(report_lines))
    print(f"Report written to fix_plan_report.txt. Total changes: {changes_count}")

if __name__ == "__main__":
    # Run for real
    fix_transcripts(dry_run=False)
