
import csv
import json
import os
import re

# Configuration
TSV_PATH = r"c:\Users\Jonathan\Desktop\RKM\macula-greek\Nestle1904\tsv\macula-greek-Nestle1904.tsv"
OUTPUT_DIR = r"c:\Users\Jonathan\Desktop\RKM\rk-media-platform\public\data\greek_nt"

# Ensure output directory exists (in public for easy fetching)
os.makedirs(OUTPUT_DIR, exist_ok=True)

def parse_tsv():
    print(f"Reading {TSV_PATH}...")
    
    # Structure: { "BookName": { "1": [Token, Token...], "2": [...] } }
    bible_data = {}

    with open(TSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        
        count = 0
        for row in reader:
            ref = row.get('ref', '') # e.g., "MAT 1:1!1"
            if not ref: continue

            # Parse Ref: MAT 1:1!1 -> Book: MAT, Chapter: 1, Verse: 1
            # Using regex to capture parts
            # Format usually: [BOOK] [H]:[V]![WordIndex]
            match = re.search(r'^([1-4A-Za-z]+)\s+(\d+):(\d+)', ref)
            if not match:
                continue

            book_code = match.group(1)
            chapter = match.group(2)
            verse = match.group(3)

            # Map Book Codes to Full Names if needed
            # For now keeping codes or simple mapping
            
            if book_code not in bible_data:
                bible_data[book_code] = {}
            if chapter not in bible_data[book_code]:
                bible_data[book_code][chapter] = {}
            if verse not in bible_data[book_code][chapter]:
                bible_data[book_code][chapter][verse] = []

            # Construct Token
            token = {
                "text": row.get('text', ''),
                "lemma": row.get('lemma', ''),
                "morph": row.get('morph', ''),
                "gloss": row.get('gloss', ''),
                "after": row.get('after', ' ') # spacing
            }
            
            bible_data[book_code][chapter][verse].append(token)
            count += 1
            if count % 10000 == 0:
                print(f"Processed {count} tokens...")

    print("Generation complete. Writing files...")

    # Write individual chapter files
    for book, chapters in bible_data.items():
        for ch_num, verses in chapters.items():
            # Flatten verses to list for JSON: [ {verse: 1, tokens: []}, ... ]
            verse_list = []
            # Sort verses numerically
            sorted_verses = sorted(verses.keys(), key=lambda x: int(x))
            
            for v_num in sorted_verses:
                verse_list.append({
                    "verse": int(v_num),
                    "tokens": verses[v_num]
                })

            filename = f"{book}_{ch_num}.json"
            out_path = os.path.join(OUTPUT_DIR, filename)
            
            with open(out_path, 'w', encoding='utf-8') as out_f:
                json.dump({
                    "book": book,
                    "chapter": int(ch_num),
                    "verses": verse_list
                }, out_f, ensure_ascii=False)
    
    print(f"Done! Files written to {OUTPUT_DIR}")

if __name__ == "__main__":
    parse_tsv()
