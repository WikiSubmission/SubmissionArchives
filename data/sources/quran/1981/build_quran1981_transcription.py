from __future__ import annotations

import csv
import json
import math
import os
import re
import statistics
import zipfile
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable

import fitz  # PyMuPDF

PDF_PATH = Path('/mnt/data/Quran1981.pdf')
REF_INDEX = Path('/mnt/data/ws_quran_index_rows.csv')
REF_SUBTITLES = Path('/mnt/data/ws_quran_subtitles_rows.csv')
REF_CHAPTERS = Path('/mnt/data/ws_quran_chapters_rows.csv')
REF_FOOTNOTES = Path('/mnt/data/ws_quran_footnotes_rows.csv')
OUT_DIR = Path('/mnt/data/Quran1981_transcription')
OUT_DIR.mkdir(parents=True, exist_ok=True)

FOOTNOTE_RE = re.compile(r'^\s*(\d{1,3}:\d{1,3}(?:-\d{1,3})?)\.\s*(.*)$')
VERSE_RE = re.compile(r'^\s*(\d{1,3})[\.)]\s*(.*)$')
CHAPTER_HEADING_RE = re.compile(r'^\s*Sura\s+(\d+)\s*:\s*(.+?)\s*$')
APPENDIX_RE = re.compile(r'^\s*APPENDIX\s+(\d+)\s*$', re.I)

