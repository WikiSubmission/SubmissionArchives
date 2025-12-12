import re
import json
import sys
import os

try:
    from pypdf import PdfReader
except ImportError:
    print("pypdf not found. Please install it using `pip install pypdf`")
    sys.exit(1)

def extract_pdf_structure(pdf_path):
    reader = PdfReader(pdf_path)
    content = []
    
    current_chapter = None
    chapter_buffer = []
    
    # Regex for chapter titles like "01 What Life is All About..."
    # Adjust based on observation: "01 What Life is All About & Who is GOD?" 
    # appearing on a line by itself or near top of page.
    title_pattern = re.compile(r'^\d+\s+[A-Za-z].+')
    
    # Regex for timestamps like "1:15", "10:30", "1:05:00"
    timestamp_pattern = re.compile(r'\b\d{1,2}:\d{2}(?::\d{2})?\b')

    print(f"Processing PDF: {pdf_path}")
    print(f"Total Pages: {len(reader.pages)}")

    full_text_lines = []
    
    for page_num, page in enumerate(reader.pages):
        text = page.extract_text()
        if not text:
            continue
            
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check for Chapter Title
            # Heuristic: Starts with number, some length, checking for non-sentence endings
            # Titles in sample were: "01 What Life is All About & Who is GOD?"
            is_title = False
            match = title_pattern.match(line)
            
            # Quran Study titles can be long (dates, locations, etc)
            is_quran_study_title = match and "Quran Study" in line
            
            if match:
                if is_quran_study_title:
                     is_title = True
                elif len(line) < 200: # Increased from 80
                    # Exclude lines that look like sentences (end in .)
                    if not line.endswith('.'):
                        # Exclude lines starting with a year like 1980 followed by lowercase
                        # Title usually has Capitalized Words
                        words = line.split()
                        if len(words) > 1 and words[1][0].islower() and words[1] not in ['of', 'the', 'is', 'a', 'to']:
                             pass
                        else:
                             is_title = True
                
            if is_title:
                # Save previous chapter if exists
                if current_chapter:
                    current_chapter['text'] = "\n".join(chapter_buffer)
                    content.append(current_chapter)
                
                # Start new chapter
                current_chapter = {
                    'title': line,
                    'start_page': page_num + 1,
                    'text': "",
                    'timestamps': []
                }
                chapter_buffer = []
                print(f"Found Chapter: {line}")
            else:
                if current_chapter:
                    # Check for sparse timestamps in this line
                    ts_matches = timestamp_pattern.findall(line)
                    for ts in ts_matches:
                        # Estimate character offset in the current buffer
                        # This is rough, but useful for anchoring
                        current_char_len = sum(len(l) + 1 for l in chapter_buffer)
                        current_chapter['timestamps'].append({
                            'time_str': ts,
                            'char_offset': current_char_len + line.find(ts)
                        })
                    
                    chapter_buffer.append(line)
                else:
                    # Content before first chapter?
                    pass
    
    # Add last chapter
    if current_chapter:
        current_chapter['text'] = "\n".join(chapter_buffer)
        content.append(current_chapter)
        
    return content

if __name__ == "__main__":
    pdf_path = r"c:\Users\Jonathan\Desktop\RKM\Transcripts of All Quran Studies (Audios) - Dr. Rashad Khalifa (Messenger of the Covenant).pdf"
    
    if not os.path.exists(pdf_path):
        print(f"PDF not found at: {pdf_path}")
        sys.exit(1)
        
    structure = extract_pdf_structure(pdf_path)
    
    output_path = r"c:\Users\Jonathan\Desktop\RKM\data\pdf_structure.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(structure, f, indent=2)
        
    print(f"Extracted {len(structure)} chapters to {output_path}")
    
    # Print preview
    for chap in structure:
        print(f"Title: {chap['title']}, Length: {len(chap['text'])} chars, Timestamps: {len(chap['timestamps'])}")
