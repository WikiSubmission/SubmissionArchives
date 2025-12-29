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
VERSE_START_PAT = re.compile(r'^(\d{1,3})\.\s+(.*)', re.DOTALL) 
HEADER_PAT = re.compile(r'^\s*(?:Sura|Chapter)\s+(\d+)', re.IGNORECASE)
FOOTNOTE_PAT = re.compile(r'^\*?\d+:\d+')

def load_map():
    with open(MAP_PATH, 'r') as f:
        return json.load(f)

def cluster_words_into_lines(words, tolerance=3):
    # Sort by Y
    words.sort(key=lambda w: w['top'])
    lines = []
    current_line = []
    last_y = -999
    
    for w in words:
        if current_line and (w['top'] - last_y > tolerance):
            lines.append(current_line)
            current_line = []
        current_line.append(w)
        last_y = w['top']
        
    if current_line: lines.append(current_line)
    return lines

def process_line(line_words, page_width):
    # Sort by X
    line_words.sort(key=lambda w: w['x0'])
    
    # Calculate Gaps
    segments = []
    current_segment = []
    last_x1 = -999
    
    GAP_THRESHOLD = 20 # Pixels (Approx 2 spaces?)
    
    for w in line_words:
        if current_segment and (w['x0'] - last_x1 > GAP_THRESHOLD):
            # Gap detected
            segments.append(current_segment)
            current_segment = []
        
        current_segment.append(w)
        last_x1 = w['x1']
        
    if current_segment: segments.append(current_segment)
    
    # Analyze Segments
    # If 1 segment and strict width > 60% of page -> Full Line
    # If 2 segments -> Left/Right
    
    texts = []
    for seg in segments:
        text = " ".join([w['text'] for w in seg])
        # Centroid X
        mid_x = (seg[0]['x0'] + seg[-1]['x1']) / 2
        texts.append({
            'text': text,
            'mid_x': mid_x,
            'left': seg[0]['x0'],
            'right': seg[-1]['x1']
        })
        
    return texts

def smart_extract_text(page, y_min=0, y_max=None):
    width = float(page.width)
    height = float(page.height)
    if y_max is None: y_max = height
    
    words = page.extract_words()
    # Filter by Y
    words = [w for w in words if w['top'] >= y_min and w['bottom'] <= y_max]
    
    lines = cluster_words_into_lines(words)
    
    final_text_blocks = [] # List of strings
    
    # Column Buffers
    left_col_buffer = []
    right_col_buffer = []
    
    # Helper to flush grid
    def flush_cols():
        nonlocal left_col_buffer, right_col_buffer
        combined = ""
        if left_col_buffer: combined += "\n".join(left_col_buffer) + "\n"
        if right_col_buffer: combined += "\n".join(right_col_buffer) + "\n"
        left_col_buffer = []
        right_col_buffer = []
        return combined

    for line_cat in lines:
        segs = process_line(line_cat, width)
        
        # Check for Full Width
        # Heuristic: If a segment touches both Left (< 20%) and Right (> 80%)?
        # Or if it crosses the Center significantly?
        
        is_full = False
        center = width / 2
        
        # Merge segments if they are close? (Already done by GAP_THRESHOLD)
        # If we have 1 segment that spans wide
        if len(segs) == 1:
            s = segs[0]
            w_len = s['right'] - s['left']
            if w_len > (width * 0.6): # Wide line
                is_full = True
            # Or if it is centered Basmalah?
            if "In the name" in s['text']: is_full = True
        
        if is_full:
            # Flush columns first
            final_text_blocks.append(flush_cols())
            # Add this line
            final_text_blocks.append(segs[0]['text'])
        else:
            # Columns
            # Assign segments to Left / Right buffers
            for s in segs:
                if s['mid_x'] < center:
                    left_col_buffer.append(s['text'])
                else:
                    right_col_buffer.append(s['text'])
                    
    # Final flush
    final_text_blocks.append(flush_cols())
    
    return "\n".join([b for b in final_text_blocks if b.strip()])

