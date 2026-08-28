import os
import sys
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

image_path = Path("public/images/3_1_1_image0.png.a9845e06-1d87-47df-8a34-8f3b3dc8d8ec.webp")
image_bytes = image_path.read_bytes()

prompt = """You are an expert archivist and Persian-English translator specializing in historical Islamic journalism and Dr. Rashad Khalifa archival records.

Please transcribe this entire historical Persian newspaper/magazine clipping verbatim with extreme precision in Persian, capturing all headers, masthead, photo captions, introductory sidebar note, author bylines, and article columns.

Then, provide a complete, high-quality, professional English translation of the entire page section by section.

Structure:
1. Complete Verbatim Persian Transcription (Original Text)
   - Masthead / Top Banner: «دنیای اسلام»
   - Main Headline: «و تفسیر قرآن با مغز» [مغز الکترونیک / کامپیوتر]
   - Photo Caption: «دکتر رشاد خلیفه و مادر ایشان در زیارت خانه خدا»
   - Section: «اشاره :» (Introductory Overview)
   - Main Column: «تفسیر یا خواص حروف قرآن؟» by استاد محمد محیط طباطبائی
   - Side Column: «معجزه قرآن از تكنيك...»
2. Complete English Translation
   - Section-by-section translation capturing all names, dates, quotes, and terminology.
3. Archival & Historical Context Notes
"""

print("[gemini] Analyzing image with gemini-2.5-flash...")
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[
        types.Part.from_bytes(data=image_bytes, mime_type="image/webp"),
        prompt
    ]
)

out_file = Path("transcripts/newspaper_3_1_1_transcription.md")
out_file.parent.mkdir(parents=True, exist_ok=True)
out_file.write_text(response.text, encoding="utf-8")
print("[gemini] Analysis complete! Saved to:", out_file)
print("\n" + "="*70)
print(response.text)
print("="*70)
