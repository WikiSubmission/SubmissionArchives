import json
import os

BASE_1992 = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1992 Quran.json"
FILE_1981 = r"c:\Users\Jonathan\Desktop\RKM\data\1981_extracted.json"
FILE_1989 = r"c:\Users\Jonathan\Desktop\RKM\data\1989_layout_extracted.json" # Use layout version
OUTPUT_FILE = r"c:\Users\Jonathan\Desktop\RKM\data\unified_quran.json"

def merge():
    print("Loading 1992 Baseline...")
    with open(BASE_1992, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    editions = {}
    
    if os.path.exists(FILE_1981):
        print("Loading 1981 Data...")
        with open(FILE_1981, 'r', encoding='utf-8') as f:
            editions['1981'] = json.load(f)
    else:
        print("Warning: 1981 Data missing.")
        
    if os.path.exists(FILE_1989):
        print("Loading 1989 Data...")
        with open(FILE_1989, 'r', encoding='utf-8') as f:
            editions['1989'] = json.load(f)
    else:
        print("Warning: 1989 Data missing.")
        
    stats = {'1981': 0, '1989': 0}
    
    print("Merging...")
    for item in data:
        chap = item['chapter_number']
        verse = item['verse_number']
        key = f"{chap}:{verse}"
        
        # Check 1981
        if '1981' in editions and key in editions['1981']:
            item['verse_text_1981'] = editions['1981'][key]
            stats['1981'] += 1
        else:
            item['verse_text_1981'] = None
            
        # Check 1989
        if '1989' in editions and key in editions['1989']:
            item['verse_text_1989'] = editions['1989'][key]
            stats['1989'] += 1
        else:
            item['verse_text_1989'] = None
            
    print("Merge Complete.")
    print(f"1981 Matches: {stats['1981']} / {len(data)}")
    print(f"1989 Matches: {stats['1989']} / {len(data)}")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    merge()