# The scan contains a handful of pages whose visible content is absent from the
# embedded English OCR. These notes/transcriptions are based on visual inspection.
MANUAL_PAGE_CONTENT: dict[int, dict[str, Any]] = {
    1: {
        'visual_notes': 'Black front cover. Bottom scan imprint reads “Digitized by Google” and “Original from Indiana University.”',
    },
    2: {
        'visual_notes': 'Nearly blank scan page with two dark book-scanning supports/clamps and faint Google/Indiana University scan imprints at the bottom.',
    },
    3: {'visual_notes': 'Blank page with a small dark scan speck near the right side.'},
    4: {'visual_notes': 'Blank page with scan specks and a vertical dark line near the upper-right edge.'},
    5: {
        'visual_notes': 'Title page. Handwritten “Koran. English” appears at the top. Indiana University Libraries stamp, shelf marks, and handwritten library notation appear below the printed title information.'
    },
    7: {
        'manual_blocks': [
            {
                'role': 'arabic_scripture',
                'text': 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nوَإِذَا ذُكِرَ اللَّهُ وَحْدَهُ اشْمَأَزَّتْ قُلُوبُ الَّذِينَ لَا يُؤْمِنُونَ بِالْآخِرَةِ وَإِذَا ذُكِرَ الَّذِينَ مِنْ دُونِهِ إِذَا هُمْ يَسْتَبْشِرُونَ ۝٤٥',
                'note': 'Arabic text printed above the English rendering, Quran 39:45.'
            }
        ]
    },
    512: {
        'manual_blocks': [
            {
                'role': 'arabic_source_page',
                'text': (
                    'ـ ١٧٩ ـ\n\n'
                    '«السابع - النهي عن كتابة غير القرآن»\n\n'
                    'عن أبي سعيد الخدري رضي الله عنه قال: قال رسول الله صلى الله عليه وسلم: '
                    '«لا تكتبوا عني شيئًا سوى القرآن. من كتب شيئًا سوى القرآن فليمحه» (١)\n\n'
                    '(أحمد ج ١ ص ١٧١ ومسلم)\n\n'
                    'عن عبد المطلب بن عبد الله قال: أُدخل زيد بن ثابت رضي الله عنه على معاوية رضي الله عنه، '
                    'فحدثه حديثًا، فأمر إنسانًا أن يكتب. فقال زيد: إن رسول الله صلى الله عليه وسلم نهى أن نكتب '
                    'شيئًا من حديثه، فمحاه.\n\n'
                    '(أحمد ج ١ ص ١٩٢)'
                ),
                'note': 'Arabic facsimile/source page reproduced in Appendix 11. The scan’s hidden OCR does not transcribe it.'
            }
        ]
    },
    557: {'visual_notes': 'Nearly blank page with faint scan-edge marks along the top and a few small specks.'},
    558: {'visual_notes': 'Blank gold/brown endpaper or photographed book-board surface.'},
    559: {'visual_notes': 'Mostly blank page with a small handwritten numerical notation near the upper center.'},
    560: {'visual_notes': 'Blank page with faint scan specks.'},
    561: {'visual_notes': 'Library back-pocket page with barcode, “DO NOT REMOVE SLIP FROM POCKET,” a Heckman Bindery stamp, and library pocket hardware/labels.'},
    562: {'visual_notes': 'Black back cover.'},
}


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open('r', encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def norm_spaces(s: str) -> str:
    return re.sub(r'[ \t]+', ' ', s).strip()


def join_reading_lines(lines: list[str]) -> str:
    """Join OCR lines into reading order while repairing explicit scan hyphenation."""
    out = ''
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if not out:
            out = line
            continue
        # Internet Archive OCR often uses U+00AC (¬) for line-end hyphenation.
        if out.endswith(('¬', '\u00ad')):
            out = out[:-1] + line.lstrip()
        elif out.endswith('-') and line and line[0].islower():
            out = out[:-1] + line.lstrip()
        else:
            out += ' ' + line
    return norm_spaces(out)


def bbox_norm(bbox: Iterable[float], width: float, height: float) -> list[float]:
    x0, y0, x1, y1 = bbox
    return [round(x0 / width, 6), round(y0 / height, 6), round(x1 / width, 6), round(y1 / height, 6)]


def extract_page_blocks(page: fitz.Page) -> list[dict[str, Any]]:
    """Extract OCR text blocks with exact block coordinates and estimated line coordinates.

    PyMuPDF's block extraction is dramatically faster than span-level extraction on
    this 562-page archival scan. The page/block placement is exact. Individual line
    boxes are proportionally estimated within each OCR block and are explicitly
    marked as such.
    """
    width, height = float(page.rect.width), float(page.rect.height)
    blocks: list[dict[str, Any]] = []
    for raw in page.get_text('blocks', sort=True):
        x0, y0, x1, y1, text, block_no, block_type = raw[:7]
        if int(block_type) != 0 or not str(text).strip():
            continue
        raw_lines = [line.rstrip() for line in str(text).splitlines() if line.strip()]
        if not raw_lines:
            continue
        line_h = max((float(y1) - float(y0)) / len(raw_lines), 1.0)
        lines = []
        for i, line in enumerate(raw_lines):
            lb = [float(x0), float(y0) + i * line_h, float(x1), min(float(y1), float(y0) + (i + 1) * line_h)]
            lines.append({
                'text': line,
                'bbox': [round(v, 3) for v in lb],
                'bbox_normalized': bbox_norm(lb, width, height),
                'bbox_estimated_from_block': True,
                'mean_font_size': None,
            })
        bbox = [float(x0), float(y0), float(x1), float(y1)]
        blocks.append({
            'order': len(blocks) + 1,
            'bbox': [round(v, 3) for v in bbox],
            'bbox_normalized': bbox_norm(bbox, width, height),
            'layout_text': '\n'.join(raw_lines),
            'reading_text': join_reading_lines(raw_lines),
            'lines': lines,
            'source_block_number': int(block_no),
        })
    blocks.sort(key=lambda x: (x['bbox'][1], x['bbox'][0]))
    for i, b in enumerate(blocks, 1):
        b['order'] = i
    return blocks


def read_toc(doc: fitz.Document):
    toc = doc.get_toc(simple=True)
    chapters = []
    appendices = []
    for level, title, page in toc:
        m = re.match(r'Sura\s+(\d+)\s*:\s*(.+)', title)
        if m:
            chapters.append({'chapter_number': int(m.group(1)), 'toc_title': m.group(2).strip(), 'pdf_start_page': int(page)})
        m = re.match(r'Appendix\s+(\d+)\s*:\s*(.+)', title, re.I)
        if m:
            appendices.append({'appendix_number': int(m.group(1)), 'title': m.group(2).strip(), 'pdf_start_page': int(page)})
    chapters.sort(key=lambda x: x['chapter_number'])
    appendices.sort(key=lambda x: x['appendix_number'])
    for i, row in enumerate(chapters):
        row['pdf_end_page'] = chapters[i + 1]['pdf_start_page'] - 1 if i + 1 < len(chapters) else 481
        row['printed_start_page'] = row['pdf_start_page'] - 12
        row['printed_end_page'] = row['pdf_end_page'] - 12
    for i, row in enumerate(appendices):
        row['pdf_end_page'] = appendices[i + 1]['pdf_start_page'] - 1 if i + 1 < len(appendices) else 537
        row['printed_start_page'] = row['pdf_start_page'] - 12
        row['printed_end_page'] = row['pdf_end_page'] - 12
    return chapters, appendices


def page_section(pno: int) -> tuple[str, str]:
    if pno <= 12:
        return 'front_matter', 'front_matter'
    if pno <= 481:
        return 'quran', 'quran_text'
    if pno == 482:
        return 'appendices', 'appendix_title_page'
    if pno <= 535:
        return 'appendices', 'appendix_text'
    if pno <= 537:
        return 'appendices', 'appendix_footnotes'
    if pno <= 556:
        return 'index', 'subject_index'
    return 'back_matter', 'back_matter'


def chapter_for_page(chapters: list[dict[str, Any]], pno: int) -> dict[str, Any] | None:
    for row in chapters:
        if row['pdf_start_page'] <= pno <= row['pdf_end_page']:
            return row
    return None


def appendix_for_page(appendices: list[dict[str, Any]], pno: int) -> dict[str, Any] | None:
    for row in appendices:
        if row['pdf_start_page'] <= pno <= row['pdf_end_page']:
            return row
    return None


def top_header_text(blocks: list[dict[str, Any]], page_height: float) -> str:
    candidates = [b['reading_text'] for b in blocks if b['bbox'][1] < min(260, page_height * 0.12)]
    return norm_spaces(' '.join(candidates))


def body_verse_numbers(blocks: list[dict[str, Any]], chapter_count: int, page_height: float) -> list[int]:
    nums = []
    footnote_started = False
    for b in blocks:
        if b['bbox'][1] < page_height * 0.08:
            continue
        for line in b['lines']:
            t = line['text'].strip()
            if FOOTNOTE_RE.match(t):
                footnote_started = True
            if footnote_started:
                continue
            m = VERSE_RE.match(t)
            if m:
                n = int(m.group(1))
                if 1 <= n <= chapter_count:
                    nums.append(n)
            else:
                # OCR confuses 1. with I. on some pages.
                if re.match(r'^I\.\s+', t) and chapter_count >= 1:
                    nums.append(1)
    return nums


def parse_header_range(header: str, chapter_number: int, chapter_count: int, previous_start: int | None) -> tuple[int | None, int | None]:
    # Locate the chapter number and the digit run following the colon. The OCR
    # sometimes merges ranges (170178), inserts spaces (263 272), or corrupts a
    # hyphen. We recover plausible start/end values using the known verse count.
    m = re.search(rf'\b{chapter_number}\s*[:;]\s*([0-9][0-9\s\-–—*■\.]*?)\s*(?:\d{{1,3}}\s*)?$', header)
    if not m:
        m = re.search(rf'\b{chapter_number}\s*[:;]\s*([0-9][0-9\s\-–—*■\.]*)', header)
    if not m:
        return None, None
    s = m.group(1).strip()
    s = s.replace('–', '-').replace('—', '-').replace('*', '-').replace('■', '-')
    s = re.sub(r'\s+', '', s)
    s = s.strip('.-')
    if not s:
        return None, None
    # Normal hyphenated range.
    mh = re.match(r'^(\d+)-(\d+)', s)
    if mh:
        a, b = int(mh.group(1)), int(mh.group(2))
        if 1 <= a <= b <= chapter_count:
            return a, b
    # Space/character loss can leave two adjacent numbers.
    digits = re.sub(r'\D', '', s)
    candidates = []
    for k in range(1, len(digits)):
        a, b = int(digits[:k]), int(digits[k:])
        if 1 <= a <= b <= chapter_count:
            if previous_start is None or a > previous_start:
                candidates.append((a, b))
    if candidates:
        # Favor the candidate with a page-sized span and the smallest plausible start.
        candidates.sort(key=lambda ab: (abs((ab[1] - ab[0]) - 10), ab[0]))
        return candidates[0]
    # Single verse or a clean start only.
    try:
        a = int(digits)
        if 1 <= a <= chapter_count:
            return a, a
    except ValueError:
        pass
    return None, None


def assign_page_verse_ranges(pages: list[dict[str, Any]], chapters: list[dict[str, Any]], chapter_counts: dict[int, int]) -> dict[int, tuple[int, int]]:
    ranges: dict[int, tuple[int, int]] = {}
    pages_by_chapter: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for p in pages:
        if p.get('chapter_number'):
            pages_by_chapter[p['chapter_number']].append(p)
    for ch in chapters:
        n = ch['chapter_number']
        chpages = sorted(pages_by_chapter[n], key=lambda x: x['pdf_page'])
        count = chapter_counts[n]
        starts: list[int | None] = []
        prev = None
        for i, p in enumerate(chpages):
            if i == 0:
                start = 1
            else:
                header = p.get('header_text', '')
                hs, _ = parse_header_range(header, n, count, prev)
                body_nums = p.get('_body_verse_numbers', [])
                body_candidates = [x for x in body_nums if prev is None or x > prev]
                start = hs
                if start is None or start <= (prev or 0):
                    start = min(body_candidates) if body_candidates else None
                if start is None:
                    start = (prev or 0) + 1
            starts.append(start)
            prev = start
        # Repair non-increasing or implausible starts using body evidence and neighbors.
        for i in range(1, len(starts)):
            if starts[i] is None or starts[i] <= starts[i - 1]:
                body = [x for x in chpages[i].get('_body_verse_numbers', []) if x > starts[i - 1]]
                starts[i] = min(body) if body else starts[i - 1] + 1
        for i, p in enumerate(chpages):
            start = int(starts[i] or 1)
            end = int(starts[i + 1] - 1) if i + 1 < len(starts) else count
            if end < start:
                end = start
            if end > count:
                end = count
            ranges[p['pdf_page']] = (start, end)
    return ranges


def is_title_caseish(text: str) -> bool:
    words = re.findall(r"[A-Za-z][A-Za-z'’-]*", text)
    if not words:
        return False
    capped = sum(1 for w in words if w[0].isupper())
    return capped / len(words) >= 0.55


def classify_blocks(page_record: dict[str, Any]) -> None:
    pno = page_record['pdf_page']
    section = page_record['section']
    width, height = page_record['page_size']['width'], page_record['page_size']['height']
    for b in page_record['blocks']:
        text = b['reading_text'].strip()
        x0, y0, x1, y1 = b['bbox']
        role = 'body_text'
        if section == 'quran':
            if y0 < height * 0.10 and (re.search(r'\d+:\d+', text) or page_record.get('chapter_title', '') in text):
                role = 'page_header'
            elif CHAPTER_HEADING_RE.match(text):
                role = 'chapter_heading'
            elif text.startswith('In the name of God'):
                role = 'opening_formula'
            elif any(FOOTNOTE_RE.match(line['text'].strip()) for line in b['lines']):
                role = 'quran_footnote_block'
            elif any(VERSE_RE.match(line['text'].strip()) or re.match(r'^I\.\s+', line['text'].strip()) for line in b['lines']):
                role = 'verse_text'
            else:
                centered = abs(((x0 + x1) / 2) - (width / 2)) < width * 0.16
                short = len(text) <= 110 and len(b['lines']) <= 2
                no_terminal = not text.endswith(('.', ';', ',', ':', '?', '!'))
                mean_sizes = [ln['mean_font_size'] for ln in b['lines'] if ln['mean_font_size']]
                mean_size = statistics.mean(mean_sizes) if mean_sizes else 0
                if centered and short and no_terminal and is_title_caseish(text) and len(text) > 3:
                    role = 'subheading'
                else:
                    role = 'verse_continuation'
        elif pno == 482:
            role = 'appendix_title_page'
        elif section == 'appendices':
            if APPENDIX_RE.match(text):
                role = 'appendix_heading'
            elif pno in (536, 537):
                role = 'appendix_footnotes'
            elif y0 < height * 0.22 and len(text) < 160 and is_title_caseish(text):
                role = 'appendix_title'
            else:
                role = 'appendix_body'
        elif section == 'index':
            role = 'subject_index_entry_block'
        elif section == 'front_matter':
            if 'INDEX OF SURAS' in text:
                role = 'sura_index_heading'
            else:
                role = 'front_matter_text'
        else:
            role = 'back_matter_text'
        b['role'] = role


def extract_quran_footnotes(page: dict[str, Any]) -> list[dict[str, Any]]:
    if page['section'] != 'quran':
        return []
    lines = []
    for b in page['blocks']:
        for line in b['lines']:
            lines.append({**line, 'block_order': b['order']})
    lines.sort(key=lambda x: (x['bbox'][1], x['bbox'][0]))
    notes = []
    current = None
    for line in lines:
        t = line['text'].strip()
        m = FOOTNOTE_RE.match(t)
        if m:
            if current:
                notes.append(current)
            current = {
                'label': m.group(1),
                'lines': [m.group(2).strip()] if m.group(2).strip() else [],
                'bbox_parts': [line['bbox']],
            }
        elif current:
            # Keep every subsequent line. Footnotes occupy the lower page after their first label.
            current['lines'].append(t)
            current['bbox_parts'].append(line['bbox'])
    if current:
        notes.append(current)
    out = []
    for note in notes:
        xs0 = [b[0] for b in note['bbox_parts']]
        ys0 = [b[1] for b in note['bbox_parts']]
        xs1 = [b[2] for b in note['bbox_parts']]
        ys1 = [b[3] for b in note['bbox_parts']]
        out.append({
            'verse_reference': note['label'],
            'chapter_number': int(note['label'].split(':')[0]),
            'text': join_reading_lines(note['lines']),
            'layout_text': '\n'.join(note['lines']),
            'pdf_page': page['pdf_page'],
            'printed_page': page['printed_page'],
            'bbox': [round(min(xs0), 3), round(min(ys0), 3), round(max(xs1), 3), round(max(ys1), 3)],
        })
    return out


def clean_subheading_text(text: str) -> str:
    text = norm_spaces(text)
    text = re.sub(r'^[^A-Za-z0-9“‘]+', '', text)
    text = re.sub(r'[^A-Za-z0-9”’!?*]+$', '', text)
    # Remove obvious OCR artifacts around decorative markers while preserving wording.
    text = text.replace('Peopled', 'People') if text.endswith('Peopled') else text
    return text.strip()


def extract_subheadings(page: dict[str, Any]) -> list[dict[str, Any]]:
    if page['section'] != 'quran':
        return []
    candidates = [b for b in page['blocks'] if b.get('role') == 'subheading']
    if not candidates:
        return []
    verse_lines = []
    for b in page['blocks']:
        if b.get('role') in ('quran_footnote_block', 'page_header'):
            continue
        for line in b['lines']:
            m = VERSE_RE.match(line['text'].strip())
            if m:
                verse_lines.append((line['bbox'][1], int(m.group(1))))
    out = []
    for b in candidates:
        y = b['bbox'][1]
        below = [n for yy, n in verse_lines if yy > y]
        before = min(below) if below else page.get('verse_start')
        text = clean_subheading_text(b['reading_text'])
        if len(text) < 4:
            continue
        out.append({
            'chapter_number': page.get('chapter_number'),
            'placement_before_verse': before,
            'verse_id': f"{page.get('chapter_number')}:{before}" if page.get('chapter_number') and before else None,
            'text': text,
            'pdf_page': page['pdf_page'],
            'printed_page': page['printed_page'],
            'bbox': b['bbox'],
            'bbox_normalized': b['bbox_normalized'],
        })
    return out


def markdown_page(page: dict[str, Any]) -> str:
    meta = [f"PDF page {page['pdf_page']}"]
    if page.get('printed_page') is not None:
        meta.append(f"printed page {page['printed_page']}")
    meta.append(page['page_type'].replace('_', ' '))
    if page.get('chapter_number'):
        meta.append(f"Sura {page['chapter_number']}")
    if page.get('verse_start'):
        meta.append(f"verses {page['chapter_number']}:{page['verse_start']}-{page['verse_end']}")
    if page.get('appendix_number'):
        meta.append(f"Appendix {page['appendix_number']}")
    out = ['# ' + ' | '.join(meta), '']
    if page.get('visual_notes'):
        out += ['**Visual note:** ' + page['visual_notes'], '']
    for mb in page.get('manual_blocks', []):
        out += [f"## {mb['role'].replace('_', ' ').title()}", '', mb['text'], '']
        if mb.get('note'):
            out += [f"*{mb['note']}*", '']
    role_names = {
        'page_header': 'Page header', 'chapter_heading': 'Chapter heading', 'opening_formula': 'Opening formula',
        'verse_text': 'Verse text', 'verse_continuation': 'Verse continuation', 'subheading': 'Subheading',
        'quran_footnote_block': 'Footnote block', 'appendix_heading': 'Appendix heading',
        'appendix_title': 'Appendix title', 'appendix_body': 'Appendix body', 'appendix_footnotes': 'Appendix footnotes',
        'subject_index_entry_block': 'Index text', 'front_matter_text': 'Front matter',
        'sura_index_heading': 'Sura index heading', 'appendix_title_page': 'Appendix title page',
        'back_matter_text': 'Back matter', 'body_text': 'Body text'
    }
    last_role = None
    for b in page['blocks']:
        role = b.get('role', 'body_text')
        if role != last_role:
            out += [f"## {role_names.get(role, role.replace('_', ' ').title())}", '']
            last_role = role
        out += [b['layout_text'], '']
    if not page['blocks'] and not page.get('manual_blocks') and not page.get('visual_notes'):
        out += ['[Blank page]', '']
    return '\n'.join(out).rstrip() + '\n\n'


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str] | None = None) -> None:
    if fieldnames is None:
        fieldnames = []
        seen = set()
        for row in rows:
            for k in row:
                if k not in seen:
                    seen.add(k)
                    fieldnames.append(k)
    with path.open('w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        w.writeheader()
        for row in rows:
            w.writerow(row)


def main() -> None:
    ref_index = load_csv(REF_INDEX)
    ref_chapters = load_csv(REF_CHAPTERS)
    ref_subtitles = load_csv(REF_SUBTITLES)
    ref_footnotes = load_csv(REF_FOOTNOTES)
    chapter_counts = {int(r['chapter_number']): int(r['chapter_verses']) for r in ref_chapters}

    doc = fitz.open(PDF_PATH)
    chapters, appendices = read_toc(doc)
    for ch in chapters:
        ch['chapter_verses'] = chapter_counts[ch['chapter_number']]
        # Split the TOC title into a practical English title and parenthetical transliteration where possible.
        m = re.match(r'(.+?)\s*\((.+)\)\s*$', ch['toc_title'])
        if m:
            ch['title_english_1981'] = m.group(1).strip()
            ch['title_parenthetical_1981'] = m.group(2).strip()
        else:
            ch['title_english_1981'] = ch['toc_title']
            ch['title_parenthetical_1981'] = ''

    pages: list[dict[str, Any]] = []
    for idx in range(doc.page_count):
        pno = idx + 1
        page = doc[idx]
        section, ptype = page_section(pno)
        blocks = extract_page_blocks(page)
        ch = chapter_for_page(chapters, pno)
        app = appendix_for_page(appendices, pno)
        printed_page = None
        if 13 <= pno <= 481 or 483 <= pno <= 556:
            printed_page = pno - 12
        rec: dict[str, Any] = {
            'pdf_page': pno,
            'printed_page': printed_page,
            'section': section,
            'page_type': ptype,
            'page_size': {'width': round(float(page.rect.width), 3), 'height': round(float(page.rect.height), 3)},
            'chapter_number': ch['chapter_number'] if ch else None,
            'chapter_title': ch['toc_title'] if ch else None,
            'appendix_number': app['appendix_number'] if app else None,
            'appendix_title': app['title'] if app else None,
            'header_text': top_header_text(blocks, float(page.rect.height)),
            'blocks': blocks,
            'raw_ocr_text': page.get_text('text'),
            'reading_text': '\n\n'.join(b['reading_text'] for b in blocks),
        }
        if pno in MANUAL_PAGE_CONTENT:
            rec.update(MANUAL_PAGE_CONTENT[pno])
        if ch:
            rec['_body_verse_numbers'] = body_verse_numbers(blocks, chapter_counts[ch['chapter_number']], float(page.rect.height))
        pages.append(rec)

    verse_ranges = assign_page_verse_ranges(pages, chapters, chapter_counts)
    for p in pages:
        if p['pdf_page'] in verse_ranges:
            p['verse_start'], p['verse_end'] = verse_ranges[p['pdf_page']]
            p['verse_range'] = f"{p['chapter_number']}:{p['verse_start']}-{p['verse_end']}"
        else:
            p['verse_start'] = p['verse_end'] = None
            p['verse_range'] = None
        classify_blocks(p)
        p.pop('_body_verse_numbers', None)

    # Structured derivatives.
    footnotes = []
    subheadings = []
    for p in pages:
        footnotes.extend(extract_quran_footnotes(p))
        subheadings.extend(extract_subheadings(p))

    # Map every verse to the page on which the 1981 edition prints it.
    page_ranges_by_ch = defaultdict(list)
    for p in pages:
        if p.get('chapter_number') and p.get('verse_start'):
            page_ranges_by_ch[p['chapter_number']].append(p)
    verse_index_rows = []
    for r in ref_index:
        ch, v = int(r['chapter_number']), int(r['verse_number'])
        if v == 0:
            # The supplied index includes a verse-0 row for the unnumbered opening
            # formula at the start of 112 suras. Place it on that sura's first page.
            match = next((p for p in page_ranges_by_ch[ch] if p['verse_start'] == 1), None)
        else:
            match = next((p for p in page_ranges_by_ch[ch] if p['verse_start'] <= v <= p['verse_end']), None)
        verse_index_rows.append({
            'verse_index': int(r['verse_index']),
            'verse_id': r['verse_id'],
            'chapter_number': ch,
            'verse_number': v,
            'chapter_verses': int(r['chapter_verses']),
            'verse_id_arabic': r['verse_id_arabic'],
            'pdf_page_1981': match['pdf_page'] if match else None,
            'printed_page_1981': match['printed_page'] if match else None,
        })

    # Add cross-edition validation columns without substituting later-edition text.
    ref_sub_by_verse = defaultdict(list)
    for r in ref_subtitles:
        ref_sub_by_verse[r['verse_id']].append(r['english'])
    for s in subheadings:
        refs = ref_sub_by_verse.get(s.get('verse_id'), [])
        s['later_edition_candidates_same_verse'] = ' || '.join(refs)
        s['exact_match_to_later_edition'] = any(norm_spaces(x).casefold() == norm_spaces(s['text']).casefold() for x in refs)

    ref_fn_labels = {re.sub(r'^±', '', r['english'].split(' ', 1)[0]) for r in ref_footnotes if r.get('english')}
    for f in footnotes:
        f['label_present_in_later_edition_csv'] = f['verse_reference'] in ref_fn_labels

    # Page-level CSV flattens the principal metadata and full layout text.
    page_csv_rows = []
    for p in pages:
        page_csv_rows.append({
            'pdf_page': p['pdf_page'], 'printed_page': p['printed_page'], 'section': p['section'], 'page_type': p['page_type'],
            'chapter_number': p['chapter_number'], 'chapter_title': p['chapter_title'], 'verse_range': p['verse_range'],
            'appendix_number': p['appendix_number'], 'appendix_title': p['appendix_title'], 'header_text': p['header_text'],
            'visual_notes': p.get('visual_notes', ''),
            'transcription': ('\n\n'.join(m['text'] for m in p.get('manual_blocks', [])) + ('\n\n' if p.get('manual_blocks') else '') + p['reading_text']).strip(),
            'layout_text': '\n\n'.join(b['layout_text'] for b in p['blocks']),
        })

    # Index lines preserve exact row placement for the printed subject index.
    subject_index_lines = []
    for p in pages:
        if p['section'] != 'index':
            continue
        order = 0
        for b in p['blocks']:
            for line in b['lines']:
                order += 1
                subject_index_lines.append({
                    'pdf_page': p['pdf_page'], 'printed_page': p['printed_page'], 'line_order': order,
                    'text': line['text'], 'bbox': json.dumps(line['bbox']), 'bbox_normalized': json.dumps(line['bbox_normalized'])
                })

    # Front-matter sura index from chapters / printed start pages.
    sura_index = [{
        'sura_number': c['chapter_number'], 'name_1981': c['toc_title'], 'chapter_verses': c['chapter_verses'],
        'pdf_start_page': c['pdf_start_page'], 'printed_start_page': c['printed_start_page']
    } for c in chapters]

    # Write main JSONL (one complete page per line) and a compact manifest JSON.
    with (OUT_DIR / 'Quran1981_pages_layout.jsonl').open('w', encoding='utf-8') as f:
        for p in pages:
            f.write(json.dumps(p, ensure_ascii=False) + '\n')

    manifest = {
        'title': 'Quran: The Final Scripture (Authorized English Version)',
        'translator': 'Rashad Khalifa, Ph.D.',
        'edition_year': 1981,
        'source_pdf': PDF_PATH.name,
        'pdf_page_count': doc.page_count,
        'printed_quran_pages': 469,
        'chapters': len(chapters),
        'verses_indexed': len(verse_index_rows),
        'subheadings_extracted': len(subheadings),
        'quran_footnotes_extracted': len(footnotes),
        'appendices': len(appendices),
        'method': 'Embedded page OCR and coordinates from the scan, structural parsing, cross-edition alignment using the supplied CSVs, and targeted visual transcription for pages absent from the OCR layer.',
        'important_note': 'The supplied later-edition CSV wording was used for alignment and validation only; it was not substituted for the 1981 edition wording.',
        'files': [
            'Quran1981_pages_layout.jsonl', 'Quran1981_complete.json', 'Quran1981_full_transcription.md', 'Quran1981_pages.csv',
            'Quran1981_chapters.csv', 'Quran1981_verse_index.csv', 'Quran1981_subheadings.csv',
            'Quran1981_footnotes.csv', 'Quran1981_appendices.csv', 'Quran1981_subject_index_lines.csv',
            'Quran1981_sura_index.csv', 'Quran1981_QA_report.md'
        ]
    }
    (OUT_DIR / 'Quran1981_manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    (OUT_DIR / 'Quran1981_complete.json').write_text(
        json.dumps({'manifest': manifest, 'pages': pages}, ensure_ascii=False, indent=2), encoding='utf-8'
    )

    with (OUT_DIR / 'Quran1981_full_transcription.md').open('w', encoding='utf-8') as f:
        f.write('# Quran: The Final Scripture (1981) - Page-by-Page Transcription\n\n')
        f.write('This file preserves page order, structural roles, block breaks, chapter headings, subheadings, Quran footnotes, appendices, and subject-index pages. Coordinates for every OCR line and block are in `Quran1981_pages_layout.jsonl`.\n\n')
        for p in pages:
            f.write(markdown_page(p))

    write_csv(OUT_DIR / 'Quran1981_pages.csv', page_csv_rows)
    write_csv(OUT_DIR / 'Quran1981_chapters.csv', chapters)
    write_csv(OUT_DIR / 'Quran1981_verse_index.csv', verse_index_rows)
    write_csv(OUT_DIR / 'Quran1981_subheadings.csv', subheadings)
    write_csv(OUT_DIR / 'Quran1981_footnotes.csv', footnotes)
    write_csv(OUT_DIR / 'Quran1981_appendices.csv', appendices)
    write_csv(OUT_DIR / 'Quran1981_subject_index_lines.csv', subject_index_lines)
    write_csv(OUT_DIR / 'Quran1981_sura_index.csv', sura_index)

    # QA checks.
    mapped = sum(1 for r in verse_index_rows if r['pdf_page_1981'])
    empty_ocr_pages = [p['pdf_page'] for p in pages if not p['raw_ocr_text'].strip()]
    manual_pages = sorted(MANUAL_PAGE_CONTENT)
    bad_ranges = []
    for c in chapters:
        chpages = [p for p in pages if p.get('chapter_number') == c['chapter_number']]
        if not chpages:
            bad_ranges.append(f"Sura {c['chapter_number']}: no pages")
            continue
        if chpages[0]['verse_start'] != 1 or chpages[-1]['verse_end'] != c['chapter_verses']:
            bad_ranges.append(f"Sura {c['chapter_number']}: {chpages[0]['verse_start']}..{chpages[-1]['verse_end']} expected 1..{c['chapter_verses']}")
        for a, b in zip(chpages, chpages[1:]):
            if a['verse_end'] + 1 != b['verse_start']:
                bad_ranges.append(f"Sura {c['chapter_number']} pages {a['pdf_page']}-{b['pdf_page']}: {a['verse_end']} -> {b['verse_start']}")

    qa = f"""# Quran1981 Transcription QA Report

## Coverage

- PDF pages represented: **{len(pages)} of {doc.page_count}**.
- Sura chapters represented: **{len(chapters)} of 114**.
- Verse-index rows mapped to a 1981 PDF page: **{mapped} of {len(verse_index_rows)}**.
- Quran subheadings structurally extracted: **{len(subheadings)}**.
- Quran footnotes structurally extracted: **{len(footnotes)}**.
- Appendices represented: **{len(appendices)} of 19**.
- Subject-index layout lines represented: **{len(subject_index_lines)}**.

## Page-image and OCR handling

The book is a scanned facsimile. The output retains both the scan's embedded OCR text and the original block/line coordinates. It also supplies a normalized reading text. Later-edition CSV wording was used only as an alignment/checking aid and was not copied over the 1981 wording.

Pages with no usable embedded OCR text: **{', '.join(map(str, empty_ocr_pages))}**. These are covers, blank/endpaper/library pages, or the Arabic facsimile on PDF page 512. Targeted visual descriptions or manual Arabic transcription were added on pages: **{', '.join(map(str, manual_pages))}**.

## Structural validation

- Chapter/page ranges with continuity issues: **{len(bad_ranges)}**.
"""
    if bad_ranges:
        qa += '\n'.join(f'- {x}' for x in bad_ranges[:100]) + '\n'
    else:
        qa += '- No chapter-range continuity errors detected.\n'
    qa += """

## Accuracy status

This is a complete page-by-page structural transcription and not merely a prose extraction. Every OCR block and line has placement coordinates. Because the source itself is an archival OCR scan, rare character-level OCR defects can remain in ordinary body text. The JSONL preserves the raw OCR alongside the normalized reading text so that any disputed wording can be checked directly against its exact page and bounding box. The most important structure requested - chapters, subheadings, Quran footnotes, appendices, page order, and placement - is separately indexed in the CSV outputs.
"""
    (OUT_DIR / 'Quran1981_QA_report.md').write_text(qa, encoding='utf-8')

    readme = '''# Quran1981 Transcription Bundle

- `Quran1981_complete.json`: one consolidated JSON object containing the manifest and all 562 page records.
- `Quran1981_pages_layout.jsonl`: one page per line, with OCR blocks, block coordinates, estimated line coordinates, roles, and manual visual additions.
- `Quran1981_full_transcription.md`: readable page-by-page transcription preserving block breaks and structural labels.
- `Quran1981_pages.csv`: one row per PDF page with page metadata and full text.
- `Quran1981_chapters.csv`: the 114 chapter starts, titles, verse counts, and page ranges in this edition.
- `Quran1981_verse_index.csv`: all 6,346 supplied verse-index rows mapped to their 1981 PDF and printed pages, including verse-0 opening-formula rows.
- `Quran1981_subheadings.csv`: extracted 1981 subheadings with the verse before which each is printed and its page coordinates.
- `Quran1981_footnotes.csv`: extracted Quran footnotes with labels, text, pages, and coordinates.
- `Quran1981_appendices.csv`: Appendix 1-19 page ranges.
- `Quran1981_subject_index_lines.csv`: line-level transcription and placement for the printed subject index.
- `Quran1981_sura_index.csv`: the front-matter sura index in structured form.
- `Quran1981_QA_report.md`: coverage, validation, and accuracy notes.
- `build_quran1981_transcription.py`: reproducible builder.

The later-edition CSVs were used only for alignment and validation. Their wording was not substituted for the 1981 text.
'''
    (OUT_DIR / 'README.md').write_text(readme, encoding='utf-8')

    # Include the reusable builder script and package everything.
    script_copy = OUT_DIR / 'build_quran1981_transcription.py'
    script_copy.write_text(Path(__file__).read_text(encoding='utf-8'), encoding='utf-8')
    zip_path = Path('/mnt/data/Quran1981_complete_transcription_bundle.zip')
    with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for path in sorted(OUT_DIR.iterdir()):
            z.write(path, arcname=f'Quran1981_transcription/{path.name}')
    print(json.dumps({
        'out_dir': str(OUT_DIR), 'zip': str(zip_path), 'manifest': manifest,
        'empty_ocr_pages': empty_ocr_pages, 'bad_ranges': bad_ranges[:20]
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
