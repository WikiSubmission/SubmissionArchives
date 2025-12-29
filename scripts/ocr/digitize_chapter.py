import pdfplumber
import json
import argparse
import re
import os

# Configuration
PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"
MAP_PATH = r"c:\Users\Jonathan\Desktop\RKM\data\chapter_map_1989.json"
OUTPUT_DIR = r"c:\Users\Jonathan\Desktop\RKM\data\1989_chapters"

# Regex
VERSE_START_PAT = re.compile(r'^(\d{1,3})\.\s+(.*)', re.DOTALL) # "1. Text..."
HEADER_PAT = re.compile(r'^\s*(?:Sura|Chapter)\s+(\d+)', re.IGNORECASE)
FOOTNOTE_PAT = re.compile(r'^\*?\d+:\d+') # Matches "*1:1" or "27:30" or "1:1"

def load_map():
    with open(MAP_PATH, 'r') as f:
        return json.load(f)

def extract_text_from_page_crop(page, y_min=0, y_max=None):
    """
    Extracts text from a page, optionally cropped vertically.
    Handles dual columns (Left -> Right).
    """
    width = page.width
    height = page.height
    if y_max is None: y_max = height

    # Clamp input values to valid page range (using bbox)
    # bbox = (x0, top, x1, bottom)
    bbox = page.bbox
    page_top = bbox[1]
    page_bottom = bbox[3]
    
    y_min = max(float(page_top), float(y_min))
    y_max = min(float(page_bottom), float(y_max))
    
    # Debug print
    # print(f"Cropping Page {page.page_number} to Y=[{y_min:.1f}, {y_max:.1f}] (H={height:.1f})")

    # Crop vertical area
    # BBox: [x0, top, x1, bottom]
    # Handle edge case where crop is invalid (e.g. y_min >= y_max)
    if y_min >= y_max - 1.0: # Allow 1px tolerance
        return ""

    # Calculate column width
    mid = width / 2
    
    # Crop Left Column directly from page
    # BBox: (0, y_min, mid, y_max)
    # Clamp everything
    left_bbox = (0, y_min, mid, y_max)
    right_bbox = (mid, y_min, width, y_max)
    
    text_left = ""
    try:
        left_col = page.crop(left_bbox)
        text_left = left_col.extract_text(x_tolerance=2, y_tolerance=3) or ""
    except Exception as e:
        print(f"Warning: Left crop failed on Page {page.page_number}: {e}")

    text_right = ""
    try:
        right_col = page.crop(right_bbox)
        text_right = right_col.extract_text(x_tolerance=2, y_tolerance=3) or ""
    except Exception as e:
        print(f"Warning: Right crop failed on Page {page.page_number}: {e}")
        
    # if page.page_number in range(617, 619): 
    #     try:
    #         dump_str = f"--- PAGE {page.page_number} DUMP ---\n{text_left}\n{text_right}\n----------------"
    #         print(dump_str.encode('utf-8', errors='replace').decode('utf-8', errors='replace'))
    #     except Exception as e:
    #         print(f"--- PAGE {page.page_number} DUMP ERROR: {e} ---")
            
    return text_left + "\n" + text_right

