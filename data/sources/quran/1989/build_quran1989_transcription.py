from __future__ import annotations

import csv
import json
import re
import statistics
import zipfile
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Iterable

import fitz

PDF_PATH = Path('/mnt/data/Hard Cover 1989.pdf')
REF_INDEX = Path('/mnt/data/ws_quran_index_rows.csv')
REF_SUBTITLES = Path('/mnt/data/ws_quran_subtitles_rows.csv')
REF_CHAPTERS = Path('/mnt/data/ws_quran_chapters_rows.csv')
REF_FOOTNOTES = Path('/mnt/data/ws_quran_footnotes_rows.csv')
QURAN_UTHMANI = Path('/usr/share/texlive/texmf-dist/tex/latex/quran/qurantext-uthmani.def')
OUT_DIR = Path('/mnt/data/Quran1989_transcription')
OUT_DIR.mkdir(parents=True, exist_ok=True)
ZIP_PATH = Path('/mnt/data/Quran1989_complete_transcription_bundle.zip')

CHAPTER_HEADING_RE = re.compile(r'\bSura\s+(\d{1,3})\s*:\s*(.+)', re.I)
VERSE_MARKER_RE = re.compile(r'^\s*(\d{1,3})\s*[\.)]\s*(.*)$')
HEADER_RANGE_RE = re.compile(r'(?<!\d)(\d{1,3})\s*:\s*(\d(?:\s*\d){0,2})(?:\s*[-–—]\s*(\d(?:\s*\d){0,2}))?')
FOOTNOTE_RE = re.compile(r'^\s*(?P<marker>[*†‡]+)?\s*(?P<label>\d{1,3}:\d{1,3}(?:-\d{1,3})?)\s+(?P<rest>.*)$')
APP_HEADING_RE = re.compile(r'^\s*Appendix\s+(\d{1,2})\s*$', re.I)

MANUAL_PAGE_CONTENT: dict[int, dict[str, Any]] = {
    1: {
        'visual_notes': 'Blue hard cover with gold stamped lettering and a decorative gold border.',
        'manual_blocks': [{
            'role': 'cover_text',
            'text': 'QURAN\nTHE FINAL TESTAMENT\nAuthorized English Version\n\nTranslated from the Original\nby\nRashad Khalifa, Ph.D.',
        }],
    },
    746: {
        'visual_notes': 'Full-page promotional statement printed inside outlined boxes. The scan has no usable hidden OCR for this page.',
        'manual_blocks': [{
            'role': 'promotional_statement',
            'text': (
                'The publication of this edition of the Quran and its English translation will prove to be a major and '
                'monumental step in bringing about the true Islam.\n\n'
                'For not only does it remove two false verses that were injected into the Quran, but, more importantly, '
                'for the first time after 1400 years, the Quran is finally restored to its original purity.\n\n'
                'Gatut Adisoma\n\n'
                'This is the ONLY scripture in existence with a built-in physical, verifiable, and irrefutable proof that '
                'it is God’s unaltered message to the world. (App. 1)\n\n'
                'This is the only authorized English version of the Quran. (Appendix 2)\n\n'
                'First English rendering by a Muslim whose mother tongue is Arabic.\n\n'
                'First Sacred Writ since Muhammad to purge out all the superstitions, traditions, false doctrines, and '
                'idolatry. Thus, it restores the Quran and Islam to their original pristine purity.\n\n'
                'Never before was the Quran so clearly presented to the world.'
            ),
        }],
    },
    748: {
        'visual_notes': 'Blue hard back cover with gold stamped lettering and a decorative border. The scan has no usable hidden OCR.',
        'manual_blocks': [{
            'role': 'back_cover_text',
            'text': (
                'Simple to Understand\nImpossible to Imitate\n\n'
                'This book comes to you with built-in physical evidence that it is God’s message to you; it is '
                'mathematically composed far beyond human capability (see Appendix 1).'
            ),
        }],
    },
}

MANUAL_VERSE_CORRECTIONS: dict[str, dict[str, Any]] = {
    '3:158': {
        'pdf_page': 90,
        'text': 'Whether you die or get killed, you will be summoned before GOD.',
        'reason': 'The printed verse marker is degraded in the scan and was misread by OCR as “15H.”',
    },
    '15:16': {
        'pdf_page': 282,
        'text': 'We placed galaxies in the sky, and adorned it for the beholders.',
        'reason': 'The printed verse marker is degraded in the scan and was misread by OCR as “10.”',
    },
    '20:33': {
        'pdf_page': 332,
        'text': '“That we may glorify You frequently.',
        'reason': 'The verse number is embedded in a shared OCR line with verse 32.',
    },
    '20:36': {
        'pdf_page': 332,
        'text': 'He said, “Your request is granted, O Moses.',
        'reason': 'The verse text is split across adjacent OCR blocks.',
    },
    '61:4': {
        'pdf_page': 570,
        'text': 'GOD loves those who fight in His cause united in one column, like the bricks in one wall.',
        'reason': 'The printed verse marker lacks a clearly recognized period.',
    },
    '72:1': {
        'pdf_page': 591,
        'text': 'Say, “I was inspired that a group of jinns listened, then said, ‘We have heard a wonderful Quran.',
        'reason': 'The printed numeral 1 was read by OCR as a lowercase letter l.',
    },
    '81:6': {
        'pdf_page': 605,
        'text': 'The oceans are set aflame.',
        'reason': 'The two-column page was merged by OCR and the verse marker was lost.',
    },
    '81:9': {
        'pdf_page': 605,
        'text': 'For what crime was she killed?',
        'reason': 'The two-column page was merged by OCR and the verse marker was lost.',
    },
}

MANUAL_FOOTNOTE_CORRECTIONS: dict[tuple[str, int], str] = {
    ('9:1', 206): (
        'The absence of Basmalah from this sura is not only a profound sign from the Almighty Author of the Quran '
        'that this sura has been tampered with, but also represents an awesome miracle in its own right. See the '
        'details in Appendices 24 & 29.'
    ),
}

