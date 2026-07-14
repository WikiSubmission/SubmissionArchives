import json
import re
import os

md_path = r"c:\Users\Jonathan\Desktop\SA\public\content\books\transcription\Quran The Final Scripture (Authorized English Version) by Rashad Khalifa (z-lib.org) (2)_transcription.md"
out_path = r"c:\Users\Jonathan\Desktop\SA\public\content\books\jsons\Quran1981.json"

page_pattern = re.compile(r'^## Page (\d+)')
sura_pattern = re.compile(r'^\s*\**(Sura\s+\d+\s*:.*)', re.IGNORECASE)
appendix_pattern = re.compile(r'^\s*\**(APPENDIX\s+.*?)\**$', re.IGNORECASE)

sections_map = {}
pages_data = []

current_section_id = "intro"
current_section_title = "Introduction / Title Pages"

# Pre-populate intro section
sections_map[current_section_id] = {
    "id": current_section_id,
    "title": current_section_title,
    "pdf_pages": []
}

current_page = None
current_text = []
current_elements = []
active_element = None

current_chapter = 0
current_verse = 0
verse_pattern = re.compile(r'^(\d+)\.\s+(.*)')

def finish_page():
    global current_page, current_text, current_elements, active_element
    if current_page is not None:
        text_joined = "\n".join(current_text).strip()
        page_type = "cover" if current_page == 1 else "main_text"
        pages_data.append({
            "pdf_page": current_page,
            "printed_page_number": None,
            "page_type": page_type,
            "transcribed_text": text_joined,
            "title_lines": [],
            "quran_elements": list(current_elements)
        })
        current_text = []
        current_elements = []
        active_element = None

with open(md_path, 'r', encoding='utf-8') as f:
    for line in f:
        line_stripped = line.strip()
        page_match = page_pattern.match(line_stripped)
        if page_match:
            finish_page()
            current_page = int(page_match.group(1))
            sections_map[current_section_id]['pdf_pages'].append(current_page)
            continue
            
        if current_page is None:
            continue
            
        if not line_stripped:
            active_element = None
            
        sura_match = sura_pattern.match(line_stripped)
        if sura_match:
            title = sura_match.group(1).strip('* ')
            sura_num = int(re.search(r'\d+', title).group(0))
            current_chapter = sura_num
            current_verse = 0
            
            sec_id = f"sura_{sura_num}"
            if sec_id not in sections_map:
                current_section_id = sec_id
                current_section_title = title
                sections_map[current_section_id] = {
                    "id": current_section_id,
                    "title": current_section_title,
                    "pdf_pages": [current_page]
                }
            elif current_page not in sections_map[current_section_id]['pdf_pages']:
                sections_map[current_section_id]['pdf_pages'].append(current_page)

        app_match = appendix_pattern.match(line_stripped)
        if app_match:
            title = app_match.group(1).strip('* ')
            sec_id = "appendix_" + re.sub(r'[^a-zA-Z0-9]', '_', title).lower()
            if sec_id not in sections_map:
                current_section_id = sec_id
                current_section_title = title
                sections_map[current_section_id] = {
                    "id": current_section_id,
                    "title": current_section_title,
                    "pdf_pages": [current_page]
                }
            elif current_page not in sections_map[current_section_id]['pdf_pages']:
                sections_map[current_section_id]['pdf_pages'].append(current_page)

        # Element tracking
        if current_chapter > 0:
            if line_stripped.startswith('**') and line_stripped.endswith('**') and not sura_match:
                active_element = {'type': 'subtitle', 'chapter': current_chapter, 'verse': current_verse, 'text': [line_stripped.strip('* ')]}
                current_elements.append(active_element)
            elif line_stripped.startswith('*') and not line_stripped.startswith('**') and not app_match:
                active_element = {'type': 'footnote', 'chapter': current_chapter, 'verse': current_verse, 'text': [line_stripped.lstrip('*').strip()]}
                current_elements.append(active_element)
            else:
                v_match = verse_pattern.match(line_stripped)
                if v_match:
                    v_num = int(v_match.group(1))
                    # simple heuristic for verse numbers
                    if v_num == 1 or v_num == current_verse + 1 or v_num == current_verse:
                        if v_num != current_verse:
                            current_verse = v_num
                        
                        v_text = v_match.group(2)
                        active_element = {'type': 'verse', 'chapter': current_chapter, 'verse': current_verse, 'text': [v_text]}
                        current_elements.append(active_element)
                    else:
                        if active_element:
                            active_element['text'].append(line_stripped)
                elif line_stripped and active_element and not sura_match and not app_match:
                    active_element['text'].append(line_stripped)

        current_text.append(line_stripped)

finish_page()

# Post-process elements to join text
for page in pages_data:
    if 'quran_elements' in page:
        for el in page['quran_elements']:
            joined_text = " ".join(el['text'])
            if el['type'] == 'verse':
                joined_text = re.sub(r'\*\*(.*?)\*\*', r'\1', joined_text)
                joined_text = re.sub(r'\*$', '', joined_text)
            el['text'] = joined_text

# Clean up sections (remove empty ones, deduplicate pdf_pages)
sections_list = []
for sec in sections_map.values():
    sec['pdf_pages'] = sorted(list(set(sec['pdf_pages'])))
    if sec['pdf_pages']:
        sections_list.append(sec)

metadata = {
    "title": "Quran: The Final Scripture (Authorized English Version)",
    "subtitle": "Translated from the Original by Rashad Khalifa, Ph.D.",
    "source_file": "Quran1981.pdf",
    "page_count": len(pages_data),
    "copyright_year": 1981,
    "publisher_line": "Islamic Productions",
    "digitization_note_in_book": "Digitized by Google",
    "transcription_date": "2026-07-10",
    "transcription_notes": [
        "Converted from markdown transcription.",
        "Sections are automatically generated based on Sura and Appendix headers."
    ]
}

final_json = {
    "metadata": metadata,
    "sections": sections_list,
    "pages": pages_data
}

with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(final_json, f, ensure_ascii=False, indent=2)

print(f"Successfully generated {out_path} with {len(pages_data)} pages and {len(sections_list)} sections.")
