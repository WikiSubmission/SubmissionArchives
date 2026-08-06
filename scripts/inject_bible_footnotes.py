import csv
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

VPL_PATH = 'data/sources/bible/engwebu_vpl.txt'
FOOTNOTES_CSV_PATH = 'data/sources/bible/ws_bible_footnotes_rows.csv'
INDICES_DIR = 'public/data/generated_indices/bible'

# 1. Read VPL file to map verse_index -> (bookCode, chapter_number, verse_number)
vpl_index = {}
with open(VPL_PATH, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f, 1):
        parts = line.strip().split(' ', 2)
        if len(parts) >= 2:
            book_code = parts[0].lower() # e.g. 'gen'
            ref_parts = parts[1].split(':')
            if len(ref_parts) == 2:
                ch_num = int(ref_parts[0])
                v_num = int(ref_parts[1])
                vpl_index[idx] = (book_code, ch_num, v_num)

print(f"Loaded {len(vpl_index)} VPL verse mappings.")

# 2. Read footnotes CSV and map (bookCode, chapter_number, verse_number) -> footnote_text
footnotes_map = {}
with open(FOOTNOTES_CSV_PATH, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        v_idx = int(row['verse_index'])
        fn_text = row['english'].strip()
        if v_idx in vpl_index:
            book_code, ch_num, v_num = vpl_index[v_idx]
            key = (book_code, ch_num, v_num)
            if key in footnotes_map:
                footnotes_map[key] += " | " + fn_text
            else:
                footnotes_map[key] = fn_text

print(f"Mapped {len(footnotes_map)} footnotes to specific verses.")

# 3. Inject footnotes into generated Bible JSON files
json_files = [f for f in os.listdir(INDICES_DIR) if f.endswith('.json') and f != 'catalog.json']
injected_count = 0

for jf in json_files:
    file_path = os.path.join(INDICES_DIR, jf)
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    book_code = data['bookCode'].lower()
    modified = False
    
    for ch in data.get('chapters', []):
        ch_num = ch['chapterNumber']
        for v in ch.get('verses', []):
            v_num = v['verseNumber']
            key = (book_code, ch_num, v_num)
            if key in footnotes_map:
                v['footnote'] = footnotes_map[key]
                injected_count += 1
                modified = True
            elif 'footnote' in v:
                del v['footnote']
                modified = True

    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Successfully injected {injected_count} footnotes across {len(json_files)} Bible book files!")
