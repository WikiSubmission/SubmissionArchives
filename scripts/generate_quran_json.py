import json
import os
import re

SOURCE_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\ws-quran-word-by-word_2025-09-19.json"
OUTPUT_DIR = r"c:\Users\Jonathan\Desktop\RKM\rk-media-platform\public\data\quran_morph"

def generate_quran_json():
    print(f"Reading source: {SOURCE_PATH}")
    try:
        with open(SOURCE_PATH, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
    except Exception as e:
        print(f"Failed to load source: {e}")
        return

    # Ensure output directory exists
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # Group by Chapter
    chapters = {}

    print(f"Processing {len(raw_data)} tokens...")

    for item in raw_data:
        # verse_id format "1:1"
        verse_id = item.get('verse_id')
        if not verse_id:
            continue
        
        try:
            sura_num, verse_num = map(int, verse_id.split(':'))
        except ValueError:
            print(f"Skipping malformed verse_id: {verse_id}")
            continue

        if sura_num not in chapters:
            chapters[sura_num] = {}

        if verse_num not in chapters[sura_num]:
            chapters[sura_num][verse_num] = []

        # Map to Generic Token Format
        # ReaderPanel expects: text, lemma, morph, gloss
        # Quran Source: arabic_text, root_word, English_text (short), meanings (long)
        
        token = {
            "text": item.get('arabic_text', ''),
            "lemma": item.get('root_word', ''),
            "gloss": item.get('english_text', ''), # Short contextual translation
            "morph": item.get('meanings', ''),     # Detailed lexicon definition
            "after": " " # Add space between words
        }
        
        chapters[sura_num][verse_num].append(token)

    # Write files
    print(f"Writing {len(chapters)} chapters...")
    for sura in sorted(chapters.keys()):
        verses = []
        verse_map = chapters[sura]
        for v_num in sorted(verse_map.keys()):
            verses.append({
                "verse": v_num,
                "tokens": verse_map[v_num]
            })
        
        output_file = os.path.join(OUTPUT_DIR, f"Sura_{sura}.json")
        with open(output_file, 'w', encoding='utf-8') as f_out:
            json.dump({"verses": verses}, f_out, ensure_ascii=False) # Minified to save space? Or standard? default is fine.
        
        # print(f"Written Sura {sura}")

    print("Done.")

if __name__ == "__main__":
    generate_quran_json()
