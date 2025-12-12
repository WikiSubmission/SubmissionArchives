import json
import re
import os

with open('pdf_structure.json', 'r', encoding='utf-8') as f:
    chapters = json.load(f)

transcript_dir = r'c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts'
transcript_files = os.listdir(transcript_dir)

print(f"{'PDF Chapter':<60} | {'Proposed Transcript Match'}")
print("-" * 120)

for chap in chapters:
    title = chap['title']
    # Look for "XX Quran Study" or just "XX" if it's a Quran Study chapter
    # The user said "Quran Study 01", "02"...
    
    # regex for "XX Quran Study" or similar
    # My previous regex in the script was r'^(\d+)'
    match = re.search(r'^(\d+)\s+(.*)', title)
    if match:
        num = int(match.group(1))
        text_rest = match.group(2)
        
        # Check if it looks like a Quran Study
        # Some might be "What Life is All About" (Video Program) -> These usually don't have "Quran Study" in title?
        # Actually Chapter 1 is "01 What Life is All About..." (no Quran Study)
        # But "01 Quran Study From Azhar 1" (yes Quran Study)
        
        is_quran_study = "Quran Study" in title
        
        if is_quran_study:
            # Find matching transcript starting with "num)"
            prefix = f"{num})"
            found_file = None
            for tf in transcript_files:
                if tf.startswith(prefix):
                    found_file = tf
                    break
            
            print(f"{title[:60]:<60} | {found_file if found_file else 'NO MATCH FOUND'}")
