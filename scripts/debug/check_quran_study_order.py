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
    with open('pdf_structure.json', 'r', encoding='utf-8') as f:
        chapters = json.load(f)
        
    qs_chapters = []
    for chap in chapters:
        if "Quran Study" in chap['title']:
            qs_chapters.append(chap)
            
    print(f"Found {len(qs_chapters)} Quran Study chapters.")
    
    transcript_dir = r'c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts'
    files = os.listdir(transcript_dir)
    
    # Sort files by the numeric prefix "X)"
    # Need to handle "1)" vs "10)"
    def get_num(fname):
        m = re.match(r'^(\d+)', fname)
        return int(m.group(1)) if m else 999
        
    sorted_files = sorted([f for f in files if re.match(r'^\d+\)', f)], key=get_num)
    
    # Check alignment for first few
    for idx, chap in enumerate(qs_chapters):
        seq_num = idx + 1 # 1-based index
        
        print(f"\nOrder #{seq_num} | PDF Title: {chap['title']}")
        
        # Proposed file match
        # Find file starting with "seq_num)"
        target_file = None
        prefix = f"{seq_num})"
        for f in sorted_files:
            if f.startswith(prefix):
                target_file = f
                break
                
        if target_file:
            print(f"  -> Proposed File: {target_file}")
            
            # Content check
            pdf_text = normalize_text(chap['text'][:500])
            
            tpath = os.path.join(transcript_dir, target_file)
            with open(tpath, 'r', encoding='utf-8') as tf:
                tdata = json.load(tf)
            
            start_text = ""
            for seg in tdata.get('segments', [])[:10]:
                start_text += seg.get('text', "") + " "
            json_text = normalize_text(start_text)
            
            ratio = difflib.SequenceMatcher(None, pdf_text, json_text).ratio()
            print(f"  -> Match Score: {ratio:.3f}")
            if ratio < 0.1:
                print(f"     WARN: Low score. PDF Start: {pdf_text[:50]}...")
                print(f"                      JSON Start: {json_text[:50]}...")
        else:
            print(f"  -> No file found for {seq_num})")
            
        if idx > 4 and ratio < 0.1: # Stop if fails early
             pass
        if idx > 10: break # Check first 10

if __name__ == "__main__":
    main()
