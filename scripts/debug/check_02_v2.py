import json
import difflib
import re
import os

def normalize_text(text):
    text = text.lower()
    text = re.sub(r'\[.*?\]', '', text) 
    text = re.sub(r'[^\w\s]', '', text)
    return text.strip()

def main():
    # Load PDF
    with open('pdf_structure.json', 'r', encoding='utf-8') as f:
        chapters = json.load(f)
    
    chap02 = None
    for c in chapters:
        # specificity: Must contain "Quran Study"
        if c['title'].startswith("02") and "Quran Study" in c['title']:
            chap02 = c
            break
            
    if not chap02: 
        print("Chapter 02 (Quran Study) not found")
        # List all 02s to be sure
        for c in chapters:
            if c['title'].startswith("02"):
                print(f"Found other 02: {c['title']}")
        return

    print(f"Target PDF Chapter: {chap02['title']}")
    pdf_text = normalize_text(chap02['text'][:1000])
    
    # Check 2)
    t2 = r'c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts\2) Quran Study 8⧸4⧸89, Sura 95 & 96 by M. Sabahi, 2 verses of Sura 95 ... - Rashad Khalifa_diarized.json'
    if os.path.exists(t2):
        with open(t2, 'r', encoding='utf-8') as f:
            data = json.load(f)
        start_text = ""
        for seg in data.get('segments', [])[:15]: 
            start_text += seg.get('text', "") + " "
        json_text = normalize_text(start_text)
        ratio = difflib.SequenceMatcher(None, pdf_text, json_text).ratio()
        print(f"\nComparing with 2): {os.path.basename(t2)}")
        print(f"Score: {ratio:.3f}")
        print("JSON Start:", json_text[:100])

    # Check 33)
    t33 = r'c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts\33) Quran Study 6⧸2⧸89, Sura 74 by Mahmoud Sabahi - Rashad Khalifa_diarized.json'
    if os.path.exists(t33):
        with open(t33, 'r', encoding='utf-8') as f:
            data = json.load(f)
        start_text = ""
        for seg in data.get('segments', [])[:15]: 
            start_text += seg.get('text', "") + " "
        json_text = normalize_text(start_text)
        ratio = difflib.SequenceMatcher(None, pdf_text, json_text).ratio()
        print(f"\nComparing with 33): {os.path.basename(t33)}")
        print(f"Score: {ratio:.3f}")
        print("JSON Start:", json_text[:100])

if __name__ == "__main__":
    main()
