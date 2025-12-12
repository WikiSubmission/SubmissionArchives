import json
import re
import sys
import os

# Force CPU just in case
os.environ["CUDA_VISIBLE_DEVICES"] = ""

try:
    from pypdf import PdfReader
except ImportError:
    print("pypdf not found")
    sys.exit(1)

# Configuration
PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"
JSON_1992 = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1992 Quran.json"
OUTPUT = r"c:\Users\Jonathan\Desktop\RKM\data\1989_extracted.json"

def normalize(text):
    return re.sub(r'\s+', ' ', text).strip()

def parse_pdf():
    reader = PdfReader(PDF_PATH)
    
    # STRICT Header Patterns
    # Only match things that DEFINITELY declare a new chapter.
    header_patterns = [
       re.compile(r'^\s*Sura\s+(\d+)', re.IGNORECASE), 
       re.compile(r'^\s*Chapter\s+(\d+)', re.IGNORECASE),
       re.compile(r'^\s*(\d+)\s+The\s+[A-Za-z]+', re.IGNORECASE), # "2 The Heifer"
    ]
    
    # Verse Pattern
    # Matches "1. Text" or "1 Text" or "1" (solo)
    verse_start_pat = re.compile(r'^\W*(\d+)(?:[\.\s]|$)(.*)', re.DOTALL)

    extracted_data = {}
    
    current_key = None # (Chap, Verse)
    current_text = []
    current_chap = None
    
    START_PAGE_IDX = 19 
    
    print(f"Parsing Quran Text (Pages {START_PAGE_IDX+1}-{len(reader.pages)}) with STRICT Logic...")

    for i in range(START_PAGE_IDX, len(reader.pages)):
        page = reader.pages[i]
        try:
             text = page.extract_text()
        except Exception as e:
             print(f"   -> Extraction Failed for Page {i}: {e}")
             continue

        raw_lines = text.split('\n') if text else []
        lines = [l.strip() for l in raw_lines if l.strip()]

        for line in lines:
            if line.isdigit() and int(line) > 300: continue 
            if "[[FOOTER]]" in line: continue
            
            # 1. CHECK FOR HEADER
            is_header = False
            for pat in header_patterns:
                m = pat.match(line)
                if m:
                    # Filter junk - Only stop if we are deep in the book
                    if (i > 600) and ("Appendix" in line or "Index" in line):
                         print(f"DEBUG: Found End-of-Book content '{line}' on Page {i}. Stopping Parsing.")
                         return extracted_data # BREAK OUT COMPLETELY
                    if len(line) > 120: continue 

                    for g in m.groups():
                        if g and g.isdigit():
                            new_chap = int(g)
                            if 1 <= new_chap <= 114:
                                # Header found. ALWAYS trust explicit header.
                                if current_chap != new_chap:
                                    print(f"DEBUG: Found Header: '{line}' -> Switching to Chap {new_chap}")
                                    current_chap = new_chap
                                is_header = True
                                break
                    if is_header: break
            if is_header: continue

            # 2. CHECK FOR VERSE START
            v_match = verse_start_pat.match(line)
            
            is_new_verse = False
            if v_match:
                v_num_str = v_match.group(1)
                v_content = v_match.group(2).strip()
                v_num = int(v_num_str)
                
                valid_verse = False
                
                # Context validation logic
                
                # CASE A: Verse 1 (New Sura?)
                if v_num == 1:
                    # It initiates a new verse.
                    # Should it initiate a new Chapter?
                    
                    if current_chap is None:
                         # Assume Start of Book logic if undefined
                         current_chap = 1
                         print(f"DEBUG: Starting at Chap 1 (Found Verse 1)")
                    
                    # Implicit Switch Check:
                    # If we are in Chap X, and we find Verse 1...
                    # Did we just see a header for Chap X+1? If so, current_chap is already X+1.
                    # If NOT (current_chap is still X), then this Verse 1 implies implicit transition.
                    elif current_key and current_key[0] == current_chap:
                         # We are still in the old chapter context.
                         # Transition!
                         current_chap += 1
                         print(f"DEBUG: Implicit Switch to Chap {current_chap} (Found Verse 1)")
                    
                    # If current_chap > current_key[0] (meaning Header updated it), then we are good.
                    
                    valid_verse = True

                # CASE B: Sequential (N -> N+1)
                elif current_key and (v_num == current_key[1] + 1) and (current_key[0] == current_chap):
                    valid_verse = True
                
                # CASE C: Gap (N -> N+2..5)
                elif current_key and (v_num > current_key[1]) and (v_num < current_key[1] + 10) and (current_key[0] == current_chap):
                    # Slightly larger gap tolerance for OCR errors
                    valid_verse = True
                    
                # CASE D: Recovery?
                # If we are at Verse 10, and see Verse 10 again? Valid (duplicate line).
                # If we are at Verse 10, and see Verse 12? Valid (Gap).
                
                if valid_verse:
                    # Save previous
                    if current_key:
                        extracted_data[f"{current_key[0]}:{current_key[1]}"] = normalize(" ".join(current_text))
                    
                    current_key = (current_chap, v_num)
                    current_text = [v_content]
                    is_new_verse = True
            
            if not is_new_verse:
                # Append to current verse
                if current_key:
                    current_text.append(line)
                else:
                    # LOG SKIPPED LINE
                    with open(r"c:\Users\Jonathan\Desktop\RKM\data\skipped_debug.txt", "a", encoding="utf-8") as f_skip:
                        f_skip.write(f"Page {i} SKIP: {line}\n")

    # Flush last
    if current_key:
        extracted_data[f"{current_key[0]}:{current_key[1]}"] = normalize(" ".join(current_text))
        
    return extracted_data

def main():
    data = parse_pdf()
    print(f"Extraction Complete. Found {len(data)} verses.")
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Saved to {OUTPUT}")

if __name__ == "__main__":
    main()
