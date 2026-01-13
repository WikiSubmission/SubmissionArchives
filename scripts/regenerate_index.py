import json
import os
import glob
import re

SEARCH_INDEX_PATH = r"C:\Users\Jonathan\Desktop\RKM\rk-media-platform\public\data\newsletters\search_index.json"
HTML_DIR = r"C:\Users\Jonathan\Desktop\RKM\rk-media-platform\public\data\newsletters\html"

def get_content_snippet(doc):
    # Extract text from sections
    text = ""
    # Check for pages structure (common in 1985 files)
    pages = doc.get('document', {}).get('pages', [])
    sections = []
    if pages:
        for page in pages:
            sections.extend(page.get('sections', []))
    else:
        # Check for direct sections structure (common in 1990/1989 files)
        sections = doc.get('document', {}).get('sections', [])
        
    for section in sections:
        if 'content' in section:
            text += " ".join(section['content']) + " "
        if 'title' in section:
            text += section['title'] + " "
        if 'quote_block' in section:
            qb = section['quote_block']
            t = qb.get('text', '')
            if isinstance(t, list):
                text += " ".join(t) + " "
            else:
                text += str(t) + " "
        if 'quotes' in section:
            for q in section.get('quotes', []):
                text += q.get('text', '') + " "
        if len(text) > 1000: break
    return text[:1000].strip()

def fix_search_index():
    # Read the corrupted file lines
    with open(SEARCH_INDEX_PATH, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Attempt to find where the valid JSON list likely ends (before corruption)
    # We look for the last valid specific entry we know of, e.g. 1989_sep
    # Or we can just parse the file carefully.
    
    # Simple approach: Read the file as string, find the last valid "}," and cut off.
    # But since it's a list, we might have `[ { ... }, { ...`
    
    valid_entries = []
    
    # Let's try to parse the file line by line or chunk by chunk manually because standard json.load might fail
    # However, since we know the file starts with [ and contains objects, we can try to recover strictly.
    # Actually, simpler: The file contains 1990 and 1989 entries.
    # We can just iterate over ALL json files in html dir and rebuild the index from scratch?
    # NO, because `search_index.json` might contain manually curated snippets or data not in json files?
    # A quick check of `search_index.json` content vs `html` files suggests the data comes from the json files.
    # Step 568: `1990_mar` matches `1990_mar` filename.
    
    # Hypothesis: The search index is entirely derivative of the HTML content files.
    # If so, I can just rebuild it from the files in `html`.
    # Let's check if 1990 files exist in `html`.
    
    if os.path.exists(os.path.join(HTML_DIR, "1990_mar.json")):
        print("Rebuilding index entirely from source files.")
        rebuild_full_index()
    else:
        print("1990 source files not found. Repairing existing index.")
        repair_index(lines)

def rebuild_full_index():
    all_files = glob.glob(os.path.join(HTML_DIR, "*.json"))
    entries = []
    
    for file_path in all_files:
        filename = os.path.basename(file_path).replace('.json', '')
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        header = data.get('document', {}).get('header', {})
        
        # Determine display date
        display_date = header.get('date', '').upper()
        
        # Determine full date (approximate)
        # 1985_may -> 1985-05-01
        parts = filename.split('_')
        year = parts[0]
        month_str = parts[1] if len(parts) > 1 else '01'
        
        month_map = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
            'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        }
        month = month_map.get(month_str.lower(), '01')
        full_date = f"{year}-{month}-01"
        
        content_snippet = get_content_snippet(data)
        
        entry = {
            "id": filename,
            "title": header.get('title', 'Submitter Perspectives') + " " + header.get('date', ''),
            "displayDate": display_date,
            "fullDate": full_date,
            "filename": filename,
            "content": content_snippet
        }
        entries.append(entry)
    
    # Sort entries by fullDate descending
    entries.sort(key=lambda x: x['fullDate'], reverse=True)
    
    with open(SEARCH_INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump(entries, f, indent=2)
    print(f"Rebuilt index with {len(entries)} entries.")

def repair_index(lines):
    # Retrieve valid JSON content string
    content = "".join(lines)
    # The corruption at the end: ... "content": "THE MIRAC\n] { ...
    # We'll try to find the last closing brace `}` inside the array and close the list there.
    last_brace = content.rfind('},')
    if last_brace == -1:
        last_brace = content.rfind('}')
    
    if last_brace != -1:
        valid_json_str = content[:last_brace+1] + "]"
        try:
            existing_entries = json.loads(valid_json_str)
        except json.JSONDecodeError:
            # Fallback: regex to extract objects
            print("JSON parse failed, manual extraction needed.")
            return

        # Now append 1985 entries
        new_entries = []
        # (Assuming I have to load them, but rebuilding is safer if files exist)
        
        # Logic to append 1985 if not present
        # ...
        pass
        
if __name__ == "__main__":
    fix_search_index()