def parse_verses(raw_text, chapter_num):
    # Pre-process raw text to fix artifacts
    if "1 5H." in raw_text:
        raw_text = raw_text.replace("1 5H.", "158.")
    if "1 0. We placed galaxies" in raw_text:
        raw_text = raw_text.replace("1 0.", "16.")
    if "r. 33." in raw_text:
        raw_text = raw_text.replace("r. 33.", "33.")
    if "36. He said" in raw_text:
        # Prevent merging with V35
        raw_text = raw_text.replace("36. He said", "\n36. He said")
    
    # Ch 49 Artifacts
    if "11.0 you who believe" in raw_text:
        raw_text = raw_text.replace("11.0 you who believe", "11. O you who believe")
        
    # Ch 51 Artifacts
    if "56.1 did not" in raw_text:
        raw_text = raw_text.replace("56.1 did not", "56. I did not")
    if "57.1 need no" in raw_text:
        raw_text = raw_text.replace("57.1 need no", "57. I need no")
        
    # Ch 61 Artifacts
    if "4 GOD loves" in raw_text:
        raw_text = raw_text.replace("4 GOD loves", "4. GOD loves")
        
    # Ch 72 Artifacts
    if "l. Say," in raw_text:
        raw_text = raw_text.replace("l. Say,", "1. Say,")
        
    # Ch 74 Artifacts
    if "26.1 will commit" in raw_text:
        raw_text = raw_text.replace("26.1 will commit", "26. I will commit")
        
    # Ch 75 Artifacts
    if "e. 15." in raw_text:
        raw_text = raw_text.replace("e. 15.", "15.")
        
    # Ch 81 Artifacts
    if "9 For what crime" in raw_text:
        raw_text = raw_text.replace("9 For what crime", "9. For what crime")
        
    # Ch 84 Artifacts
    if "16.1 solemnly" in raw_text:
        raw_text = raw_text.replace("16.1 solemnly", "16. I solemnly")

    lines = raw_text.split('\n')
    verses = []
    footnotes = {} # Map "1:1" -> "Text"
    
    current_verse_num = 0
    verse_buffer = []
    
    # Footnote parsing state
    in_footnote = False
    footnote_buffer = []
    current_footnote_id = None
    
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Checking Patterns
        m_head = HEADER_PAT.match(line)
        m_verse = VERSE_START_PAT.match(line)
        m_foot = FOOTNOTE_PAT.match(line)
        
        # State Transitions
        if m_head or m_verse or m_foot:
            
            # Flush Previous Footnote
            if in_footnote and footnote_buffer:
                f_text = " ".join(footnote_buffer)
                if current_footnote_id:
                     footnotes[current_footnote_id] = f_text
                footnote_buffer = []
                in_footnote = False
                current_footnote_id = None

            # Flush Previous Verse (if we hit header or new verse)
            # Note: Footnotes don't necessarily end a verse, they might interrupt?
            # Usually footnotes are at bottom.
            if (m_head or m_verse) and verse_buffer:
                v_text = " ".join(verse_buffer)
                verses.append({
                    "chapter_number": chapter_num,
                    "verse_number": current_verse_num,
                    "text": v_text,
                    "verse_id": f"{chapter_num}:{current_verse_num}"
                })
                verse_buffer = []

        # Handle Line
        if m_head:
            # Just skip
            continue
            
        if m_verse:
            new_v_num = int(m_verse.group(1))
            
            # Heuristic: Verify sequential order.
            gap = new_v_num - current_verse_num
            
            # Anti-Noise Filter (Start of Chapter ONLY)
            # If we are starting (0) and see a huge number (e.g. 32 in Ch 2), it's noise.
            if current_verse_num == 0 and gap > 5:
                continue
                
            current_verse_num = new_v_num
            verse_buffer.append(m_verse.group(2))
            continue
            
        if m_foot:
            in_footnote = True
            footnote_buffer.append(line)
            # Try to extract ID
            # *2:1 or *2:1-5
            # We want key "2:1"
            # Regex: \*?(\d+:\d+)
            m_id = re.search(r'\*?(\d+:\d+)', line)
            if m_id:
                current_footnote_id = m_id.group(1)
            continue
            
        # Basmalah Check (Case Insensitive)
        if chapter_num > 1 and current_verse_num == 0 and "in the name of god" in line.lower():
            # Found Basmalah (Verse 0)
            verses.append({
                "chapter_number": chapter_num,
                "verse_number": 0,
                "text": line,
                "verse_id": f"{chapter_num}:0"
            })
            continue

        if in_footnote:
            # Check for Next Chapter Header bleeding in
            # Example: "The Heifer (Al-Baqarah) 2:1-5"
            # Or just "Sura 2" if header pat failed
            
            # Match strict start of next chapter verse 1: e.g. "3:1" not "3:169"
            # Regex: \b3:1\b
            next_chap = chapter_num + 1
            if re.search(rf'\b{next_chap}:1\b', line):
                 # Safety: If line contains CURRENT chapter number (e.g. "98:8 ... 99:1-8"), strictly header.
                 # Don't break.
                 if str(chapter_num) in line:
                     continue

                 # This is likely the header of the next chapter.
                 # Stop parsing lines, we are done with this chapter.
                 # print(f"DEBUG: Breaking on footnote line: {line}")
                 break
                
            footnote_buffer.append(line)
            continue
            
        # Verse Continuation
        if verse_buffer:
            # Check for next chapter bleed here too
            next_chap = chapter_num + 1
            if re.search(rf'\b{next_chap}:1\b', line) and (f"Sura {next_chap}" in line or f"Chapter {next_chap}" in line or "(" in line):
                 # print(f"DEBUG: Breaking on verse line: {line}")
                 break
                 
            verse_buffer.append(line)
            
    # Flush Final State
    if in_footnote and footnote_buffer:
        f_text = " ".join(footnote_buffer)
        if current_footnote_id:
             footnotes[current_footnote_id] = f_text
             
    if verse_buffer:
        v_text = " ".join(verse_buffer)
        verses.append({
            "chapter_number": chapter_num,
            "verse_number": current_verse_num,
            "text": v_text,
            "verse_id": f"{chapter_num}:{current_verse_num}"
        })
        
    # Sort verses by verse_number to handle out-of-order extraction
    verses.sort(key=lambda x: x['verse_number'])

    return verses, footnotes

# ... (Previous imports)
REF_JSON_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1992 Quran.json"