def clean_1989_line_text(line):
    # Explicit truncation at known garbage/subtitle artifacts
    # These phrases appear at the end of verses and should be stripped completely from the verse text
    markers = [
        "(3) The Hypocrites",
        "The Heifer (Al-Baqarah)", 
        "Mathematical Challenge", 
        "The Light of Faith",
        "W 4 -",
        "W 4 -"
    ]
    
    # Check for markers
    for m in markers:
        # Case insensitive find? No, they seem consistent casing.
        idx = line.find(m)
        if idx != -1:
            # Found marker, truncate line at this point
            line = line[:idx].strip()
            
    # Regex for variable garbage
    line = re.sub(r'W\s*\d+\s*-{5,}.*', '', line)
    line = re.sub(r'r\s*\d+\s*-{5,}.*', '', line)
    line = re.sub(r'_{5,}.*', '', line)
    line = re.sub(r'-{10,}.*', '', line) # Dashes
    
    # Try Regex for page number patterns like "5 7 " at end of line?
    # Be careful not to delete verse numbers.
    # Pattern: Digit Space Digit Space End of Line
    line = re.sub(r'\s+\d+\s+\d+\s*$', '', line)
    
    return line.strip()

def parse_verses(raw_text, chapter_num):
    # (Same Parse Logic, but improved regex handling for subtitles)
    if "1 5H." in raw_text: raw_text = raw_text.replace("1 5H.", "158.")
    if "1 0. We placed" in raw_text: raw_text = raw_text.replace("1 0.", "16.")
    
    lines = raw_text.split('\n')
    verses = []
    footnotes = {}
    
    current_verse_num = 0
    verse_buffer = []
    
    in_footnote = False
    footnote_buffer = []
    current_footnote_id = None
    
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Filter Titles/Subtitles from Verses
        # Heuristic: "Three Categories of People" matches?
        if "Categories of People" in line or "(1) The Righteous" in line:
            # Skip noise
            continue
            
        m_head = HEADER_PAT.match(line)
        m_verse = VERSE_START_PAT.match(line)
        m_foot = FOOTNOTE_PAT.match(line)
        
        if m_head or m_verse or m_foot:
            if in_footnote and footnote_buffer:
                footnotes[current_footnote_id] = " ".join(footnote_buffer)
                footnote_buffer = []
                in_footnote = False
                current_footnote_id = None

            if (m_head or m_verse) and verse_buffer:
                v_text = " ".join(verse_buffer)
                # Cleanup
                v_text = re.sub(r'\s+', ' ', v_text)
                verses.append({
                    "chapter_number": chapter_num,
                    "verse_number": current_verse_num,
                    "text": v_text,
                    "verse_id": f"{chapter_num}:{current_verse_num}"
                })
                verse_buffer = []

        if m_head: continue
            
        if m_verse:
            new_v_num = int(m_verse.group(1))
            if current_verse_num == 0 and (new_v_num - current_verse_num > 5): continue
            current_verse_num = new_v_num
            verse_buffer.append(m_verse.group(2))
            continue
            
        if m_foot:
            in_footnote = True
            # Clean Footnote Garbage immediately
            clean_f_line = line
            clean_f_line = re.sub(r'\d+\s+\(\d+\)\s+The Hypocrites.*', '', clean_f_line)
            clean_f_line = re.sub(r'The Heifer\s+\(Al-Baqarah\)\s+\d+:\d+-\d+.*', '', clean_f_line)
            clean_f_line = re.sub(r'W\s*\d+\s*-{5,}.*', '', clean_f_line)
            clean_f_line = re.sub(r'r\s*\d+\s*-{5,}.*', '', clean_f_line)
            clean_f_line = clean_f_line.strip()
            
            footnote_buffer.append(clean_f_line)
            m_id = re.search(r'\*?(\d+:\d+)', line)
            if m_id: current_footnote_id = m_id.group(1)
            continue
            
        # Basmalah Check
        if chapter_num > 1 and current_verse_num == 0 and "in the name of god" in line.lower():
            # Treat as Verse 0
            current_verse_num = 0
            verse_buffer = [line]
            continue
        
        # Handle continuations
        if in_footnote:
            # Clean continuation garbage
            clean_f_line = line
            clean_f_line = re.sub(r'\d+\s+\(\d+\)\s+The Hypocrites.*', '', clean_f_line)
            clean_f_line = re.sub(r'The Heifer\s+\(Al-Baqarah\)\s+\d+:\d+-\d+.*', '', clean_f_line)
            clean_f_line = re.sub(r'W\s*\d+\s*-{5,}.*', '', clean_f_line)
            clean_f_line = re.sub(r'r\s*\d+\s*-{5,}.*', '', clean_f_line)
            clean_f_line = clean_f_line.strip()
            if clean_f_line: footnote_buffer.append(clean_f_line)
            
        elif verse_buffer:
            # Check for Merged Subtitles/Garbage in Verse Continuation
            clean_line = clean_1989_line_text(line)
            
            # Generic Subtitle Splitter Logic
            # Check if line ends with "Period Space Capital..." where the part after isn't a sentence
            split_match = re.match(r'(.*?[.?!])\s+([A-Z].*)$', clean_line)
            if split_match:
                cand_text = split_match.group(1).strip()
                cand_sub = split_match.group(2).strip()
                
                is_valid_sub = True
                if len(cand_sub) > 80: is_valid_sub = False
                if cand_sub.endswith('.') or cand_sub.endswith('?') or cand_sub.endswith('!'): is_valid_sub = False
                # 1989 Subtitles might end with *
                
                if is_valid_sub:
                    if "Two Deaths" in cand_sub: print(f"DEBUG: Catching Generic Sub: {cand_sub}")
                    
                    # Split
                    clean_line = cand_text
                    # Append subtitle as separate line? 
                    # In current logic, we append to verse_buffer.
                    # Ideally we want to DISCARD the subtitle from the verse text.
                    # Or store it? The 1989 script doesn't support subtitles well yet (it discards them in clean_1989_line_text).
                    # We will discard it from the verse text line.
                    print(f"DEBUG: Splitting generic subtitle: '{cand_sub}'")
                    # We append ONLY the text part
                    
            if clean_line:
                # Check for Standalone Subtitle Line (Generic)
                # If short, Title Case-ish, No Terminal Punctuation
                if len(clean_line) < 80 and re.match(r'^[A-Z]', clean_line):
                    if not (clean_line.endswith('.') or clean_line.endswith('?') or clean_line.endswith('!')):
                        # Exclude continuations
                        if not clean_line.lower().startswith(("and ", "or ", "but ", "so ", "because ", "that ")):
                             # Skip appending to verse buffer
                             continue
                
                verse_buffer.append(clean_line)
            
    # Final Flush
    if in_footnote and footnote_buffer:
        footnotes[current_footnote_id] = " ".join(footnote_buffer)
    if verse_buffer:
        v_text = " ".join(verse_buffer)
        v_text = re.sub(r'\s+', ' ', v_text)
        verses.append({
            "chapter_number": chapter_num,
            "verse_number": current_verse_num,
            "text": v_text,
            "verse_id": f"{chapter_num}:{current_verse_num}"
        })
        
    verses.sort(key=lambda x: x['verse_number'])
    return verses, footnotes

