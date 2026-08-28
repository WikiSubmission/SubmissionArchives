import os
import sys
import time
from pathlib import Path

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

out_dir = Path("transcripts/ettelaat_transcripts")
out_dir.mkdir(parents=True, exist_ok=True)
pages_dir = Path("transcripts/ettelaat_pages")

# Models to try in order of capability
models = ["gemini-2.5-flash-lite", "gemini-3.1-pro-preview", "gemini-3.7-flash", "gemini-3.5-flash"]

def transcribe_page(page_num):
    img_path = pages_dir / f"page_{page_num:02d}.jpg"
    print(f"\n{'='*70}\nProcessing Page {page_num:02d} Deep Transcription & Translation\n{'='*70}")
    
    prompt = f"""You are a master Islamic archivist and Persian-English translator.

Analyze this complete high-resolution newspaper page (Page {page_num} of Ettela'at, 11 Bahman 1351 / Jan 31, 1973) covering the special feature on Dr. Rashad Khalifa's computer analysis of the Quran (تفسیر قرآن با مغز الکترونیک).

Please provide:
1. Complete Persian Verbatim Transcription of all articles, headlines, subheadings, author bylines, and opinion columns on this page related to the feature.
2. Complete, high-quality, professional English Translation of every article and opinion column on this page section by section.
3. Summary of all commentators, scholars, and key arguments presented.
"""
    
    for model_name in models:
        try:
            print(f"Trying model: {model_name}...")
            resp = client.models.generate_content(
                model=model_name,
                contents=[
                    types.Part.from_bytes(data=img_path.read_bytes(), mime_type="image/jpeg"),
                    prompt
                ]
            )
            result_text = resp.text.strip()
            page_out = out_dir / f"ettelaat_page_{page_num:02d}_transcription.md"
            page_out.write_text(result_text, encoding="utf-8")
            print(f"SUCCESS with {model_name}! Saved Page {page_num} to: {page_out}")
            return True
        except Exception as e:
            print(f"Failed with {model_name}: {e}")
            time.sleep(3)
    return False

for p in [5, 6]:
    transcribe_page(p)
    time.sleep(5)

print("\nFinished processing target pages!")
