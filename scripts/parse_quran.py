import os
import csv
import re
from difflib import SequenceMatcher

def load_first_verses(quran_dir):
    path = os.path.join(quran_dir, "ws_quran_text_rows.csv")
    first_verses = {}
    with open(path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['verse_number'] == '1':
                text = re.sub(r'[^a-zA-Z0-9\s]', '', row['english']).lower()
                first_verses[int(row['chapter_number'])] = text
    return first_verses

def get_best_chapter_match(v_text, first_verses):
    v_clean = re.sub(r'[^a-zA-Z0-9\s]', '', v_text).lower()
    best_chapter = None
    best_ratio = 0
    for chapter, text in first_verses.items():
        ratio = SequenceMatcher(None, v_clean, text).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_chapter = chapter
            
    if best_ratio > 0.6: 
        return best_chapter
    return None

def parse_transcription(input_md_path, output_dir, primary_chapters, first_verses):
    os.makedirs(output_dir, exist_ok=True)
    is_1981 = "1981" in output_dir
    
    text_headers = ['verse_index', 'verse_id', 'english', 'arabic', 'transliterated', 'arabic_clean', 'chapter_number', 'verse_number', 'turkish', 'french', 'german', 'bahasa', 'persian', 'tamil', 'swedish', 'russian', 'bengali', 'urdu', 'persian_new', 'spanish']
    chapter_headers = ['chapter_number', 'chapter_verses', 'revelation_order', 'title_english', 'title_arabic', 'title_transliterated', 'title_turkish', 'title_french', 'title_german', 'title_bahasa', 'title_persian', 'title_tamil', 'title_swedish', 'title_russian', 'title_bengali', 'title_urdu', 'title_spanish']
    subtitle_headers = ['verse_index', 'verse_id', 'english', 'chapter_number', 'verse_number', 'turkish', 'french', 'german', 'bahasa', 'persian', 'tamil', 'swedish', 'russian', 'bengali', 'spanish', 'urdu']
    footnote_headers = ['verse_index', 'verse_id', 'english', 'chapter_number', 'verse_number', 'turkish', 'french', 'german', 'bahasa', 'persian', 'tamil', 'swedish', 'russian', 'bengali', 'spanish', 'urdu']
    
    verses = []
    subtitles = []
    footnotes = []
    
    current_chapter = 0
    current_verse = 0
    current_text = []
    in_verse = False
    current_footnote = None
    
    def append_current_footnote():
        nonlocal current_footnote
        if current_footnote:
            footnotes.append({
                'chapter_number': current_footnote['chapter'],
                'verse_number': current_footnote['verse'],
                'english': '\n\n'.join(current_footnote['text']).strip()
            })
            current_footnote = None
    
    page_pattern = re.compile(r'^## Page \d+')
    footnote_ref_pattern = re.compile(r'^\*(\d+):(\d+)\s+(.*)')
    
    with open(input_md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        verse_pattern = re.compile(r'^(?:(\d+)\.|\((\d+)\.?\))\s*(.*)')
    
    for line in lines:
        line = line.strip()
        
        # Check explicit Sura header (mostly for 1981 edition)
        sura_match = re.match(r'^\s*\**(Sur[ae]\s+(\d+)\s*:.*)', line, re.IGNORECASE)
        if sura_match:
            append_current_footnote()
            if current_text and current_chapter > 0 and current_verse > 0:
                verses.append({
                    'chapter_number': current_chapter,
                    'verse_number': current_verse,
                    'english': ' '.join(current_text)
                })
            current_chapter = int(sura_match.group(2))
            current_verse = 0
            current_text = []
            in_verse = False
            continue
            
        # Stop parsing verses if we reach appendices
        if re.match(r'^\s*\**(APPENDIX|The Simple Facts|Index|Glossary)', line, re.IGNORECASE):
            append_current_footnote()
            if current_text and current_chapter > 0 and current_verse > 0:
                verses.append({
                    'chapter_number': current_chapter,
                    'verse_number': current_verse,
                    'english': ' '.join(current_text)
                })
            current_chapter = 0
            in_verse = False
            continue
        if not line:
            in_verse = False
            continue
            
        if page_pattern.match(line) or line.startswith('---'):
            continue
            
        if 'here is' in line.lower() and 'transcription' in line.lower():
            continue
            
        if re.match(r'^[*_]*[a-zA-Z\s\'-]+\s*\([^)]+\)\s*\d+:\d+(?:-\d+)?[*_]*\s*$', line):
            continue
            
        # Check subtitles
        if line.startswith('**') and line.endswith('**'):
            append_current_footnote()
            if current_chapter > 0:
                subtitle_text = line.strip('*').strip()
                subtitles.append({
                    'chapter_number': current_chapter,
                    'verse_number': current_verse + 1,
                    'english': subtitle_text
                })
            continue
            
        # Check 1981 footnotes
        footnote_1981_match = re.match(r'^(\d+):(\d+)\.\s+(.*)', line)
        if is_1981 and footnote_1981_match:
            append_current_footnote()
            f_chap = int(footnote_1981_match.group(1))
            f_verse = int(footnote_1981_match.group(2))
            f_text = footnote_1981_match.group(3).strip()
            current_footnote = {'chapter': f_chap, 'verse': f_verse, 'text': [f_text]}
            in_verse = False
            continue
            
        # Check footnotes
        if line.startswith('*') and not line.startswith('**'):
            append_current_footnote()
            if current_chapter > 0:
                ref_match = footnote_ref_pattern.match(line)
                if ref_match:
                    f_chap = int(ref_match.group(1))
                    f_verse = int(ref_match.group(2))
                    f_text = ref_match.group(3).strip()
                    footnotes.append({
                        'chapter_number': f_chap,
                        'verse_number': f_verse,
                        'english': f_text
                    })
                else:
                    footnote_text = line.strip('*').strip()
                    footnotes.append({
                        'chapter_number': current_chapter,
                        'verse_number': current_verse,
                        'english': footnote_text
                    })
            continue

        match = verse_pattern.match(line)
        if match:
            append_current_footnote()
            v_num_str = match.group(1) if match.group(1) else match.group(2)
            v_num = int(v_num_str)
            v_text = match.group(3)
            
            # Subtitle or Footnote logic
            if v_text.startswith('**') and v_text.endswith('**'):
                subtitles.append({'chapter_number': current_chapter, 'verse_number': v_num, 'english': v_text.strip('* ')})
                continue
            if v_text.startswith('*') and not v_text.startswith('**'):
                footnotes.append({'chapter_number': current_chapter, 'verse_number': v_num, 'english': v_text.lstrip('*').strip()})
                continue
                
            if v_num == 1:
                if not is_1981 and current_chapter == 0 and "In the name of" in v_text:
                    current_chapter = 1
                    current_verse = 1
                    current_text = [v_text]
                    in_verse = True
                    continue
                    
                if current_chapter > 0 and not is_1981:
                    matched_chapter = get_best_chapter_match(v_text, first_verses)
                    expected_verses = primary_chapters.get(current_chapter, 999)
                    
                    if matched_chapter and matched_chapter > current_chapter:
                        if current_text:
                            verses.append({'chapter_number': current_chapter, 'verse_number': current_verse, 'english': ' '.join(current_text)})
                        current_chapter = matched_chapter
                        current_verse = 1
                        current_text = [v_text]
                        in_verse = True
                        continue
                    elif current_verse >= expected_verses - 10:
                        if current_text:
                            verses.append({'chapter_number': current_chapter, 'verse_number': current_verse, 'english': ' '.join(current_text)})
                        if current_chapter < 114:
                            current_chapter += 1
                        current_verse = 1
                        current_text = [v_text]
                        in_verse = True
                        continue
                        
            if current_chapter == 0:
                continue
                
            if v_num > current_verse:
                if current_text:
                    verses.append({'chapter_number': current_chapter, 'verse_number': current_verse, 'english': ' '.join(current_text)})
                current_verse = v_num
                current_text = [v_text]
                in_verse = True
            elif v_num == current_verse:
                current_text.append(v_text)
                in_verse = True
            else:
                if in_verse:
                    current_text.append(line)
        else:
            if current_footnote:
                current_footnote['text'].append(line)
            elif current_chapter > 0 and in_verse:
                current_text.append(line)
                
    if current_chapter > 0 and current_text:
        verses.append({'chapter_number': current_chapter, 'verse_number': current_verse, 'english': ' '.join(current_text)})
        
    append_current_footnote()
        
    print(f"Parsed {len(verses)} verses, {len(subtitles)} subtitles, {len(footnotes)} footnotes across {current_chapter} chapters for {os.path.basename(output_dir)}.")
    
    def write_csv(filename, headers, data):
        path = os.path.join(output_dir, filename)
        with open(path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            for idx, item in enumerate(data, start=1):
                row = {col: '' for col in headers}
                row['verse_index'] = idx
                row['verse_id'] = f"{item['chapter_number']}:{item['verse_number']}"
                row['chapter_number'] = item['chapter_number']
                row['verse_number'] = item['verse_number']
                
                english_text = item['english']
                if filename == 'ws_quran_text_rows.csv':
                    english_text = re.sub(r'\*\*(.*?)\*\*', r'\1', english_text)
                    english_text = re.sub(r'\*$', '', english_text)
                    
                row['english'] = english_text
                writer.writerow(row)
                
    write_csv('ws_quran_text_rows.csv', text_headers, verses)
    write_csv('ws_quran_subtitles_rows.csv', subtitle_headers, subtitles)
    write_csv('ws_quran_footnotes_rows.csv', footnote_headers, footnotes)
    
    chapters_csv_path = os.path.join(output_dir, 'ws_quran_chapters_rows.csv')
    with open(chapters_csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=chapter_headers)
        writer.writeheader()
        for c in range(1, 115):
            row = {col: '' for col in chapter_headers}
            row['chapter_number'] = c
            row['chapter_verses'] = primary_chapters.get(c, 0)
            writer.writerow(row)

quran_dir = r"c:\Users\Jonathan\Desktop\SA\public\Quran"
transcriptions_dir = r"c:\Users\Jonathan\Desktop\SA\public\content\books\transcription"

primary_chapters = {}
chapters_path = os.path.join(quran_dir, "ws_quran_chapters_rows.csv")
with open(chapters_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        primary_chapters[int(row['chapter_number'])] = int(row['chapter_verses'])

first_verses = load_first_verses(quran_dir)

file_1989 = os.path.join(transcriptions_dir, "Hard Cover 1989_transcription.md")
file_1981 = os.path.join(transcriptions_dir, "Quran The Final Scripture (Authorized English Version) by Rashad Khalifa (z-lib.org) (2)_transcription.md")

parse_transcription(file_1989, os.path.join(quran_dir, "1989"), primary_chapters, first_verses)
parse_transcription(file_1981, os.path.join(quran_dir, "1981"), primary_chapters, first_verses)
