import json
import difflib
import re
import os

def normalize_text(text):
    text = text.lower()
    text = re.sub(r'\[.*?\]', '', text) # Remove timestamps/speakers
    text = re.sub(r'[^\w\s]', '', text) # Remove punctuation
    return text.strip()

def main():
    # Load PDF Structure
    print("Loading PDF Structure...")
    with open('pdf_structure.json', 'r', encoding='utf-8') as f:
        chapters = json.load(f)
    
    # Find Azhar Chapter
    target_chap = None
    for chap in chapters:
        if "Azhar 1" in chap['title']:
            target_chap = chap
            break
            
    if not target_chap:
        print("Could not find 'From Azhar 1' chapter in PDF structure")
        return

    print(f"Found PDF Chapter: {target_chap['title']}")
    pdf_text = target_chap['text']
    clean_pdf = normalize_text(pdf_text[:1000])
    
    # Load Transcript
    transcript_path = r'c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts\1) Quran Study 5⧸26⧸89  Sura 72_19 28 & 73 by Kathryn, Jinns - Rashad Khalifa_diarized.json'
    
    if not os.path.exists(transcript_path):
        print(f"Transcript file not found: {transcript_path}")
        return
        
    print(f"Loading Transcript: {os.path.basename(transcript_path)}")
    with open(transcript_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    start_text = ""
    for seg in data.get('segments', [])[:20]:
        start_text += seg.get('text', "") + " "
    
    clean_json = normalize_text(start_text)
    
    # Compare
    ratio = difflib.SequenceMatcher(None, clean_pdf, clean_json).ratio()
    print(f"Match Score: {ratio:.4f}")
    
    print("\nPDF Start:")
    print(clean_pdf[:200])
    print("\nJSON Start:")
    print(clean_json[:200])

if __name__ == "__main__":
    main()