def load_reference_data():
    with open(REF_JSON_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def merge_and_validate(extracted_verses, extracted_footnotes, chapter_num):
    ref_data = load_reference_data()
    
    # Filter reference for this chapter
    ref_verses = [v for v in ref_data if v['chapter_number'] == chapter_num]
    
    # 0. Check for duplicates
    v_counts = {}
    for v in extracted_verses:
        vn = v['verse_number']
        v_counts[vn] = v_counts.get(vn, 0) + 1
    
    dupes = [vn for vn, c in v_counts.items() if c > 1]
    if dupes:
        print(f"CRITICAL ERROR: Duplicate Verse Numbers found: {dupes}")
        
    # 1. Validate Counts
    count_ext = len(extracted_verses)
    count_ref = len(ref_verses)
    
    print(f"Validation: Extracted {count_ext} vs Reference {count_ref}")
    
    if count_ext != count_ref:
        print(f"CRITICAL ERROR: Verse count mismatch for Chapter {chapter_num}!")
        print(f"Expected: {count_ref}, Found: {count_ext}")
        diff = count_ref - count_ext
        print(f"Difference: {diff}")
        
        # Identify missing verses if possible
        ext_ids = set(v['verse_number'] for v in extracted_verses)
        ref_ids = set(v['verse_number'] for v in ref_verses)
        missing = ref_ids - ext_ids
        extra = ext_ids - ref_ids
        
        if missing:
            print(f"Missing Verse Numbers: {sorted(list(missing))}")
        if extra:
            print(f"Extra Verse Numbers: {sorted(list(extra))}")
            
        raise ValueError(f"Verse count mismatch in Chapter {chapter_num}")

    # 2. Merge Data
    merged_output = []
    
    # Map extracted by verse number for easy lookup
    ext_map = {v['verse_number']: v for v in extracted_verses}
    
    for ref_v in ref_verses:
        v_num = ref_v['verse_number']
        if v_num in ext_map:
            ext_v = ext_map[v_num]
            
            # Create copy of reference verse
            new_v = ref_v.copy()
            
            # Update English Text
            new_v['verse_text_english'] = ext_v['text']
            
            # Update Footnote
            # Key format: "Chapter:Verse" e.g. "1:1"
            f_key = f"{chapter_num}:{v_num}"
            if f_key in extracted_footnotes:
                new_v['verse_footnote_english'] = extracted_footnotes[f_key]
            else:
                # Clear implicit footnote if not extracted? 
                # Or keep 1992 if not found? 
                # User said "The 1989 edition... replace...". 
                # If 1989 has no footnote, we should probably set it to None or empty.
                # However, if extraction missed it, we lose data.
                # Safer: Overwrite with "" if we are confident.
                # For now, let's leave 1992 footnote if we didn't find one, 
                # BUT this might leave old footnotes. 
                # Better: Set to "" to ensure purity.
                # Wait, if I miss a footnote, I delete it?
                # User wants "1989 Quran". If 1989 has no footnote, result should have none.
                new_v['verse_footnote_english'] = "" 
            
            merged_output.append(new_v)
        else:
            # Should not happen if counts match and IDs match, but safety check
            print(f"Warning: Verse {v_num} missing in extraction map despite count match.")
            merged_output.append(ref_v) 
            
    return merged_output

# ... (Previous Extract Functions)

def process_chapter(chapter_num):
    data_map = load_map()
    str_chap = str(chapter_num)
    
    if str_chap not in data_map:
        print(f"Error: Chapter {chapter_num} not found in map.")
        return

    info = data_map[str_chap]
    start_page = info['start_page']
    start_y = info['start_y']
    end_page = info['end_page']
    end_y = info['end_y']
    
    print(f"Extracting Chapter {chapter_num} from Page {start_page} to {end_page}...")
    
    # ... (Extraction Loop as before) ...
    full_text = ""
    with pdfplumber.open(PDF_PATH) as pdf:
        current_idx = start_page - 1
        end_idx = end_page - 1
        while current_idx <= end_idx:
            if current_idx >= len(pdf.pages): break
            page = pdf.pages[current_idx]
            y_min = 0.0
            y_max = float(page.bbox[3])
            
            if current_idx == start_page - 1:
                y_min = start_y + 5
            if current_idx == end_page - 1:
                y_max = end_y
            
            page_text = extract_text_from_page_crop(page, y_min, y_max)
            full_text += page_text + "\n"
            current_idx += 1
            
    # Parse
    verses, footnotes = parse_verses(full_text, chapter_num)
    
    # Validate and Merge
    try:
        final_data = merge_and_validate(verses, footnotes, chapter_num)
        
        # Save
        if not os.path.exists(OUTPUT_DIR):
            os.makedirs(OUTPUT_DIR)
            
        out_file = os.path.join(OUTPUT_DIR, f"chapter_{chapter_num}.json")
        with open(out_file, 'w', encoding='utf-8') as f:
            json.dump(final_data, f, indent=2)
            
        print(f"SUCCESS: Saved validated Chapter {chapter_num} to {out_file}")
        
    except ValueError as e:
        print(f"FAILED: {e}")
        exit(1) # Exit with error code so caller knows


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--chapter", type=int, required=True, help="Chapter number to extract")
    args = parser.parse_args()
    
    process_chapter(args.chapter)