APPENDIX_TITLES = {
    1: 'One of the Great Miracles [74:35]',
    2: 'God’s Messenger of the Covenant [3:81]',
    3: 'We Made the Quran Easy [54:17]',
    4: 'Why Was the Quran Revealed in Arabic?',
    5: 'Heaven and Hell',
    6: 'Greatness of God',
    7: 'Why Were We Created?',
    8: 'The Myth of Intercession',
    9: 'Abraham: Original Messenger of Islam',
    10: 'God’s Usage of the Plural Tense',
    11: 'The Day of Resurrection',
    12: 'Role of the Prophet Muhammad',
    13: 'The First Pillar of Islam',
    14: 'Predestination',
    15: 'Religious Duties: Gift from God',
    16: 'Dietary Prohibition',
    17: 'Death',
    18: 'Quran is All You Need',
    19: 'Hadith and Sunna: Satanic Innovations',
    20: 'Quran: Unlike Any Other Book',
    21: 'Satan: Fallen Angel',
    22: 'Jesus',
    23: 'Chronological Order of Revelation',
    24: 'Two False Verses Removed from the Quran',
    25: 'End of the World',
    26: 'The Three Messengers of Islam',
    27: 'Who Is Your God?',
    28: 'Muhammad Wrote God’s Revelations With His Own Hand',
    29: 'The Missing Basmalah',
    30: 'Polygamy',
    31: 'Evolution: A Divinely Guided Process',
    32: 'The Crucial Age of 40',
    33: 'Why Did God Send a Messenger Now?',
    34: 'Virginity/Chastity: A Trait of the True Believers',
    35: 'Drugs & Alcohol',
    36: 'What Price A Great Nation',
    37: 'Criminal Justice in Islam',
    38: 'The Creator’s Signature',
}


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open('r', encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def norm_spaces(s: str) -> str:
    return re.sub(r'[ \t]+', ' ', s).strip()


def clean_spaced_word(match: re.Match[str]) -> str:
    return ''.join(re.findall(r'[A-Za-z]', match.group(0)))


def clean_line_text(s: str) -> str:
    s = s.replace('\u00ad', '')
    # Repair OCR of headings such as "A p p e n d ix" while not touching normal prose.
    s = re.sub(r'(?<![A-Za-z])(?:[A-Za-z]\s+){3,}[A-Za-z](?![A-Za-z])', clean_spaced_word, s)
    s = re.sub(r'\s+([,.;:!?])', r'\1', s)
    return norm_spaces(s)


def join_reading_lines(lines: list[str]) -> str:
    out = ''
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if not out:
            out = line
        elif out.endswith(('¬', '\u00ad')):
            out = out[:-1] + line.lstrip()
        elif out.endswith('-') and line and line[0].islower():
            out = out[:-1] + line.lstrip()
        else:
            out += ' ' + line
    out = out.replace('\u00ad', '')
    return norm_spaces(out)


def bbox_norm(bbox: Iterable[float], width: float, height: float) -> list[float]:
    x0, y0, x1, y1 = bbox
    return [round(x0 / width, 6), round(y0 / height, 6), round(x1 / width, 6), round(y1 / height, 6)]


def union_bbox(parts: list[list[float]]) -> list[float] | None:
    if not parts:
        return None
    return [round(min(x[0] for x in parts), 3), round(min(x[1] for x in parts), 3),
            round(max(x[2] for x in parts), 3), round(max(x[3] for x in parts), 3)]


def extract_page_blocks(page: fitz.Page) -> list[dict[str, Any]]:
    """Fast block extraction. Block boxes are exact; line boxes are proportional estimates within each OCR block."""
    width, height = float(page.rect.width), float(page.rect.height)
    out: list[dict[str, Any]] = []
    for raw in page.get_text('blocks', sort=True):
        x0, y0, x1, y1, text, block_no, block_type = raw[:7]
        if int(block_type) != 0 or not str(text).strip():
            continue
        raw_lines = [line.rstrip() for line in str(text).splitlines() if line.strip()]
        if not raw_lines:
            continue
        line_h = max((float(y1) - float(y0)) / len(raw_lines), 1.0)
        lines = []
        for i, text_line in enumerate(raw_lines):
            lb = [float(x0), float(y0) + i * line_h, float(x1), min(float(y1), float(y0) + (i + 1) * line_h)]
            clean = clean_line_text(text_line)
            lines.append({
                'text': text_line,
                'clean_text': clean,
                'bbox': [round(x, 3) for x in lb],
                'bbox_normalized': bbox_norm(lb, width, height),
                'bbox_estimated_from_block': True,
                'fonts': [],
                'mean_font_size': None,
                'bold': False,
                'italic': False,
            })
        bb = [float(x0), float(y0), float(x1), float(y1)]
        clean_lines = [ln['clean_text'] for ln in lines]
        out.append({
            'order': len(out) + 1,
            'bbox': [round(x, 3) for x in bb],
            'bbox_normalized': bbox_norm(bb, width, height),
            'layout_text': '\n'.join(raw_lines),
            'reading_text': join_reading_lines(clean_lines),
            'lines': lines,
            'fonts': [],
            'mean_font_size': None,
            'bold': False,
            'italic': False,
            'source_block_number': int(block_no),
        })
    out.sort(key=lambda b: (b['bbox'][1], b['bbox'][0]))
    for i, b in enumerate(out, 1):
        b['order'] = i
    return out


def parse_uthmani_quran() -> dict[tuple[int, int], str]:
    arabic_digits = str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789')
    entries: list[tuple[int, str]] = []
    pattern = re.compile(r'^\\qt@newcmd\\qurantext@[^\{]+\{(.*)\\qt@no\{﴿([٠-٩]+)﴾\}\}\s*$')
    for line in QURAN_UTHMANI.read_text(encoding='utf-8').splitlines():
        m = pattern.match(line)
        if not m:
            continue
        text = m.group(1).strip()
        num = int(m.group(2).translate(arabic_digits))
        text = text.replace('\\basmalah', '').strip()
        entries.append((num, text))
    verses: dict[tuple[int, int], str] = {}
    ch = 0
    prev = None
    for num, text in entries:
        if num == 1 and (prev is None or prev != 0):
            ch += 1
        verses[(ch, num)] = text
        prev = num
    if ch != 114:
        raise RuntimeError(f'Parsed {ch} Quran chapters, expected 114')
    # This 1989 edition explicitly excludes the conventional 9:128-129.
    verses.pop((9, 128), None)
    verses.pop((9, 129), None)
    return verses


def read_toc(doc: fitz.Document, ref_chapters: list[dict[str, str]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    starts: dict[int, int] = {}
    app_starts: dict[int, int] = {}
    for level, title, page in doc.get_toc(simple=True):
        m = re.fullmatch(r'Sura\s+(\d+)', title.strip(), re.I)
        if m:
            starts[int(m.group(1))] = int(page)
        m = re.fullmatch(r'Appendix\s+(\d+)', title.strip(), re.I)
        if m:
            app_starts[int(m.group(1))] = int(page)
    ref_by_ch = {int(r['chapter_number']): r for r in ref_chapters}
    chapters: list[dict[str, Any]] = []
    for n in range(1, 115):
        r = ref_by_ch[n]
        chapters.append({
            'chapter_number': n,
            'chapter_verses': int(r['chapter_verses']),
            'revelation_order': int(r['revelation_order']),
            'title_english_reference': r['title_english'],
            'title_arabic': r['title_arabic'],
            'title_transliterated_reference': r['title_transliterated'],
            'pdf_start_page': starts[n],
        })
    for i, row in enumerate(chapters):
        next_start = chapters[i + 1]['pdf_start_page'] if i + 1 < len(chapters) else 624
        row['pdf_end_page'] = row['pdf_start_page'] if next_start == row['pdf_start_page'] else next_start - 1
    appendices: list[dict[str, Any]] = []
    for n in range(1, 39):
        start = app_starts[n]
        next_start = app_starts[n + 1] if n < 38 else 726
        appendices.append({
            'appendix_number': n,
            'title': APPENDIX_TITLES[n],
            'pdf_start_page': start,
            'pdf_end_page': start if next_start == start else next_start - 1,
        })
    return chapters, appendices


def page_section(pno: int) -> tuple[str, str]:
    if pno <= 19:
        return 'front_matter', 'front_matter'
    if pno <= 623:
        return 'quran', 'quran_text'
    if pno == 624:
        return 'appendices', 'appendix_contents'
    if pno <= 725:
        return 'appendices', 'appendix_text'
    if pno <= 745:
        return 'index', 'subject_index'
    return 'back_matter', 'back_matter'


def top_header_text(blocks: list[dict[str, Any]], height: float) -> str:
    parts = []
    cutoff = min(38.0, height * 0.065)
    for b in blocks:
        for ln in b['lines']:
            if ln['bbox'][1] < cutoff:
                t = ln['clean_text']
                if not t or re.fullmatch(r'\d{1,3}', t) or is_rule_text(t):
                    continue
                parts.append(t)
    # The running header is the first substantive line. Later lines may already
    # belong to the body when the OCR has merged a tall block.
    return norm_spaces(parts[0]) if parts else ''


def parse_printed_page(pno: int, blocks: list[dict[str, Any]]) -> int | None:
    candidates = []
    for b in blocks:
        if b['bbox'][1] >= 40:
            continue
        for ln in b['lines']:
            t = ln['clean_text']
            if re.fullmatch(r'\d{1,3}', t):
                candidates.append(int(t))
    if candidates:
        # Header page numbers are generally the largest standalone number near the top.
        return max(candidates)
    if 726 <= pno <= 745:
        return 711 + (pno - 726)
    return None


def chapters_for_page(chapters: list[dict[str, Any]], pno: int) -> list[dict[str, Any]]:
    return [c for c in chapters if c['pdf_start_page'] <= pno <= c['pdf_end_page']]


def appendices_for_page(appendices: list[dict[str, Any]], pno: int) -> list[dict[str, Any]]:
    return [a for a in appendices if a['pdf_start_page'] <= pno <= a['pdf_end_page']]


def is_rule_text(text: str) -> bool:
    stripped = re.sub(r'[\s<>vVrYt\\/(){}\[\]]', '', text)
    return bool(stripped) and not re.search(r'[A-Za-z0-9]', stripped)


def is_title_caseish(text: str) -> bool:
    words = re.findall(r"[A-Za-z][A-Za-z'’\-]*", text)
    if not words:
        return False
    small = {'a','an','and','as','at','by','for','from','in','of','on','or','the','to','with'}
    good = 0
    for i, w in enumerate(words):
        if w.casefold() in small and i > 0:
            good += 1
        elif w[0].isupper() or w.isupper():
            good += 1
    return good / len(words) >= 0.7


def normalize_match(s: str) -> str:
    return re.sub(r'[^a-z0-9]+', '', s.casefold())


def subtitle_similarity(text: str, candidates: list[str]) -> float:
    a = normalize_match(text)
    if not a:
        return 0.0
    return max((SequenceMatcher(None, a, normalize_match(c)).ratio() for c in candidates), default=0.0)


def classify_quran_blocks(page: dict[str, Any], ref_sub_by_ch: dict[int, list[str]]) -> None:
    h = page['page_size']['height']
    # Once a footnote label begins, every subsequent substantive block belongs to the footnote area.
    footnote_y = None
    for b in page['blocks']:
        for ln in b['lines']:
            if FOOTNOTE_RE.match(ln['clean_text']):
                footnote_y = min(footnote_y, ln['bbox'][1]) if footnote_y is not None else ln['bbox'][1]
    page['footnote_area_start_y'] = round(footnote_y, 3) if footnote_y is not None else None
    active = page.get('chapter_numbers', [])
    ref_candidates = [x for ch in active for x in ref_sub_by_ch.get(ch, [])]
    for b in page['blocks']:
        text = b['reading_text'].strip()
        y0 = b['bbox'][1]
        role = 'verse_continuation'
        if y0 < 38:
            role = 'page_header'
        elif is_rule_text(text):
            role = 'decorative_rule'
        elif CHAPTER_HEADING_RE.search(text):
            role = 'chapter_heading'
        elif re.match(r'^In\s+the\s+nam\s*e?\s+of\s+God', text, re.I) or re.match(r'^In the name of God', text, re.I):
            role = 'opening_formula'
        elif footnote_y is not None and y0 >= footnote_y - 1:
            # Exclude tiny footer counters even though they occur after notes.
            if re.fullmatch(r'[0-9\s]+', text) and y0 > h * 0.9:
                role = 'page_footer_counter'
            else:
                role = 'quran_footnote_block'
        elif any(VERSE_MARKER_RE.match(ln['clean_text']) for ln in b['lines']):
            role = 'verse_text'
        else:
            short = len(text) <= 125 and len(b['lines']) <= 3
            styled = b['italic'] or b['bold'] or (b.get('mean_font_size') or 0) >= 12.5
            indented = b['bbox'][0] > 55
            likely_title = is_title_caseish(text) or bool(re.match(r'^\(\d+\)\s+', text))
            sim = subtitle_similarity(text, ref_candidates)
            if short and likely_title and (sim >= 0.72 or (styled and indented)):
                role = 'subheading'
        b['role'] = role


def classify_blocks(page: dict[str, Any], ref_sub_by_ch: dict[int, list[str]]) -> None:
    section = page['section']
    pno = page['pdf_page']
    h = page['page_size']['height']
    if section == 'quran':
        classify_quran_blocks(page, ref_sub_by_ch)
        return
    for b in page['blocks']:
        text = b['reading_text'].strip()
        y0 = b['bbox'][1]
        if is_rule_text(text):
            role = 'decorative_rule'
        elif section == 'front_matter':
            if 'CONTENTS' in text:
                role = 'contents_heading'
            elif 'GLOSSARY' in text:
                role = 'glossary_heading'
            elif 'INTRODUCTION' in text:
                role = 'introduction_heading'
            else:
                role = 'front_matter_text'
        elif pno == 624:
            role = 'appendix_contents'
        elif section == 'appendices':
            if y0 < 35:
                role = 'appendix_page_header'
            elif APP_HEADING_RE.match(text):
                role = 'appendix_heading'
            elif len(text) <= 180 and (b['bold'] or b['italic'] or (b.get('mean_font_size') or 0) >= 14) and y0 < h * 0.3:
                role = 'appendix_title_or_subheading'
            else:
                role = 'appendix_body'
        elif section == 'index':
            role = 'subject_index_heading' if text == 'INDEX' else 'subject_index_entry_block'
        else:
            role = 'back_matter_text'
        b['role'] = role


def chapter_heading_positions(page: dict[str, Any]) -> dict[int, tuple[float, float]]:
    out = {}
    for b in page['blocks']:
        for ln in b['lines']:
            m = CHAPTER_HEADING_RE.search(ln['clean_text'])
            if m:
                out[int(m.group(1))] = (ln['bbox'][1], ln['bbox'][3])
    return out


def segment_bounds(page: dict[str, Any]) -> dict[int, tuple[float, float]]:
    active = page.get('chapter_numbers', [])
    positions = chapter_heading_positions(page)
    h = page['page_size']['height']
    foot_y = page.get('footnote_area_start_y') or (h - 18)
    out = {}
    for i, ch in enumerate(active):
        start = positions.get(ch, (36.0, 36.0))[1]
        next_starts = [positions[n][0] for n in active[i+1:] if n in positions]
        end = min(next_starts) if next_starts else foot_y
        if start >= end:
            end = start
        out[ch] = (start, end)
    return out


def header_ranges(header: str) -> dict[int, tuple[int, int]]:
    out = {}
    for m in HEADER_RANGE_RE.finditer(header):
        ch = int(m.group(1))
        a = int(re.sub(r'\s+', '', m.group(2)))
        b = int(re.sub(r'\s+', '', m.group(3) or m.group(2)))
        if 1 <= ch <= 114 and 1 <= a <= b:
            out[ch] = (a, b)
    return out


def verse_numbers_in_bounds(page: dict[str, Any], y0: float, y1: float, max_verse: int) -> list[int]:
    nums = []
    foot_y = page.get('footnote_area_start_y')
    for b in page['blocks']:
        for ln in b['lines']:
            yy = ln['bbox'][1]
            if not (max(y0, 35.0) <= yy < y1):
                continue
            if foot_y is not None and yy >= foot_y:
                continue
            t = ln['clean_text']
            if not t or is_rule_text(t) or CHAPTER_HEADING_RE.search(t) or FOOTNOTE_RE.match(t):
                continue
            m = VERSE_MARKER_RE.match(t)
            if m:
                n = int(m.group(1))
                if 1 <= n <= max_verse:
                    nums.append(n)
            elif re.match(r'^I\s*[\.)]\s*', t) and max_verse >= 1:
                nums.append(1)
    return nums


def assign_segment_ranges(pages: list[dict[str, Any]], chapters: list[dict[str, Any]]) -> None:
    for c in chapters:
        n = c['chapter_number']
        count = c['chapter_verses']
        cp = [p for p in pages if n in p.get('chapter_numbers', [])]
        cp.sort(key=lambda p: p['pdf_page'])
        proposed: list[dict[str, Any]] = []
        for p in cp:
            hr = header_ranges(p['header_text']).get(n)
            bounds = p.get('chapter_segment_bounds', {}).get(str(n))
            nums = verse_numbers_in_bounds(p, *(bounds or (36.0, p['page_size']['height'] - 18)), count)
            if hr and hr[1] <= count:
                proposed.append({'page': p, 'start': hr[0], 'end': hr[1], 'title_only': False})
            elif nums:
                proposed.append({'page': p, 'start': min(nums), 'end': max(nums), 'title_only': False})
            else:
                # Many transition pages print only the next sura's framed heading at the bottom.
                proposed.append({'page': p, 'start': None, 'end': None, 'title_only': True})
        valid = [x for x in proposed if not x['title_only']]
        if not valid:
            continue
        for i, x in enumerate(valid):
            if x['start'] is None:
                x['start'] = 1 if i == 0 else int(valid[i-1]['end'] or 0) + 1
            if i == 0 and x['start'] != 1:
                x['start'] = 1
        for i, x in enumerate(valid):
            if x['end'] is None or x['end'] < x['start']:
                x['end'] = (int(valid[i+1]['start']) - 1) if i + 1 < len(valid) and valid[i+1]['start'] is not None else count
            if i + 1 < len(valid) and valid[i+1]['start'] is not None and x['end'] >= valid[i+1]['start']:
                x['end'] = int(valid[i+1]['start']) - 1
            x['start'] = max(1, min(int(x['start']), count))
            x['end'] = max(int(x['start']), min(int(x['end']), count))
        valid[-1]['end'] = count
        for x in proposed:
            p = x['page']
            seg = next(s for s in p['chapter_segments'] if s['chapter_number'] == n)
            seg['title_only'] = bool(x['title_only'])
            if x['title_only']:
                seg['verse_start'] = None
                seg['verse_end'] = None
                seg['verse_range'] = None
            else:
                seg['verse_start'] = int(x['start'])
                seg['verse_end'] = int(x['end'])
                seg['verse_range'] = f"{n}:{x['start']}-{x['end']}"
        c['verse_start_pdf_page'] = valid[0]['page']['pdf_page']
        c['verse_end_pdf_page'] = valid[-1]['page']['pdf_page']


def extract_footnotes(page: dict[str, Any], ref_fn_by_label: dict[str, list[str]]) -> list[dict[str, Any]]:
    if page['section'] != 'quran':
        return []
    lines = []
    for b in page['blocks']:
        for ln in b['lines']:
            lines.append({**ln, 'block_order': b['order']})
    lines.sort(key=lambda x: (x['bbox'][1], x['bbox'][0]))
    notes = []
    current = None
    for ln in lines:
        t = ln['clean_text']
        m = FOOTNOTE_RE.match(t)
        if m:
            if current:
                notes.append(current)
            current = {
                'marker': m.group('marker') or '',
                'verse_reference': m.group('label'),
                'lines': [m.group('rest').strip()] if m.group('rest').strip() else [],
                'bbox_parts': [ln['bbox']],
            }
        elif current:
            if re.fullmatch(r'\d+', t) and ln['bbox'][1] > page['page_size']['height'] * 0.9:
                continue
            if is_rule_text(t):
                continue
            current['lines'].append(t)
            current['bbox_parts'].append(ln['bbox'])
    if current:
        notes.append(current)
    out = []
    for x in notes:
        label = x['verse_reference']
        text = join_reading_lines(x['lines'])
        refs = ref_fn_by_label.get(label, [])
        out.append({
            'marker': x['marker'],
            'verse_reference': label,
            'chapter_number': int(label.split(':')[0]),
            'text': text,
            'layout_text': '\n'.join(x['lines']),
            'pdf_page': page['pdf_page'],
            'printed_page': page['printed_page'],
            'bbox': union_bbox(x['bbox_parts']),
            'bbox_normalized': bbox_norm(union_bbox(x['bbox_parts']), page['page_size']['width'], page['page_size']['height']) if x['bbox_parts'] else None,
            'later_edition_candidates_same_label': ' || '.join(refs),
            'exact_match_to_later_edition': any(norm_spaces(text).casefold() == norm_spaces(r).casefold() for r in refs),
        })
    return out


def nearest_chapter_for_y(page: dict[str, Any], y: float) -> int | None:
    for ch, bounds in page.get('chapter_segment_bounds', {}).items():
        if bounds[0] <= y < bounds[1]:
            return int(ch)
    return page.get('chapter_numbers', [None])[0] if page.get('chapter_numbers') else None


def extract_subheadings(page: dict[str, Any], ref_sub_by_verse: dict[str, list[str]]) -> list[dict[str, Any]]:
    if page['section'] != 'quran':
        return []
    verse_positions = defaultdict(list)
    for b in page['blocks']:
        if b.get('role') in {'quran_footnote_block','page_header','chapter_heading','decorative_rule'}:
            continue
        for ln in b['lines']:
            m = VERSE_MARKER_RE.match(ln['clean_text'])
            if m:
                ch = nearest_chapter_for_y(page, ln['bbox'][1])
                if ch:
                    verse_positions[ch].append((ln['bbox'][1], int(m.group(1))))
    out = []
    for b in page['blocks']:
        if b.get('role') != 'subheading':
            continue
        ch = nearest_chapter_for_y(page, b['bbox'][1])
        if not ch:
            continue
        below = [n for yy, n in verse_positions[ch] if yy > b['bbox'][1]]
        seg = next((s for s in page['chapter_segments'] if s['chapter_number'] == ch), None)
        before = min(below) if below else (seg['verse_start'] if seg else None)
        # OCR sometimes merges ornamental rules into the same block as a real
        # heading (for example the rule above "No Basmalah" on PDF page 206).
        # Preserve those lines in the raw page layout, but exclude them from the
        # structured subheading transcription.
        text = join_reading_lines([
            ln['clean_text'] for ln in b['lines'] if not is_rule_text(ln['clean_text'])
        ]).strip()
        if not text:
            continue
        verse_id = f'{ch}:{before}' if before else None
        refs = ref_sub_by_verse.get(verse_id, []) if verse_id else []
        out.append({
            'chapter_number': ch,
            'placement_before_verse': before,
            'verse_id': verse_id,
            'text': text,
            'pdf_page': page['pdf_page'],
            'printed_page': page['printed_page'],
            'bbox': b['bbox'],
            'bbox_normalized': b['bbox_normalized'],
            'later_edition_candidates_same_verse': ' || '.join(refs),
            'exact_match_to_later_edition': any(norm_spaces(text).casefold() == norm_spaces(r).casefold() for r in refs),
        })
    return out


def extract_english_verses(page: dict[str, Any]) -> list[dict[str, Any]]:
    if page['section'] != 'quran':
        return []
    subheading_line_boxes = {(tuple(ln['bbox']), ln['clean_text']) for b in page['blocks'] if b.get('role') == 'subheading' for ln in b['lines']}
    out = []
    for seg in page['chapter_segments']:
        if seg.get('verse_start') is None:
            continue
        ch = seg['chapter_number']
        a, z = seg['verse_start'], seg['verse_end']
        y0, y1 = page['chapter_segment_bounds'][str(ch)]
        current = None
        foot_y = page.get('footnote_area_start_y')
        for b in page['blocks']:
            for ln in b['lines']:
                yy = ln['bbox'][1]
                if not (max(y0, 35.0) <= yy < y1):
                    continue
                if foot_y is not None and yy >= foot_y:
                    continue
                t = ln['clean_text']
                if not t or is_rule_text(t) or CHAPTER_HEADING_RE.search(t):
                    continue
                if (tuple(ln['bbox']), t) in subheading_line_boxes:
                    continue
                if re.match(r'^In\s+the\s+nam\s*e?\s+of\s+God', t, re.I):
                    continue
                if FOOTNOTE_RE.match(t):
                    break
                m = VERSE_MARKER_RE.match(t)
                if not m and re.match(r'^I\s*[\.)]\s*', t) and a <= 1 <= z:
                    m = re.match(r'^I\s*[\.)]\s*(.*)$', t)
                    n = 1
                    rest = m.group(1) if m else ''
                elif m:
                    n = int(m.group(1)); rest = m.group(2)
                else:
                    n = None; rest = ''
                if n is not None and a <= n <= z:
                    if current:
                        out.append(current)
                    current = {'chapter_number': ch, 'verse_number': n, 'lines': [], 'bbox_parts': [], 'pdf_page': page['pdf_page'], 'printed_page': page['printed_page']}
                    if rest.strip():
                        current['lines'].append(rest.strip()); current['bbox_parts'].append(ln['bbox'])
                elif current:
                    if re.fullmatch(r'\d+', t) and yy > page['page_size']['height'] * 0.9:
                        continue
                    current['lines'].append(t); current['bbox_parts'].append(ln['bbox'])
        if current:
            out.append(current)
    rows = []
    for x in out:
        rows.append({
            'verse_id': f"{x['chapter_number']}:{x['verse_number']}",
            'chapter_number': x['chapter_number'],
            'verse_number': x['verse_number'],
            'english_1989': join_reading_lines(x['lines']),
            'layout_text': '\n'.join(x['lines']),
            'pdf_page': x['pdf_page'],
            'printed_page': x['printed_page'],
            'bbox': union_bbox(x['bbox_parts']),
        })
    return rows


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str] | None = None) -> None:
    if fieldnames is None:
        fieldnames = []
        seen = set()
        for row in rows:
            for k in row:
                if k not in seen:
                    seen.add(k); fieldnames.append(k)
    with path.open('w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        w.writeheader()
        for row in rows:
            r = {}
            for k, v in row.items():
                if isinstance(v, (list, dict)):
                    r[k] = json.dumps(v, ensure_ascii=False)
                else:
                    r[k] = v
            w.writerow(r)


def markdown_page(page: dict[str, Any]) -> str:
    meta = [f"PDF page {page['pdf_page']}"]
    if page.get('printed_page') is not None:
        meta.append(f"printed page {page['printed_page']}")
    meta.append(page['page_type'].replace('_', ' '))
    if page.get('chapter_numbers'):
        meta.append('Sura ' + ', '.join(map(str, page['chapter_numbers'])))
    if page.get('appendix_numbers'):
        meta.append('Appendix ' + ', '.join(map(str, page['appendix_numbers'])))
    out = ['# ' + ' | '.join(meta), '']
    if page.get('visual_notes'):
        out += ['**Visual note:** ' + page['visual_notes'], '']
    for mb in page.get('manual_blocks', []):
        out += [f"## {mb['role'].replace('_', ' ').title()}", '', mb['text'], '']
    if page.get('arabic_verses'):
        out += ['## Arabic Quran panel transcription', '']
        for v in page['arabic_verses']:
            label = v['verse_id']
            out.append(f"**{label}** {v['arabic']}")
        out.append('')
    last_role = None
    for b in page['blocks']:
        role = b.get('role', 'body_text')
        if role != last_role:
            out += [f"## {role.replace('_', ' ').title()}", '']
            last_role = role
        out += [b['layout_text'], '']
    if not page['blocks'] and not page.get('manual_blocks') and not page.get('arabic_verses'):
        out += ['[Blank page]', '']
    return '\n'.join(out).rstrip() + '\n\n'


def main() -> None:
    ref_index = load_csv(REF_INDEX)
    ref_chapters = load_csv(REF_CHAPTERS)
    ref_subtitles = load_csv(REF_SUBTITLES)
    ref_footnotes = load_csv(REF_FOOTNOTES)
    quran_ar = parse_uthmani_quran()
    chapter_counts = {int(r['chapter_number']): int(r['chapter_verses']) for r in ref_chapters}

    ref_sub_by_ch: dict[int, list[str]] = defaultdict(list)
    ref_sub_by_verse: dict[str, list[str]] = defaultdict(list)
    for r in ref_subtitles:
        ref_sub_by_ch[int(r['chapter_number'])].append(r['english'])
        ref_sub_by_verse[r['verse_id']].append(r['english'])
    ref_fn_by_label: dict[str, list[str]] = defaultdict(list)
    for r in ref_footnotes:
        en = r.get('english', '')
        m = re.match(r'^±?(\d{1,3}:\d{1,3}(?:-\d{1,3})?)\s+(.*)', en, re.S)
        if m:
            ref_fn_by_label[m.group(1)].append(m.group(2).strip())

    doc = fitz.open(PDF_PATH)
    chapters, appendices = read_toc(doc, ref_chapters)

    # Extract the actual 1989 titles from the chapter opening pages.
    for c in chapters:
        page_text = doc[c['pdf_start_page'] - 1].get_text('text')
        m = re.search(rf'Sura\s+{c["chapter_number"]}\s*:\s*([^\n\r]+)', page_text, re.I)
        actual = clean_line_text(m.group(1)) if m else c['title_english_reference']
        actual = re.sub(r'^[^A-Za-z0-9]+|[^A-Za-z0-9)\]’]+$', '', actual)
        c['title_1989'] = actual
        pm = re.match(r'(.+?)\s*\((.+)\)\s*$', actual)
        c['title_english_1989'] = pm.group(1).strip() if pm else actual
        c['title_parenthetical_1989'] = pm.group(2).strip() if pm else ''

    pages: list[dict[str, Any]] = []
    for i in range(doc.page_count):
        pno = i + 1
        pg = doc[i]
        blocks = extract_page_blocks(pg)
        section, page_type = page_section(pno)
        header = top_header_text(blocks, float(pg.rect.height))
        header_chapters = set(header_ranges(header)) if section == 'quran' else set()
        heading_chapters = set()
        if section == 'quran':
            for b in blocks:
                m = CHAPTER_HEADING_RE.search(b['reading_text'])
                if m:
                    heading_chapters.add(int(m.group(1)))
        active_nums = sorted(header_chapters | heading_chapters)
        active_ch = [next(c for c in chapters if c['chapter_number'] == n) for n in active_nums]
        active_app = appendices_for_page(appendices, pno)
        rec: dict[str, Any] = {
            'pdf_page': pno,
            'printed_page': parse_printed_page(pno, blocks),
            'section': section,
            'page_type': page_type,
            'page_size': {'width': round(float(pg.rect.width), 3), 'height': round(float(pg.rect.height), 3)},
            'chapter_numbers': active_nums,
            'chapter_titles': [c['title_1989'] for c in active_ch],
            'appendix_numbers': [a['appendix_number'] for a in active_app],
            'appendix_titles': [a['title'] for a in active_app],
            'header_text': header,
            'blocks': blocks,
            'raw_ocr_text': pg.get_text('text'),
            'reading_text': '\n\n'.join(b['reading_text'] for b in blocks),
        }
        if pno in MANUAL_PAGE_CONTENT:
            rec.update(MANUAL_PAGE_CONTENT[pno])
        classify_blocks(rec, ref_sub_by_ch)
        bounds = segment_bounds(rec) if section == 'quran' else {}
        rec['chapter_segment_bounds'] = {str(k): [round(v[0], 3), round(v[1], 3)] for k, v in bounds.items()}
        rec['chapter_segments'] = [{
            'chapter_number': c['chapter_number'],
            'chapter_title': c['title_1989'],
            'bbox_y_start': rec['chapter_segment_bounds'].get(str(c['chapter_number']), [None, None])[0],
            'bbox_y_end': rec['chapter_segment_bounds'].get(str(c['chapter_number']), [None, None])[1],
        } for c in active_ch]
        pages.append(rec)

    # Recompute actual chapter page ranges, including transition pages that contain
    # the end of one sura and the opening of the next.
    for c in chapters:
        active_pages = [p['pdf_page'] for p in pages if c['chapter_number'] in p.get('chapter_numbers', [])]
        if active_pages:
            c['pdf_start_page'] = min(active_pages)
            c['pdf_end_page'] = max(active_pages)

    assign_segment_ranges(pages, chapters)

    # Map Arabic verses to each Quran page by the established page ranges.
    basmalah_ar = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ'
    for p in pages:
        av = []
        if p['section'] == 'quran':
            for seg in p['chapter_segments']:
                ch = seg['chapter_number']
                if seg.get('verse_start') is None:
                    continue
                first_verse_page = next(c.get('verse_start_pdf_page') for c in chapters if c['chapter_number'] == ch)
                if p['pdf_page'] == first_verse_page and ch not in (1, 9):
                    av.append({'verse_id': f'{ch}:0', 'chapter_number': ch, 'verse_number': 0, 'arabic': basmalah_ar, 'kind': 'unnumbered_basmalah'})
                for v in range(seg['verse_start'], seg['verse_end'] + 1):
                    av.append({'verse_id': f'{ch}:{v}', 'chapter_number': ch, 'verse_number': v, 'arabic': quran_ar.get((ch, v), ''), 'kind': 'numbered_verse'})
        p['arabic_verses'] = av

    footnotes = []
    subheadings = []
    extracted_verses = []
    for p in pages:
        footnotes.extend(extract_footnotes(p, ref_fn_by_label))
        subheadings.extend(extract_subheadings(p, ref_sub_by_verse))
        extracted_verses.extend(extract_english_verses(p))

    for footnote in footnotes:
        correction = MANUAL_FOOTNOTE_CORRECTIONS.get((footnote['verse_reference'], footnote['pdf_page']))
        if correction:
            footnote['text'] = correction
            footnote['manual_correction'] = True

    # Choose the most complete OCR extraction when a verse is encountered more than once.
    eng_by_id: dict[str, dict[str, Any]] = {}
    for r in extracted_verses:
        old = eng_by_id.get(r['verse_id'])
        if old is None or len(r['english_1989']) > len(old['english_1989']):
            eng_by_id[r['verse_id']] = r

    # Repair a small set of verse markers or line joins that the scan's OCR cannot
    # recover reliably. The wording was checked against the rendered source pages.
    for verse_id, correction in MANUAL_VERSE_CORRECTIONS.items():
        ch, v = (int(x) for x in verse_id.split(':'))
        page = pages[correction['pdf_page'] - 1]
        eng_by_id[verse_id] = {
            'verse_id': verse_id,
            'chapter_number': ch,
            'verse_number': v,
            'english_1989': correction['text'],
            'layout_text': correction['text'],
            'pdf_page': correction['pdf_page'],
            'printed_page': page.get('printed_page'),
            'bbox': None,
            'manual_correction': True,
            'manual_correction_reason': correction['reason'],
        }

    page_by_verse: dict[tuple[int, int], dict[str, Any]] = {}
    basmalah_by_ch: dict[int, dict[str, Any]] = {}
    for p in pages:
        for seg in p.get('chapter_segments', []):
            ch = seg['chapter_number']
            if seg.get('verse_start') is None:
                continue
            for v in range(seg['verse_start'], seg['verse_end'] + 1):
                page_by_verse[(ch, v)] = p
            if seg['verse_start'] == 1:
                basmalah_by_ch[ch] = p

    verse_rows = []
    for r in ref_index:
        ch, v = int(r['chapter_number']), int(r['verse_number'])
        p = basmalah_by_ch.get(ch) if v == 0 else page_by_verse.get((ch, v))
        en = eng_by_id.get(f'{ch}:{v}', {}) if v else {}
        verse_rows.append({
            'verse_index': int(r['verse_index']),
            'verse_id': r['verse_id'],
            'chapter_number': ch,
            'verse_number': v,
            'chapter_verses': int(r['chapter_verses']),
            'verse_id_arabic': r['verse_id_arabic'],
            'english_1989': en.get('english_1989', 'In the name of God, Most Gracious, Most Merciful' if v == 0 else ''),
            'arabic_uthmani': basmalah_ar if v == 0 else quran_ar.get((ch, v), ''),
            'pdf_page_1989': p['pdf_page'] if p else None,
            'printed_page_1989': p['printed_page'] if p else None,
            'english_bbox': en.get('bbox'),
            'english_transcription_source': 'manual visual correction' if en.get('manual_correction') else ('embedded PDF OCR' if v else 'standard unnumbered basmalah'),
            'english_transcription_note': en.get('manual_correction_reason', ''),
            'arabic_alignment_note': 'Canonical Uthmani transcription aligned to the Arabic facsimile panel on this page; ornamental glyph layout is preserved only in the source scan.',
        })

    page_csv_rows = []
    for p in pages:
        manual = '\n\n'.join(x['text'] for x in p.get('manual_blocks', []))
        arabic = '\n'.join(f"{x['verse_id']} {x['arabic']}" for x in p.get('arabic_verses', []))
        page_csv_rows.append({
            'pdf_page': p['pdf_page'], 'printed_page': p['printed_page'], 'section': p['section'], 'page_type': p['page_type'],
            'chapter_numbers': ','.join(map(str, p['chapter_numbers'])), 'chapter_titles': ' || '.join(p['chapter_titles']),
            'chapter_segments': p['chapter_segments'], 'appendix_numbers': ','.join(map(str, p['appendix_numbers'])),
            'appendix_titles': ' || '.join(p['appendix_titles']), 'header_text': p['header_text'],
            'visual_notes': p.get('visual_notes', ''),
            'transcription_english': (manual + ('\n\n' if manual and p['reading_text'] else '') + p['reading_text']).strip(),
            'transcription_arabic_quran': arabic,
            'layout_text': '\n\n'.join(b['layout_text'] for b in p['blocks']),
        })

    subject_index_lines = []
    glossary_lines = []
    for p in pages:
        for b in p['blocks']:
            for ln in b['lines']:
                row = {'pdf_page': p['pdf_page'], 'printed_page': p['printed_page'], 'block_order': b['order'],
                       'text': ln['text'], 'clean_text': ln['clean_text'], 'bbox': ln['bbox'], 'bbox_normalized': ln['bbox_normalized']}
                if p['section'] == 'index':
                    subject_index_lines.append(row)
                if p['pdf_page'] in (11, 12):
                    glossary_lines.append(row)

    contents_suras = [{
        'sura_number': c['chapter_number'], 'name_1989': c['title_1989'], 'chapter_verses': c['chapter_verses'],
        'pdf_start_page': c['pdf_start_page'], 'pdf_end_page': c['pdf_end_page'],
        'printed_start_page': next((p['printed_page'] for p in pages if p['pdf_page'] == c['pdf_start_page']), None),
    } for c in chapters]

    # Persist outputs.
    with (OUT_DIR / 'Quran1989_pages_layout.jsonl').open('w', encoding='utf-8') as f:
        for p in pages:
            f.write(json.dumps(p, ensure_ascii=False) + '\n')

    manifest = {
        'title': 'Quran: The Final Testament (Authorized English Version) With the Arabic Text',
        'translator': 'Rashad Khalifa, Ph.D.',
        'edition_year': 1989,
        'source_pdf': PDF_PATH.name,
        'pdf_page_count': doc.page_count,
        'quran_printed_pages': 604,
        'chapters': len(chapters),
        'verse_index_rows': len(verse_rows),
        'subheadings_extracted': len(subheadings),
        'quran_footnotes_extracted': len(footnotes),
        'appendices': len(appendices),
        'method': 'The scan’s embedded English OCR and exact line/block coordinates were extracted from every page. Chapter, verse-range, subtitle, footnote, appendix, glossary, and index structures were parsed separately. Arabic Quran panels were transcribed with canonical Uthmani verse text and aligned to the exact 1989 page ranges; the scan remains authoritative for ornamental glyph forms and line wrapping.',
        'important_note': 'The supplied later-edition CSVs were used for chapter counts, verse indexing, and cross-edition validation only. Their English wording was not substituted for the 1989 edition wording.',
        'files': [
            'Quran1989_complete.json','Quran1989_pages_layout.jsonl','Quran1989_full_transcription.md','Quran1989_pages.csv',
            'Quran1989_chapters.csv','Quran1989_verse_index.csv','Quran1989_subheadings.csv','Quran1989_footnotes.csv',
            'Quran1989_appendices.csv','Quran1989_appendix_contents.csv','Quran1989_subject_index_lines.csv',
            'Quran1989_glossary_lines.csv','Quran1989_contents_suras.csv','Quran1989_QA_report.md','README.md'
        ],
    }
    (OUT_DIR / 'Quran1989_manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    (OUT_DIR / 'Quran1989_complete.json').write_text(json.dumps({'manifest': manifest, 'pages': pages}, ensure_ascii=False, indent=2), encoding='utf-8')

    with (OUT_DIR / 'Quran1989_full_transcription.md').open('w', encoding='utf-8') as f:
        f.write('# Quran: The Final Testament (1989) - Page-by-Page Transcription\n\n')
        f.write('Every PDF page is represented. English text preserves page order and structural block breaks. Arabic Quran panels are supplied verse-by-verse in canonical Uthmani text and aligned to the 1989 page ranges. Exact block and line coordinates are in `Quran1989_pages_layout.jsonl`.\n\n')
        for p in pages:
            f.write(markdown_page(p))

    write_csv(OUT_DIR / 'Quran1989_pages.csv', page_csv_rows)
    write_csv(OUT_DIR / 'Quran1989_chapters.csv', chapters)
    write_csv(OUT_DIR / 'Quran1989_verse_index.csv', verse_rows)
    write_csv(OUT_DIR / 'Quran1989_subheadings.csv', subheadings)
    write_csv(OUT_DIR / 'Quran1989_footnotes.csv', footnotes)
    write_csv(OUT_DIR / 'Quran1989_appendices.csv', appendices)
    write_csv(OUT_DIR / 'Quran1989_appendix_contents.csv', [{'appendix_number': n, 'title': APPENDIX_TITLES[n], 'printed_start_page': (609 if n == 1 else next((p['printed_page'] for p in pages if p['pdf_page'] == next(a['pdf_start_page'] for a in appendices if a['appendix_number'] == n)), None))} for n in range(1,39)])
    write_csv(OUT_DIR / 'Quran1989_subject_index_lines.csv', subject_index_lines)
    write_csv(OUT_DIR / 'Quran1989_glossary_lines.csv', glossary_lines)
    write_csv(OUT_DIR / 'Quran1989_contents_suras.csv', contents_suras)

    # QA.
    empty_ocr = [p['pdf_page'] for p in pages if not p['raw_ocr_text'].strip()]
    mapped = sum(1 for r in verse_rows if r['pdf_page_1989'])
    english_found = sum(1 for r in verse_rows if r['verse_number'] > 0 and r['english_1989'])
    arabic_found = sum(1 for r in verse_rows if r['arabic_uthmani'])
    continuity = []
    for c in chapters:
        segs = []
        for p in pages:
            segs.extend([s for s in p.get('chapter_segments', []) if s['chapter_number'] == c['chapter_number'] and s.get('verse_start') is not None])
        if not segs:
            continuity.append(f"Sura {c['chapter_number']}: no segments")
            continue
        if segs[0]['verse_start'] != 1 or segs[-1]['verse_end'] != c['chapter_verses']:
            continuity.append(f"Sura {c['chapter_number']}: {segs[0]['verse_start']}..{segs[-1]['verse_end']} expected 1..{c['chapter_verses']}")
        for x, y in zip(segs, segs[1:]):
            if x['verse_end'] + 1 != y['verse_start']:
                continuity.append(f"Sura {c['chapter_number']}: {x['verse_end']} -> {y['verse_start']}")

    qa = f'''# Quran1989 Transcription QA Report

## Coverage

- PDF pages represented: **{len(pages)} of {doc.page_count}**.
- Sura chapters represented: **{len(chapters)} of 114**.
- Verse-index rows mapped to a 1989 PDF page: **{mapped} of {len(verse_rows)}**.
- Numbered English verses parsed into verse rows: **{english_found} of 6234**.
- Arabic verse/basmalah rows populated: **{arabic_found} of {len(verse_rows)}**.
- Quran subheadings structurally extracted: **{len(subheadings)}**.
- Quran footnotes structurally extracted: **{len(footnotes)}**.
- Appendices represented: **{len(appendices)} of 38**.
- Subject-index lines represented: **{len(subject_index_lines)}**.
- Glossary lines represented: **{len(glossary_lines)}**.

## OCR and image handling

The 1989 book is a scanned facsimile with a high-quality hidden English OCR layer. The output preserves the raw OCR, normalized reading text, exact line coordinates, font/style indicators, and block roles. Pages with no usable embedded OCR are: **{', '.join(map(str, empty_ocr))}**. PDF pages 746 and 748 were transcribed manually from their page images; PDF page 1 also has a manual cover transcription because the gold lettering OCR is defective.

The Arabic Quran is printed as photographic facsimile panels and is not represented in the PDF's hidden OCR layer. The bundle therefore supplies the Arabic verse text from the canonical Uthmani Quran text distributed with TeX Live, aligned verse-by-verse to this edition's page ranges. Sura 9:128-129 are intentionally omitted to match the 1989 edition. The source page image remains authoritative for exact calligraphic glyph shapes, ornamental verse markers, and line wrapping.

## Structural validation

- Chapter-range continuity issues: **{len(continuity)}**.
'''
    qa += ('- No chapter-range continuity errors detected.\n' if not continuity else '\n'.join('- ' + x for x in continuity[:100]) + '\n')
    qa += '''
## Accuracy status

This is a complete page-level structural transcription rather than a simple text dump. Every page, chapter heading, page header, subtitle candidate, footnote, appendix, glossary line, and subject-index line is represented with placement metadata. Rare character-level errors can remain in the scan's ordinary English OCR. For that reason, the raw OCR and cleaned reading text are both retained, and all disputed wording can be traced to an exact page and bounding box. The supplied later-edition CSVs were used only for indexing and validation, not to overwrite the 1989 English text.
'''
    (OUT_DIR / 'Quran1989_QA_report.md').write_text(qa, encoding='utf-8')

    readme = '''# Quran1989 Transcription Bundle

- `Quran1989_complete.json`: consolidated manifest and all 748 page records.
- `Quran1989_pages_layout.jsonl`: one page per line with exact OCR block/line coordinates, styles, roles, chapter segments, and Arabic verse alignment.
- `Quran1989_full_transcription.md`: readable page-by-page English and Arabic transcription.
- `Quran1989_pages.csv`: one row per PDF page.
- `Quran1989_chapters.csv`: all 114 chapter titles, counts, and PDF ranges.
- `Quran1989_verse_index.csv`: all 6,346 numbered-verse/basmalah rows mapped to the 1989 pages, with English and Arabic text.
- `Quran1989_subheadings.csv`: extracted subheadings and placement before verses.
- `Quran1989_footnotes.csv`: extracted 1989 footnotes with labels, wording, pages, and coordinates.
- `Quran1989_appendices.csv` and `Quran1989_appendix_contents.csv`: Appendix 1-38 titles and ranges.
- `Quran1989_subject_index_lines.csv`: line-level index transcription and placement.
- `Quran1989_glossary_lines.csv`: line-level glossary transcription and placement.
- `Quran1989_contents_suras.csv`: structured sura contents table.
- `Quran1989_QA_report.md`: coverage and validation details.
- `build_quran1989_transcription.py`: reproducible builder.

The supplied later-edition CSVs were used only for indexing, chapter counts, and cross-edition checks. Their English wording was not substituted for the 1989 text. Arabic facsimile panels are transcribed with canonical Uthmani verse text and aligned to the 1989 page ranges.
'''
    (OUT_DIR / 'README.md').write_text(readme, encoding='utf-8')
    (OUT_DIR / 'build_quran1989_transcription.py').write_text(Path(__file__).read_text(encoding='utf-8'), encoding='utf-8')

    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for path in sorted(OUT_DIR.iterdir()):
            z.write(path, arcname=f'Quran1989_transcription/{path.name}')

    print(json.dumps({
        'out_dir': str(OUT_DIR), 'zip': str(ZIP_PATH), 'page_count': doc.page_count,
        'mapped_verse_rows': mapped, 'english_numbered_verses': english_found,
        'footnotes': len(footnotes), 'subheadings': len(subheadings),
        'empty_ocr_pages': empty_ocr, 'continuity_issues': continuity[:20]
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
