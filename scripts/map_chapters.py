import pdfplumber
import re
import json
import os
from tqdm import tqdm

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"
OUTPUT_MAP = r"c:\Users\Jonathan\Desktop\RKM\data\chapter_map_1989.json"

def map_chapters():
    print(f"Scanning {PDF_PATH} for chapter headers...")
    
    chapter_map = {}
    last_chapter_num = 0
    
    with pdfplumber.open(PDF_PATH) as pdf:
        total_pages = len(pdf.pages)
        
        # Determine scan range. 
        # Start from Page 20 (Index 19) based on findings.
        # But we'll scan from 0 to be safe, filtering by font.
        
        for i, page in enumerate(tqdm(pdf.pages)):
            page_num = i + 1
            
            # Extract words with font info
            # We look for "Sura" or "Chapter" with Size >= 14 and Bold
            words = page.extract_words(extra_attrs=['fontname', 'size'])
            
            for w_idx, w in enumerate(words):
                txt = w['text']
                
                # Check Header Signature
                # "Sura" or "Chapter"
                # Font size >= 14
                # "Bold" in fontname (TimesNewRomanPS-BoldMT)
                
                is_header_candidate = (
                    ('Sura' in txt or 'Chapter' in txt or 'SURA' in txt) and
                    w['size'] >= 14 and
                    ('Bold' in w['fontname'] or 'Heavy' in w['fontname'])
                )
                
                if is_header_candidate:
                    # Look for number in next 1-2 words
                    # Header might be "Sura 1" or "Sura 1."
                    chap_num = -1
                    
                    # Check next word
                    if w_idx + 1 < len(words):
                        next_w = words[w_idx+1]
                        # Try parsing int
                        cleaned = re.sub(r'[^\d]', '', next_w['text'])
                        if cleaned:
                            chap_num = int(cleaned)
                    
                    if chap_num != -1:
                        # Found a chapter!
                        print(f"Found Chapter {chap_num} on Page {page_num} at Y={w['top']:.2f}")
                        
                        # Validate sequence (optional, but good for safety)
                        # if chap_num != last_chapter_num + 1 and last_chapter_num != 0:
                        #    print(f"WARNING: Jumped from {last_chapter_num} to {chap_num}!")
                        
                        # Close previous chapter
                        if last_chapter_num in chapter_map:
                            chapter_map[last_chapter_num]['end_page'] = page_num
                            chapter_map[last_chapter_num]['end_y'] = w['top'] # Ends at the header of the next one
                        
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
