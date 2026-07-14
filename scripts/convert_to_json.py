import os
import re
import json
import datetime

source_dir = r"c:\Users\Jonathan\Desktop\SA\public\content\books\transcription"
dest_dir = r"c:\Users\Jonathan\Desktop\SA\public\content\books\jsons"

files_to_process = [
    "English Meanings of the Quran - Rashad Khalifa Ph.D._transcription.md",
    "ETERNITY - Screenplay - Rashad Khalifa Ph. D._transcription.md",
    "Islam - Volume 1_transcription.md",
    "Miracle of Quran - Significance of the Mysterious Alphabets - Rashad Khalifa Ph. D._transcription.md",
    "Quran - Visual Presentation of the Miracle - Rashad Khalifa Ph. D._transcription.md",
    "The Computer Speaks God's Message to the World - Rashad Khalifa Ph. D._transcription.md"
]

def process_file(filename):
    file_path = os.path.join(source_dir, filename)
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    
    title = filename.replace("_transcription.md", "")
    source_file = filename.replace("_transcription.md", ".pdf")
    
    # Try to find a better title from line 1
    if lines and lines[0].startswith("# Transcription of "):
        pass # title is already fine from filename

    sections = []
    current_page = None
    current_text = []
    
    page_regex = re.compile(r"^##\s+Page\s+(\d+)", re.IGNORECASE)

    for line in lines:
        match = page_regex.match(line.strip())
        if match:
            # Save previous page if exists
            if current_page is not None:
                text_content = '\n'.join(current_text).strip()
                if text_content:
                    sections.append({
                        "id": f"page-{current_page}",
                        "title": f"Page {current_page}",
                        "pdf_pages": [int(current_page)],
                        "content": text_content
                    })
            
            current_page = match.group(1)
            current_text = []
        else:
            if current_page is not None:
                current_text.append(line)
            else:
                # Text before the first page declaration (usually just the # Transcription header)
                pass

    # Save the last page
    if current_page is not None:
        text_content = '\n'.join(current_text).strip()
        if text_content:
            sections.append({
                "id": f"page-{current_page}",
                "title": f"Page {current_page}",
                "pdf_pages": [int(current_page)],
                "content": text_content
            })
            
    # Count unique pages
    page_count = len(sections)

    metadata = {
        "title": title,
        "source_file": source_file,
        "page_count": page_count,
        "transcription_date": datetime.datetime.now().strftime("%Y-%m-%d"),
        "transcription_notes": [
            "Generated automatically by page-level structural parsing."
        ]
    }

    output_data = {
        "metadata": metadata,
        "sections": sections
    }

    out_filename = filename.replace("_transcription.md", "_organized.json")
    out_path = os.path.join(dest_dir, out_filename)

    os.makedirs(dest_dir, exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
        
    print(f"Processed {filename} -> {out_filename} ({page_count} pages)")

for fname in files_to_process:
    if os.path.exists(os.path.join(source_dir, fname)):
        process_file(fname)
    else:
        print(f"File not found: {fname}")