def merge_and_validate(extracted_verses, extracted_footnotes, chapter_num):
    # Minimal Merge
    with open(r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1992 Quran.json", 'r', encoding='utf-8') as f:
        ref_data = json.load(f)
    ref_verses = [v for v in ref_data if v['chapter_number'] == chapter_num]
    
    merged = []
    ext_map = {v['verse_number']: v for v in extracted_verses}
    
    for ref_v in ref_verses:
        v_num = ref_v['verse_number']
        item = ref_v.copy()
        if v_num in ext_map:
            item['verse_text_english'] = ext_map[v_num]['text']
            fk = f"{chapter_num}:{v_num}"
            item['verse_footnote_english'] = extracted_footnotes.get(fk, "")
        else:
            # Missing? Keep ref, maybe clear footnote
            item['verse_footnote_english'] = ""
        merged.append(item)
    return merged

def process_chapter(chapter_num):
    data_map = load_map()
    info = data_map[str(chapter_num)]
    start_page = info['start_page']
    start_y = info['start_y']
    end_page = info['end_page']
    end_y = info['end_y']
    
    full_text = ""
    with pdfplumber.open(PDF_PATH) as pdf:
        idx = start_page - 1
        end_idx = end_page - 1
        while idx <= end_idx:
            if idx >= len(pdf.pages): break
            page = pdf.pages[idx]
            y_mn, y_mx = 0.0, float(page.bbox[3])
            if idx == start_page - 1: y_mn = start_y + 5
            if idx == end_page - 1: y_mx = end_y
            
            # Use Smart Extract
            full_text += smart_extract_text(page, y_mn, y_mx) + "\n"
            idx += 1
            
    verses, footnotes = parse_verses(full_text, chapter_num)
    final = merge_and_validate(verses, footnotes, chapter_num)
    
    if not os.path.exists(OUTPUT_DIR): os.makedirs(OUTPUT_DIR)
    out_file = os.path.join(OUTPUT_DIR, f"chapter_{chapter_num}.json")
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(final, f, indent=2)
    print(f"Smart Extracted Chapter {chapter_num}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--chapter", type=int, required=True)
    args = parser.parse_args()
    process_chapter(args.chapter)
