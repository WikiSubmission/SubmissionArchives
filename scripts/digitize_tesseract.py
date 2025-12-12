import pytesseract
from pdf2image import convert_from_path
import cv2
import numpy as np
import re
import json
import os
import sys
import multiprocessing
from tqdm import tqdm
try:
    from scripts.metadata import CHAPTER_METADATA
except ImportError:
    try:
        from metadata import CHAPTER_METADATA
    except ImportError:
        # Fallback if running from root without package structure
        sys.path.append(os.path.join(os.getcwd(), 'scripts'))
        from metadata import CHAPTER_METADATA

# --- CONFIGURATION ---
PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"
OUTPUT_JSON = r"c:\Users\Jonathan\Desktop\RKM\data\1989_tesseract.json"
POPPLER_PATH = r"C:\Users\Jonathan\AppData\Local\Programs\MiKTeX\miktex\bin\x64" # From env check
TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# If Tesseract is not in PATH, set it manually
if os.path.exists(TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

# Layout Constants (Adjusted for 300 DPI)
DPI = 300
PAGE_WIDTH = 2550 # Approx for 8.5x11 @ 300 DPI (Adjust dynamically if needed)
CENTER_TOLERANCE = 100
GUTTER_WIDTH = 80 # Pixels
COLUMN_MARGIN = 50

# Regex
VERSE_START_PAT = re.compile(r'^(\d{1,3})\.\s+([A-Z].*)') # "1. Text..."
FOOTNOTE_PAT = re.compile(r'^\*?(\d{1,3}):(\d{1,3})(-\d{1,3})?\s+') # "2:1" or "*2:1" or "2:1-5"
HEADER_PAT = re.compile(r'^\s*(Sura|Chapter)\s+(\d+)', re.IGNORECASE)

# --- IMAGE PROCESSING ---
def preprocess_image(image):
    """Convert PIL image to CV2, grayscale, adaptive threshold."""
    img = np.array(image)
    if len(img.shape) == 3:
        img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    
    # Denoise (Optional, can be slow)
    # img = cv2.fastNlMeansDenoising(img, None, 10, 7, 21)

    # Adaptive Thresholding - Best for variable lighting/text
    img = cv2.adaptiveThreshold(
        img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 11, 2
    )
    return img

# --- PAGE PROCESSING ---
def get_column(x, page_width):
    """Determine if x is in Col 1, Col 2, or Header/Margin."""
    center = page_width / 2
    left_bound = center - (GUTTER_WIDTH / 2)
    right_bound = center + (GUTTER_WIDTH / 2)
    
    if x < left_bound:
        return 1
    elif x > right_bound:
        return 2
    else:
        return 0 # Gutter or Center (Header?)

def process_page(page_idx):
    """
    1. Convert Page to Image
    2. Preprocess
    3. Run Tesseract (Data Mode)
    4. Sort Text by Column -> Y -> X
    5. Parse Structure
    """
    try:
        # Convert single page
        images = convert_from_path(
            PDF_PATH, 
            first_page=page_idx, 
            last_page=page_idx, 
            dpi=DPI,
            poppler_path=POPPLER_PATH
        )
        if not images: return []
        
        image = images[0]
        width, height = image.size
        
        # Preprocess
        processed_img = preprocess_image(image)
        
        # OCR - Get Data (bbox level)
        data = pytesseract.image_to_data(processed_img, lang='eng', output_type=pytesseract.Output.DICT)
        
        # Group words into lines
        # Tesseract gives words. logical lines are blocked by 'block_num', 'par_num', 'line_num'
        # But we need to enforce OUR column logic.
        
        word_list = []
        n_boxes = len(data['text'])
        for i in range(n_boxes):
            if int(data['conf'][i]) > 0: # valid confidence
                text = data['text'][i].strip()
                if not text: continue
                
                x = data['left'][i]
                y = data['top'][i]
                w = data['width'][i]
                h = data['height'][i]
                
                col = get_column(x + w/2, width) # Use center of word for column
                word_list.append({
                    'text': text,
                    'col': col,
                    'y': y,
                    'x': x,
                    'h': h,
                    'line_key': y // 20 # Fuzzy Y grouping (approx line height)
                })
        
        # Sorting Strategy:
        # 1. Column (1, then 2)
        # 2. Vertical Position (Y)
        # 3. Horizontal Position (X) (for reading words in a line)
        
        word_list.sort(key=lambda w: (w['col'], w['line_key'], w['x']))
        
        # Reconstruct Lines
        lines = []
        current_line = []
        last_y_key = -1
        last_col = -1
        
        for w in word_list:
            if w['col'] == 0: continue # Skip gutter noise? Or maybe Headers are centered (Col 0)
            
            # New Line Detection: Different Y or Different Column
            if w['line_key'] != last_y_key or w['col'] != last_col:
                if current_line:
                    lines.append(" ".join([wd['text'] for wd in current_line]))
                current_line = []
                last_y_key = w['line_key']
                last_col = w['col']
            
            current_line.append(w)
        
        if current_line:
            lines.append(" ".join([wd['text'] for wd in current_line]))
            
        return lines

    except Exception as e:
        print(f"Error on Page {page_idx}: {e}")
        return []

# --- PARSING LOGIC ---
def parse_lines_to_verses(all_lines):
    verses = []
    current_chap = 0
    current_verse_num = 0
    verse_buffer = []
    
    for line in all_lines:
        line = line.strip()
        if not line: continue
        
        # Check Header
        m_head = HEADER_PAT.match(line)
        if m_head:
            current_chap = int(m_head.group(2))
            continue
            
        # Check Verse Start "1. Text"
        m_verse = VERSE_START_PAT.match(line)
        if m_verse:
            # Save previous
            if verse_buffer and current_chap > 0:
                v_text = " ".join(verse_buffer)
                verses.append({
                    "chapter_number": current_chap,
                    "verse_number": current_verse_num,
                    "text": v_text,
                    "verse_id": f"{current_chap}:{current_verse_num}"
                })
            
            # Start New
            current_verse_num = int(m_verse.group(1))
            verse_buffer = [m_verse.group(2)]
            continue
            
        # Check Footnote
        if FOOTNOTE_PAT.match(line):
             # End current verse logic? Footnotes usually interrupt flow or are at bottom.
             # Ideally treat as separate entity. For now, skip or store separately.
             continue
             
        # Continuation
        if verse_buffer:
            verse_buffer.append(line)
            
    # Flush last
    if verse_buffer and current_chap > 0:
        verses.append({
             "chapter_number": current_chap,
             "verse_number": current_verse_num,
             "text": " ".join(verse_buffer),
             "verse_id": f"{current_chap}:{current_verse_num}"
        })
    
    return verses

def main():
    # 1. PDF Info
    try:
        info = convert_from_path(PDF_PATH, first_page=1, last_page=1, poppler_path=POPPLER_PATH)
    except Exception as e:
        print(f"Critcal Error: Cannot convert PDF. {e}")
        return

    # 2. Multiprocessing Pool
    # Process pages 20 to 748 (Skip initial roman numerals)
    pages = range(20, 748) 
    
    print(f"Starting OCR on {len(pages)} pages using {multiprocessing.cpu_count()} cores...")
    
    all_extracted_lines = []
    
    # Chunking for memory safety & Checkpoints
    results = []
    all_extracted_lines = []
    
    with multiprocessing.Pool() as pool:
        # Use imap to separate results by page order
        iterator = pool.imap(process_page, pages)
        
        for i, res in enumerate(tqdm(iterator, total=len(pages))):
            results.append(res)
            all_extracted_lines.extend(res)
            
            # CHECKPOINT every 50 pages
            if (i + 1) % 50 == 0:
                print(f"\n[Checkpoint] Saving at page {i+1}...")
                current_verses = parse_lines_to_verses(all_extracted_lines)
                ckpt_path = OUTPUT_JSON.replace(".json", f"_ckpt_{i+1}.json")
                with open(ckpt_path, "w", encoding="utf-8") as f:
                    json.dump(current_verses, f, indent=2)
                print(f"Saved {len(current_verses)} verses to {ckpt_path}")
        
    print("OCR Complete. Parsing structure...")
    verses = parse_lines_to_verses(all_extracted_lines)
    
    print(f"Found {len(verses)} verses.")
    
    # Save
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(verses, f, indent=2)
    print(f"Saved to {OUTPUT_JSON}")

if __name__ == "__main__":
    multiprocessing.freeze_support()
    main()
