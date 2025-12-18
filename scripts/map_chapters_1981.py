import pdfplumber
import re
import json
import os
from tqdm import tqdm

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1981.pdf"
OUTPUT_MAP = r"c:\Users\Jonathan\Desktop\RKM\data\chapter_map_1981.json"

def map_chapters():
    print(f"Scanning {PDF_PATH} for chapter headers...")
    
    chapter_map = {}
    last_chapter_num = 0
    
    with pdfplumber.open(PDF_PATH) as pdf:
        total_pages = len(pdf.pages)
        
        # Scan all pages
        for i, page in enumerate(tqdm(pdf.pages)):
            page_num = i + 1
            
            # Extract words with font info
            # Heuristic: Size >= 20 (based on analysis finding Size 40)
            words = page.extract_words(extra_attrs=['fontname', 'size'])
            
            for w_idx, w in enumerate(words):
                txt = w['text']
                size = w['size']
                
                # Check Header Signature
                # "Sura" or "Chapter" with large font
                is_header_candidate = (
                    ('Sura' in txt or 'Chapter' in txt) and
                    size >= 25 # Analysis showed 40, so 25 is safe
                )
                
                if is_header_candidate:
                    # Look for number in next 1-2 words
                    chap_num = -1
                    
                    # Check next word
                    if w_idx + 1 < len(words):
                        next_w = words[w_idx+1]
                        cleaned = re.sub(r'[^\d]', '', next_w['text'])
                        if cleaned:
                            chap_num = int(cleaned)
                    
                    if chap_num != -1:
                        # Enforce strict sequence to avoid Index noise
                        # 1. Must be > last_chapter_num
                        # 2. Must be <= last_chapter_num + 2 (allow 1 skip in case of error, but preferably 0)
                        # 3. Must not overwrite existing
                        
                        if chap_num <= last_chapter_num:
                            # Likely index or repeat or previous chapter ref
                            continue
                            
                        if chap_num > last_chapter_num + 5:
                            # Way out of sequence -> Noise or Index
                            # Exception: Chapter 1 is 1. last is 0.
                            if not (last_chapter_num == 0 and chap_num == 1):
                                continue

                        print(f"Found Chapter {chap_num} on Page {page_num} at Y={w['top']:.2f}")
                        
                        # Close previous chapter
                        if last_chapter_num in chapter_map:
                            chapter_map[last_chapter_num]['end_page'] = page_num
                            chapter_map[last_chapter_num]['end_y'] = w['top']
                        
                        # Start new chapter
                        chapter_map[chap_num] = {
                            'start_page': page_num,
                            'start_y': w['top'],
                            'end_page': -1,
                            'end_y': -1
                        }
                        
                        last_chapter_num = chap_num
                        
        # Close the last chapter
        if last_chapter_num in chapter_map:
            chapter_map[last_chapter_num]['end_page'] = total_pages
            chapter_map[last_chapter_num]['end_y'] = 9999

    # Save
    with open(OUTPUT_MAP, 'w') as f:
        json.dump(chapter_map, f, indent=2)
        
    print(f"Map saved to {OUTPUT_MAP}")
    print(f"Mapped {len(chapter_map)} chapters.")

if __name__ == "__main__":
    map_chapters()
