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
        if c['title'].startswith("02"):
            chap02 = c
            break
            
    if not chap02: 
        print("Chapter 02 not found")
        return

    print(f"PDF Chapter 02: {chap02['title']}")
    pdf_text = normalize_text(chap02['text'][:500])
    
    # Load Transcript 2
    t2 = r'c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts\2) Quran Study 8⧸4⧸89, Sura 95 & 96 by M. Sabahi, 2 verses of Sura 95 ... - Rashad Khalifa_diarized.json'
    
    if os.path.exists(t2):
        with open(t2, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        start_text = ""
        for seg in data.get('segments', [])[:10]: # First 10 segments
            start_text += seg.get('text', "") + " "
            
        json_text = normalize_text(start_text)
        
        print(f"\nComparing with: {os.path.basename(t2)}")
        print(f"Ratio: {difflib.SequenceMatcher(None, pdf_text, json_text).ratio():.3f}")
        print("\nPDF Start:\n", pdf_text)
        print("\nJSON Start:\n", json_text)
    else:
        print("Transcript 2) not found")

if __name__ == "__main__":
    main()
