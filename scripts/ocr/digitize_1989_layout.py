import re
import json
import os
from pypdf import PdfReader

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"
OUTPUT_PATH = r"c:\Users\Jonathan\Desktop\RKM\data\1989_layout_extracted.json"

def normalize(text):
    return re.sub(r'\s+', ' ', text).strip()

def parse_pdf():
    reader = PdfReader(PDF_PATH)
    
    # 1989 Range: Page 20 (Sura 1) to Page 625 (Pre-Appendix)
    # Indices 19 to 624.
    START_PAGE = 19
    END_PAGE = 625
    
    header_patterns = [
        re.compile(r'.*?(\d+):(\d+)-(\d+).*?'), # Citation 2:1-10
        re.compile(r'^Sura\s+(\d+)', re.IGNORECASE),
        re.compile(r'^Chapter\s+(\d+)', re.IGNORECASE),
        re.compile(r'.*?Sura\s+(\d+).*?', re.IGNORECASE)
    ]
    
    # Verse Regex
    verse_start_pattern = re.compile(r'^\W*(\d+)\.\s+(.*)') 

    print(f"Parsing 1989 PDF Layout Mode (Pages {START_PAGE+1}-{END_PAGE})...")
    
    extracted_data = {}
    
    curr_chap = None
    curr_v_num = None
    curr_text_buffer = []
    page_chap = None 

    for i in range(START_PAGE, min(END_PAGE, len(reader.pages))):
        page = reader.pages[i]
        try:
            text = page.extract_text(extraction_mode="layout")
        except:
            text = page.extract_text()
            
        lines = text.split('\n')
        
        # Header Context
        header_found = None
        for k in range(min(5, len(lines))): 
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
            if "Appendix" in line: continue # Filtering footnotes if evident
            
            v_match = verse_start_pattern.search(line) # Use search to support indent
            if v_match:
                new_v_num = int(v_match.group(1))
                new_v_text = v_match.group(2) # Caution: might capture end of line only?
                
                # Check if it's a date or citation "2:3" -> v_match matches "3"?
                # "2:3" -> group 1="3"? No, regex needs "."
                # "2:3."? No.
                # "19.95"? Regex matches "19.".
                # Verse numbers usually don't have decimals. 
                # But standard text might have "at 5.30 pm". "30." matches.
                # Heuristic: Verse numbers roughly sequential.
                
                valid_seq = False
                if new_v_num == 1:
                    valid_seq = True
                elif curr_v_num and new_v_num == curr_v_num + 1:
                    valid_seq = True
                
                # If not sequential, maybe we missed some? Allow jump of 1?
                # Or just trust regex if at start of line?
                # layout mode might indent. 
                # `search` is risky. `match` + `lstrip` is better.
                # I used `^\W*` in regex, so `match` handles whitespace.
                # Reverting to `match` for safety.
                pass
            
            v_match = verse_start_pattern.match(line)
            if v_match:
                new_v_num = int(v_match.group(1))
                new_v_text = v_match.group(2)
                
                # Flush Pre-existing
                if curr_chap is not None and curr_v_num is not None:
                    key = f"{curr_chap}:{curr_v_num}"
                    extracted_data[key] = normalize(" ".join(curr_text_buffer))
                
                # Chapter Logic
                if new_v_num == 1:
                    if page_chap and page_chap != curr_chap:
                        curr_chap = page_chap
                    else:
                        if curr_chap: curr_chap += 1
                        else: curr_chap = 1
                
                if curr_chap is None: 
                     curr_chap = page_chap # Try verify header late
                
                if curr_chap is None: continue 
                    
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
