import re
import json
import os
from pypdf import PdfReader

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1981.pdf"
OUTPUT_PATH = r"c:\Users\Jonathan\Desktop\RKM\data\1981_extracted.json"

def normalize(text):
    """Refine text by removing extra whitespace."""
    return re.sub(r'\s+', ' ', text).strip()

def parse_pdf():
    reader = PdfReader(PDF_PATH)
    
    extracted_data = {} # Key: "C:V", Value: Text
    
    # Range 13 to 505 (Indices 12 to 504)
    # Start Page 13 (Sura 1)
    START_PAGE = 12 
    END_PAGE = 505
    
    current_chapter = None
    current_verse_num = None
    current_verse_text = []
    
    header_patterns = [
        re.compile(r'.*?(\d+):(\d+)-(\d+).*?'), # 2:1-10
        re.compile(r'^Sura\s+(\d+)', re.IGNORECASE),
        re.compile(r'^Chapter\s+(\d+)', re.IGNORECASE),
        re.compile(r'.*?Sura\s+(\d+).*?', re.IGNORECASE) # Catch embedded "Sura 2:"
    ]
    
    # Verse Regex: 1981 edition "1. Text"
    # Layout mode might add spaces: "1   . Text" or "1.    Text"
    verse_start_pattern = re.compile(r'^\W*(\d+)\.\s+(.*)') 

    print(f"Parsing 1981 PDF (Pages {START_PAGE+1}-{END_PAGE})...")
    
    for i in range(START_PAGE, min(END_PAGE, len(reader.pages))):
        page = reader.pages[i]
        try:
            text = page.extract_text(extraction_mode="layout")
        except:
            text = page.extract_text()
            
        if not text: continue
        
        lines = text.split('\n')
        
        # Header Detection
        # Check first few lines
        header_candidate = None
        for k in range(min(3, len(lines))):
            line = lines[k].strip()
            if not line: continue
            
            for pat in header_patterns:
                m = pat.search(line) # Use search to find inside line
                if m:
                    header_candidate = int(m.group(1))
                    break
            if header_candidate: break
            
        if header_candidate:
            # If we jump from 2 to 3, good.
            if current_chapter != header_candidate:
                current_chapter = header_candidate
                # print(f"Page {i+1}: Chapter {current_chapter}")

        for line in lines:
            line = line.strip()
            if not line: continue
            
            # Skip page numbers (numbers alone)
            if line.isdigit(): continue
            if "Appendix" in line: continue

            v_match = verse_start_pattern.match(line)
            if v_match:
                v_num = int(v_match.group(1))
                v_text = v_match.group(2)
                
                # Verify Chapter Transition if Header missed
                if v_num == 1:
                    if current_chapter is None:
                        current_chapter = 1 # Start
                    elif current_verse_num and v_num < current_verse_num:
                        # New Chapter logic
                        # If header missed, increment?
                        # But wait, sometimes 1 comes after 286.
                        if header_candidate and header_candidate != current_chapter:
                             current_chapter = header_candidate
                        else:
                             # Assume increment if strict reset
                             current_chapter += 1
                
                if current_chapter is None: continue

                # Save previous
                if current_verse_num is not None:
                    # We need to save under the OLD chapter/verse combo?
                    # No, `current_verse_num` belongs to `current_chapter` (mostly)
                    # EXCEPT when we just switched `current_chapter` above.
                    # If we switched, the buffer belongs to OLD chapter.
                    # But I updated `current_chapter` BEFORE saving!
                    # BUG.
                    
                    # Fix: Saving uses the vars stored alongside buffer.
                    # But I don't have separate vars.
                    # Simple fix: Flush BEFORE updating state.
                    pass 

                # Reworked Loop Logic for Atomic Saving
                pass

    # Use a robust state machine
    extracted_data = {}
    
    curr_chap = None
    curr_v_num = None
    curr_text_buffer = []
    
    # We need to track chapter separately from the "Next Verse" logic
    # The header gives us the "Page's Chapter".
    # But a page might finish Chap 2 and start Chap 3.
    # If we see Verse 1, we switch to Next Chap (or Header Chap).
    
    page_chap = None # Context from header

    for i in range(START_PAGE, min(END_PAGE, len(reader.pages))):
        page = reader.pages[i]
        try:
            text = page.extract_text(extraction_mode="layout")
        except:
            text = page.extract_text()
            
        lines = text.split('\n')
        
        # Header Context
        header_found = None
        for k in range(min(5, len(lines))): # Check top 5 lines
            line = lines[k].strip()
            for pat in header_patterns:
                m = pat.search(line)
                if m:
                    header_found = int(m.group(1))
                    break
            if header_found: break
        
        if header_found:
            page_chap = header_found
            if curr_chap is None: curr_chap = page_chap

        for line in lines:
            line = line.strip()
            if not line or line.isdigit(): continue
            
            # Subtitle check (Rashad's subtitles often in parentheses or distinct)
            # Skip lines that are just subtitles? 
            # Or append them? User wants Text. Text includes subtitles usually?
            # 1992 JSON puts Subtitles in "titles" array, not verse text.
            # But here they are mixed.
            # I will append them to text for now.
            
            v_match = verse_start_pattern.match(line)
            if v_match:
                new_v_num = int(v_match.group(1))
                new_v_text = v_match.group(2)
                
                # Flush Pre-existing
                if curr_chap is not None and curr_v_num is not None:
                    key = f"{curr_chap}:{curr_v_num}"
                    extracted_data[key] = normalize(" ".join(curr_text_buffer))
                
                # Determine Chapter for NEW verse
                # If v=1, likely new chapter.
                if new_v_num == 1:
                    # If page header says X, and we were at X-1, switch to X.
                    if page_chap and page_chap != curr_chap:
                        curr_chap = page_chap
                    else:
                        # Infer
                        if curr_chap: curr_chap += 1
                        else: curr_chap = 1
                
                if curr_chap is None: 
                     # Use page header
                     curr_chap = page_chap
                
                if curr_chap is None:
                    continue # Skip orphan
                    
                curr_v_num = new_v_num
                curr_text_buffer = [new_v_text]
                
            else:
                if curr_v_num is not None:
                    curr_text_buffer.append(line)
                    
    # Flush last
    if curr_chap and curr_v_num:
        extracted_data[f"{curr_chap}:{curr_v_num}"] = normalize(" ".join(curr_text_buffer))

    print(f"Extraction Complete. Matched {len(extracted_data)} verses.")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(extracted_data, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    parse_pdf()
