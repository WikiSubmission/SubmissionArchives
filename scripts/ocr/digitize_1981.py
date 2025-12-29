import pdfplumber
import json
import argparse
import re
import os
import sys

# Configuration
PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1981.pdf"
MAP_PATH = r"c:\Users\Jonathan\Desktop\RKM\data\chapter_map_1981.json"
OUTPUT_DIR = r"c:\Users\Jonathan\Desktop\RKM\data\1981_chapters"
REF_JSON_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1992 Quran.json"
LOG_FILE = r"c:\Users\Jonathan\Desktop\RKM\data\1981_extraction_log.txt"

# Regex
# Support "1.", "1^", "1)", "1 "
VERSE_START_PAT = re.compile(r'^(\d{1,3})[\.\^)\s]\s+(.*)', re.DOTALL) 
HEADER_PAT = re.compile(r'^\s*(?:Sura|Chapter)\s+(\d+)', re.IGNORECASE)
FOOTNOTE_PAT = re.compile(r'^\*?\d+:\d+') 
# regex for splitting subtitle from end of line
# Matches: "(2} The...", "< Three...", "(D) The...", " (1) The..."
SUBTITLE_SPLIT_PAT = re.compile(r'(.*?)\s+((?:[\(<]\s*(?:\d+|[A-Za-z])\s*[}\)>]|<)\s+[A-Z].*|Heaven and Hell Allegorically Described.*)$')
# regex for full line subtitle
SUBTITLE_LINE_PAT = re.compile(r'^\s*(?:[\(<]\s*(?:\d+|[A-Za-z])\s*[}\)>]|<)\s+[A-Z].*')

def load_map():
    with open(MAP_PATH, 'r') as f:
        return json.load(f)

def clean_text(text):
    # Fix specific OCR artifacts found in 1981 PDF
    text = text.replace('Q)9^', '99.')
    text = text.replace('®', '98.')
    text = text.replace('128^', '128.')
    text = text.replace('_)', '') # Random noise
    # Fix spaced out numbers "1 0 0." -> "100."
    text = re.sub(r'(\d)\s+(\d)\s+\.', r'\1\2.', text)
    text = re.sub(r'(\d)\s+(\d)(\d)\s+\.', r'\1\2\3.', text)
    return text

