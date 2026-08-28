import os
import sys
import gc
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

pdf_path = Path("transcripts/Ettelaat13511111.pdf")
doc = fitz.open(pdf_path)
out_img_dir = Path("transcripts/ettelaat_pages")
out_img_dir.mkdir(parents=True, exist_ok=True)

print(f"Total pages in PDF: {len(doc)}")

# Step 1: Render each page to image with moderate DPI (100-120 DPI is optimal for screening)
page_images = []
for i in range(len(doc)):
    page_num = i + 1
    img_path = out_img_dir / f"page_{page_num:02d}.jpg"
    page = doc[i]
    
    # Scale to ~1800-2000px height (dpi ~100) to keep memory very light
    zoom = 100 / 72.0
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    pix.save(str(img_path))
    print(f"Rendered Page {page_num:02d} ({pix.width}x{pix.height}) -> {img_path.name}")
    pix = None
    gc.collect()
    page_images.append((page_num, img_path))

# Step 2: Screen each page for mentions of Rashad Khalifa, Quran, Computer analysis, Code 19
print("\n--- Scanning all 20 pages for Rashad Khalifa / Code 19 / Quran analysis ---")
relevant_pages = []

for page_num, img_path in page_images:
    img_bytes = img_path.read_bytes()
    
    scan_prompt = """Look at this historical Iranian newspaper page from Ettela'at (11 Bahman 1351 / Jan 31, 1973).
Carefully inspect all headlines, articles, photos, and columns.
Does this page contain ANY article, column, photo, or mention related to:
1. Dr. Rashad Khalifa (دکتر رشاد خلیفه)
2. Quran computer / electronic brain analysis (تفسیر قرآن با مغز الکترونیک / کامپیوتر)
3. Code 19 / Mathematical Miracle (کد ۱۹ / معجزه ریاضی قرآن / حروف مقطعه)
4. Islamic articles about Quranic initial letters or religious commentary on computer analysis?

Respond clearly in format:
PAGE_NUMBER: <number>
MATCH: YES or NO
TOPICS: (List main section titles/topics on this page)
MATCH_DETAILS: (If YES, write the exact title, author, column location, and brief summary)
"""
    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
                scan_prompt
            ]
        )
        ans = resp.text.strip()
        print(f"\n[Page {page_num:02d} Screening Result]:")
        print(ans)
        if "MATCH: YES" in ans.upper() or "RASHAD KHALIFA" in ans.upper() or "رشاد خلیفه" in ans:
            relevant_pages.append((page_num, img_path, ans))
    except Exception as e:
        print(f"Error scanning page {page_num}: {e}")

print(f"\n{'='*70}")
print(f"SUMMARY: Scanned {len(doc)} pages. Relevant pages found: {[p[0] for p in relevant_pages]}")
print(f"{'='*70}")
