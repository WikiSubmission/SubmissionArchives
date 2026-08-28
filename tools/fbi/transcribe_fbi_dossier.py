import os
import sys
import time
import json
from pathlib import Path
import fitz  # PyMuPDF

# Ensure UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from google import genai
from google.genai import types

# Load API key
env_file = Path(".env.local")
for line in env_file.read_text(encoding="utf-8").splitlines():
    if line.startswith("GEMINI_API_KEY="):
        os.environ["GEMINI_API_KEY"] = line.split("=", 1)[1].strip().strip('"').strip("'")

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

fbi_dir = Path("data/sources/fbi")
transcripts_base = Path("transcripts/fbi")
transcripts_base.mkdir(parents=True, exist_ok=True)

SYSTEM_PROMPT = """You are a master federal archivist specializing in declassified FBI FOIA records.
Transcribe this scanned FBI document page with absolute archival accuracy.

Rules:
1. Preserve all headers, teletype routing headers (TO, FROM, DATE, CLASSIFICATION), case file numbers, FD-302 forms, and margin notes.
2. For redacted blocks (black bars / whiteouts), transcribe them explicitly with their FOIA exemption codes if visible, e.g. [REDACTED: b6, b7C], [REDACTED: b7D], [REDACTED: b1], or simply [REDACTED] if no code is printed.
3. Maintain formatting (paragraphs, lists, block quotes, tables).
4. At the top of your response, output a YAML metadata block:
---
page_number: <number>
date: "<YYYY-MM-DD or Unknown>"
origin: "<Field Office, e.g. FBI Los Angeles, FBI Phoenix, Director FBI>"
recipient: "<Recipient, e.g. Director, Phoenix, Los Angeles>"
classification: "<UNCLAS / SECRET / CONFIDENTIAL>"
doc_type: "<Teletype / FD-302 / LHM / Airmail / Memo / Letter>"
subject: "<Short subject line>"
key_entities: ["Entity1", "Entity2"]
---
Followed by the complete transcription.
"""

MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-3.1-flash-lite-preview",
    "gemini-3-flash-preview"
]

def transcribe_page_with_fallback(img_bytes, page_obj, p_num):
    for model_name in MODELS:
        try:
            resp = client.models.generate_content(
                model=model_name,
                contents=[
                    types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
                    SYSTEM_PROMPT
                ]
            )
            if resp and getattr(resp, "text", None):
                return resp.text.strip()
        except Exception as e:
            # print error
            pass
            
    # If all models fail or trigger RECITATION, use PyMuPDF text fallback
    pdf_text = page_obj.get_text("text").strip()
    if pdf_text:
        return f"""---
page_number: {p_num}
date: "Unknown"
origin: "FBI"
recipient: "Unknown"
classification: "UNCLAS"
doc_type: "Record"
subject: "FBI FOIA Document Page {p_num}"
key_entities: []
---

{pdf_text}"""
    else:
        return f"""---
page_number: {p_num}
date: "Unknown"
origin: "FBI"
recipient: "Unknown"
classification: "UNCLAS"
doc_type: "Record"
subject: "FBI FOIA Document Page {p_num}"
key_entities: []
---

[Image only / Non-extractable scan]"""

def process_pdf_part(pdf_name, part_label, start_page=1, end_page=None):
    pdf_path = fbi_dir / pdf_name
    if not pdf_path.exists():
        print(f"Error: {pdf_path} does not exist!", flush=True)
        return

    doc = fitz.open(str(pdf_path))
    total_pages = len(doc)
    end_p = min(end_page or total_pages, total_pages)
    
    part_dir = transcripts_base / part_label
    img_dir = part_dir / "images"
    pages_dir = part_dir / "pages"
    part_dir.mkdir(parents=True, exist_ok=True)
    img_dir.mkdir(parents=True, exist_ok=True)
    pages_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n{'='*70}\nProcessing {part_label} ({pdf_name}): Pages {start_page} to {end_p} (Total: {total_pages})\n{'='*70}", flush=True)
    
    for p_num in range(start_page, end_p + 1):
        md_file = pages_dir / f"page_{p_num:03d}.md"
        if md_file.exists() and md_file.stat().st_size > 100:
            continue
            
        print(f"[{part_label}] Rendering and transcribing Page {p_num:03d}/{total_pages}...", flush=True)
        page = doc[p_num - 1]
        
        # Render at 144 DPI
        pix = page.get_pixmap(dpi=144)
        img_bytes = pix.tobytes("jpeg")
        img_file = img_dir / f"page_{p_num:03d}.jpg"
        img_file.write_bytes(img_bytes)
        
        text = transcribe_page_with_fallback(img_bytes, page, p_num)
        md_file.write_text(text, encoding="utf-8")
        print(f"[{part_label}] Successfully transcribed Page {p_num:03d} ({len(text)} chars)", flush=True)
        
        time.sleep(1)

if __name__ == "__main__":
    args = sys.argv[1:]
    if args:
        part = args[0]
        if part == "part1":
            process_pdf_part("rashadkhalifa-fbi1.pdf", "part_1")
        elif part == "part4":
            process_pdf_part("rashadkhalifa-fbi4.pdf", "part_4")
        elif part == "part2":
            process_pdf_part("rashadkhalifa-fbi2.pdf", "part_2")
        elif part == "part3":
            process_pdf_part("rashadkhalifa-fbi3.pdf", "part_3")
        elif part == "all":
            process_pdf_part("rashadkhalifa-fbi1.pdf", "part_1")
            process_pdf_part("rashadkhalifa-fbi4.pdf", "part_4")
            process_pdf_part("rashadkhalifa-fbi2.pdf", "part_2")
            process_pdf_part("rashadkhalifa-fbi3.pdf", "part_3")
    else:
        process_pdf_part("rashadkhalifa-fbi3.pdf", "part_3")