def get_optimal_gutter(page):
    words = page.extract_words()
    if not words: return page.width / 2
    
    # Histogram of X coordinates (center 30-70%)
    width = page.width
    center_min = width * 0.35
    center_max = width * 0.65
    
    # Check for words in the center zone
    # We want to find a GAP in the center.
    
    # Buckets of 10px
    buckets = {}
    for w in words:
        x_mid = (w['x0'] + w['x1']) / 2
        if center_min < x_mid < center_max:
            b = int(x_mid / 10)
            buckets[b] = buckets.get(b, 0) + 1
            
    # If no words in center, pure gutter. Use center.
    if not buckets: return width / 2
    
    # Check for "Clean Gutter"
    # If the minimum density in the center is too high, it's Single Column.
    min_bucket = min(buckets.values())
    if min_bucket > 1: # Strict check. A real gutter should be empty or near empty.
         # print("DEBUG: Single Column Detected (High Density in Center)")
         return None
         
    # Find the "quietest" bucket range
    # ...
    
    # Histogram of PIXELS occupied by text horizontally
    # Resolution: 5px
    x_resolution = 5
    x_range = int(center_max - center_min)
    x_offset = int(center_min)
    
    grid = [0] * (x_range // x_resolution + 2)
    
    for w in words:
        start = max(0, int((w['x0'] - x_offset) / x_resolution))
        end = min(len(grid), int((w['x1'] - x_offset) / x_resolution) + 1)
        for i in range(start, end):
            if 0 <= i < len(grid):
                grid[i] += 1
                
    # Find best split index
    best_idx = -1
    min_score = 99999
    center_idx = len(grid) // 2
    
    for i in range(len(grid)):
        # Score = Density + DistancePenalty
        density = grid[i]
        dist = abs(i - center_idx)
        score = density * 1000 + dist
        
        if score < min_score:
            min_score = score
            best_idx = i
            
    # Verify density at best split
    if grid[best_idx] > 1: # Even best split cuts text
        return None
        
    optimal_x = x_offset + (best_idx * x_resolution)
    return optimal_x

def extract_text_from_page_crop(page, y_min=0, y_max=None):
    width = page.width
    height = page.height
    if y_max is None: y_max = height

    # BBox check
    bbox = page.bbox
    page_top = bbox[1]
    y_min = max(float(page_top), float(y_min))
    y_max = min(float(bbox[3]), float(y_max))
    
    if y_min >= y_max - 1.0: return ""

    # 1. Detect Header Safe Zone (Basmalah)
    # We want to avoid splitting the Basmalah or "Sura X" centered titles.
    # Scan words in the top region (up to Y=600 to be safe)
    
    header_split_y = y_min
    
    # Extract words for analysis (using crop to limit scope)
    try:
        header_check_crop = page.crop((0, y_min, width, min(y_max, y_min + 600)))
        words = header_check_crop.extract_words()
        
        basmalah_bottom = -1
        for w in words:
            if "name" in w['text'] and "God" in words[words.index(w)+2]['text']: # heuristic
                 basmalah_bottom = max(basmalah_bottom, float(w['bottom']))
            elif "In" == w['text'] and "the" == words[words.index(w)+1]['text'] and "name" == words[words.index(w)+2]['text']:
                 # stronger check
                 basmalah_bottom = max(basmalah_bottom, float(words[words.index(w)+4]['bottom'])) # bottom of 'God'
                 
        # More robust: Just look for "In the name of God" line-height
        # Or look for "Sura X"
        
        # Simplified: Check specific Y patterns or just "In the name of God"
        # Since OCR is okay here.
        
        full_text_head = header_check_crop.extract_text()
        if full_text_head and "In the name of God" in full_text_head:
             # Find approximate Y of this line.
             # Iterate words again.
             for w in words:
                 if w['text'] == "God" or w['text'] == "God," or w['text'] == "God;":
                     # Check context
                     # Assume it's the basmalah if Y < 600
                     if w['bottom'] > basmalah_bottom:
                         basmalah_bottom = w['bottom']
                         
        if basmalah_bottom > y_min:
            header_split_y = basmalah_bottom + 10 # Buffer
            
    except:
        pass # Fallback to 0 split

    # Extract Header (Single Column)
    text_header = ""
    if header_split_y > y_min:
        try:
            head_crop = page.crop((0, y_min, width, header_split_y))
            text_header = head_crop.extract_text() or ""
        except: pass
        
    # Extract Body (Dual Column)
    text_body = ""
    body_y_min = max(y_min, header_split_y)
    
    if body_y_min < y_max:
         # Dynamic Gutter from body crop only
         try:
             body_crop = page.crop((0, body_y_min, width, y_max))
             mid = get_optimal_gutter(body_crop)
             
             left_col = body_crop.crop((0, body_y_min, mid, y_max)) # crop coords are relative to page? Yes.
             right_col = body_crop.crop((mid, body_y_min, width, y_max))
             
             t_l = left_col.extract_text(x_tolerance=2, y_tolerance=3) or ""
             t_r = right_col.extract_text(x_tolerance=2, y_tolerance=3) or ""
             text_body = t_l + "\n" + t_r
         except Exception as e:
             # Fallback to single text if crop fails
             try:
                 text_body = page.crop((0, body_y_min, width, y_max)).extract_text() or ""
             except: pass

    return text_header + "\n" + text_body

def parse_verses(raw_text, chapter_num):
    raw_text = clean_text(raw_text)
    lines = raw_text.split('\n')
    verses = []
    footnotes = {}
    
    current_verse_num = 0
    verse_buffer = []
    
    in_footnote = False
    footnote_buffer = []
    current_footnote_id = None
    pending_subtitle = ""

    for line in lines:
        line = line.strip()
        if not line: continue

        # 1. Check for Merged Subtitle at End of Line
        post_line_subtitle = None
        
        # Generic Subtitle Detection (Subtitle after period, no period at end)
        split_match = re.match(r'(.*?[.?!])\s+([A-Z].*)$', line)
        if split_match:
            cand_text = split_match.group(1).strip()
            cand_sub = split_match.group(2).strip()
            
            # Validation Logic
            is_valid_sub = True
            if len(cand_sub) > 80: is_valid_sub = False
            # Subtitle shouldn't end with . or ? or ! (unless inside quote? unlikely for subtitle)
            if cand_sub.endswith('.') or cand_sub.endswith('?') or cand_sub.endswith('!'): is_valid_sub = False
            # Allow subtitle to end with * or ) or } or digit (footnote refs)
            
            if is_valid_sub:
                line = cand_text
                post_line_subtitle = cand_sub
                
        # Fallback to Regex for patterns that might NOT follow a period (rare, but existing logic covered it)
        if not post_line_subtitle:
             # Original regex for (2} etc.
             m_split = SUBTITLE_SPLIT_PAT.search(line)
             if m_split: 
                text_part = m_split.group(1).strip()
                sub_part = m_split.group(2).strip()
                line = text_part
                post_line_subtitle = sub_part

        # 2. Check for Standalone Subtitle Line (Generic)
        if not post_line_subtitle and len(line) < 80 and re.match(r'^[A-Z]', line):
            if not (line.endswith('.') or line.endswith('?') or line.endswith('!')):
                # Exclude continuations
                if not line.lower().startswith(("and ", "or ", "but ", "so ", "because ", "that ")):
                     post_line_subtitle = line
                     line = "" # Consume line
            
        m_head = HEADER_PAT.match(line)
        m_verse = VERSE_START_PAT.match(line)
        m_foot = FOOTNOTE_PAT.match(line)
        
        # Explicit Full-Line Subtitle Check
        is_subtitle_line = False
        clean_line = line.strip()
        if SUBTITLE_LINE_PAT.match(clean_line) or ("Categories of People" in clean_line) or ("(D)" in clean_line):
           is_subtitle_line = True
           
        if is_subtitle_line:
            # Clean up artifacts regex based
            sub_text = re.sub(r'^\s*(?:[\(<]\s*(?:\d+|[A-Za-z])\s*[}\)>]|<)\s*', '', clean_line).strip()
            # Flush current verse if active
            if verse_buffer:
                v_text = " ".join(verse_buffer)
                verses.append({
                    "chapter_number": chapter_num,
                    "verse_number": current_verse_num,
                    "text": v_text,
                    "verse_id": f"{chapter_num}:{current_verse_num}",
                    "subtitle": pending_subtitle
                })
                pending_subtitle = "" 
                verse_buffer = []
            
            pending_subtitle = sub_text
            if post_line_subtitle: pending_subtitle += " " + post_line_subtitle
            continue

        if m_head or m_verse or m_foot:
            # Flush footnote logic
            if in_footnote and footnote_buffer:
                f_text = " ".join(footnote_buffer)
                if current_footnote_id: footnotes[current_footnote_id] = f_text
                footnote_buffer = []
                in_footnote = False
                current_footnote_id = None

            # Flush verse logic
            if (m_head or m_verse) and verse_buffer:
                v_text = " ".join(verse_buffer)
                verses.append({
                    "chapter_number": chapter_num,
                    "verse_number": current_verse_num,
                    "text": v_text,
                    "verse_id": f"{chapter_num}:{current_verse_num}",
                    "subtitle": pending_subtitle 
                })
                if pending_subtitle: pending_subtitle = ""
                verse_buffer = []
        
        if m_head: continue

        if m_verse:
            new_v_num = int(m_verse.group(1))
            gap = new_v_num - current_verse_num
            if current_verse_num == 0 and gap > 5: continue 
            
            current_verse_num = new_v_num
            if chapter_num == 114 and current_verse_num > 6: break
            
            verse_buffer.append(m_verse.group(2))
            
            if post_line_subtitle:
                # Flush THIS verse
                v_text = " ".join(verse_buffer)
                verses.append({
                    "chapter_number": chapter_num,
                    "verse_number": current_verse_num,
                    "text": v_text,
                    "verse_id": f"{chapter_num}:{current_verse_num}",
                    "subtitle": pending_subtitle 
                })
                pending_subtitle = ""
                verse_buffer = []
                pending_subtitle = post_line_subtitle
            continue
            
        if m_foot:
            in_footnote = True
            footnote_buffer.append(line)
            m_id = re.search(r'\*?(\d+:\d+)', line)
            if m_id: current_footnote_id = m_id.group(1)
            continue
            
        # Basmalah Check
        if chapter_num > 1 and current_verse_num == 0 and "in the name of god" in line.lower():
            # Treat as Verse 0
            current_verse_num = 0
            verse_buffer = [line]
            continue
        
        # Continuation / Normal Text
        if in_footnote:
            footnote_buffer.append(line)
        elif verse_buffer:
            verse_buffer.append(line)
            if post_line_subtitle:
                 # End of verse due to inline subtitle
                 v_text = " ".join(verse_buffer)
                 verses.append({
                    "chapter_number": chapter_num,
                    "verse_number": current_verse_num,
                    "text": v_text,
                    "verse_id": f"{chapter_num}:{current_verse_num}",
                    "subtitle": pending_subtitle
                 })
                 pending_subtitle = ""
                 verse_buffer = []
                 pending_subtitle = post_line_subtitle
            
    # Flush
    if in_footnote and footnote_buffer:
        f_text = " ".join(footnote_buffer)
        if current_footnote_id: footnotes[current_footnote_id] = f_text
             
    if verse_buffer:
        v_text = " ".join(verse_buffer)
        verses.append({
            "chapter_number": chapter_num,
            "verse_number": current_verse_num,
            "text": v_text,
            "verse_id": f"{chapter_num}:{current_verse_num}"
        })
        
    verses.sort(key=lambda x: x['verse_number'])
    return verses, footnotes

def load_reference_data():
    with open(REF_JSON_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def merge_and_validate(extracted_verses, extracted_footnotes, chapter_num):
    ref_data = load_reference_data()
    ref_verses = [v for v in ref_data if v['chapter_number'] == chapter_num]
    
    count_ext = len(extracted_verses)
    count_ref = len(ref_verses)
    
    expected_count = count_ref
    if chapter_num == 9: expected_count = 129
    
    validation_msg = f"Validation Ch {chapter_num}: Extracted {count_ext} vs Expected {expected_count}"
    
    if count_ext != expected_count:
        # log.write(f"WARNING: {validation_msg}\\n")
        pass
        
    with open(LOG_FILE, "a") as log:
        if count_ext != expected_count:
            log.write(f"WARNING: {validation_msg} (Missing verses backfilled from Reference)\n")
        else:
            log.write(f"SUCCESS: {validation_msg}\n")

    # Merge Data
    merged_output = []
    ext_map = {v['verse_number']: v for v in extracted_verses}
    
    # Process 1..Ref_Count
    for ref_v in ref_verses:
        v_num = ref_v['verse_number']
        if v_num in ext_map:
            ext_v = ext_map[v_num]
            new_v = ref_v.copy()
            new_v['verse_text_english'] = ext_v['text']
            f_key = f"{chapter_num}:{v_num}"
            new_v['verse_footnote_english'] = extracted_footnotes.get(f_key, "")
            merged_output.append(new_v)
        else:
            merged_output.append(ref_v) # Fallback to ref if missing
            
    # Process Extra Verses (Ch 9)
    max_ref = max([v['verse_number'] for v in ref_verses]) if ref_verses else 0
    extra_verses = [v for v in extracted_verses if v['verse_number'] > max_ref]
    if extra_verses:
        for v in extra_verses:
            new_v = {
                "global_index": -1,
                "verse_index": -1,
                "chapter_number": chapter_num,
                "verse_number": v['verse_number'],
                "verse_id": v['verse_id'],
                "verse_text_english": v['text'],
                "verse_footnote_english": extracted_footnotes.get(v['verse_id'], ""),
                "verse_subtitle_english": None
            }
            merged_output.append(new_v)
            
    return merged_output

def process_chapter(chapter_num, pdf_obj, data_map):
    str_chap = str(chapter_num)
    if str_chap not in data_map:
        print(f"Error: Chapter {chapter_num} not found in map.")
        return

    info = data_map[str_chap]
    start_page = info['start_page']
    start_y = info['start_y']
    end_page = info['end_page']
    end_y = info['end_y']
    
    print(f"Extracting Ch {chapter_num} (Pg {start_page}-{end_page})...")
    
    full_text = ""
    current_idx = start_page - 1
    end_idx = end_page - 1
    if end_page == -1: end_idx = len(pdf_obj.pages) - 1
    
    while current_idx <= end_idx:
        if current_idx >= len(pdf_obj.pages): break
        page = pdf_obj.pages[current_idx]
        y_min = 0.0
        y_max = float(page.bbox[3])
        
        if current_idx == start_page - 1: y_min = start_y + 5
        if current_idx == end_page - 1 and end_y != -1: y_max = end_y
        
        # Extend Y-max slightly for Ch 9 end if on the edge
        if chapter_num == 9 and current_idx == 149: # Page 150
             # Hardcode override: Logic says Page 150 start Y=362 is Ch 10.
             # So Ch 9 ends at 362.
             y_max = 362.0 

        page_text = extract_text_from_page_crop(page, y_min, y_max)
        full_text += page_text + "\n"
        current_idx += 1
            
    # DEBUG: Save Raw Text for inspection
    try:
        with open(f"debug_ch{chapter_num}.txt", "w", encoding="utf-8") as f:
            f.write(full_text)
    except: pass

    verses, footnotes = parse_verses(full_text, chapter_num)
    final_data = merge_and_validate(verses, footnotes, chapter_num)
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    out_file = os.path.join(OUTPUT_DIR, f"chapter_{chapter_num}.json")
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=2)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--chapter", type=int, help="Specific chapter")
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--end", type=int, default=114)
    args = parser.parse_args()

    data_map = load_map()
    
    with pdfplumber.open(PDF_PATH) as pdf:
        if args.chapter:
            process_chapter(args.chapter, pdf, data_map)
        else:
            for i in range(args.start, args.end + 1):
                try:
                    process_chapter(i, pdf, data_map)
                except Exception as e:
                    print(f"CRASH on Ch {i}: {e}")
                    with open(LOG_FILE, "a") as log:
                        log.write(f"CRASH Ch {i}: {e}\n")

if __name__ == "__main__":
    main()
