import json
import os
import re
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

input_txt = Path("transcripts/ceDb6LHzntA/transcript.txt")
transcript_content = input_txt.read_text(encoding="utf-8")

prompt = f"""You are a master Islamic archival scholar and Arabic-English translator.

Below is the complete verbatim transcript of the historical recording:
"Edip Yuksel (A) (E) Rashad Khalifa announces the Discovery of Greatest Secret in 1974" (YouTube: ceDb6LHzntA).

The recording contains:
1. English commentary by Edip Yuksel.
2. The 1974 Arabic broadcast by Dr. Rashad Khalifa on Radio Tripoli, Libya, explaining the 19-based numerical structure of the Basmalah and Surah Al-Muddathir (74:11-31).
3. Radio announcements and Quranic recitations.

TASK:
Produce a complete, highly accurate, professional English translation of the entire transcript.

GUIDELINES:
1. Preserve every timestamp marker exactly in the format [MM:SS] (or [HH:MM:SS]) at the start of each segment.
2. For sections that are in Arabic (Dr. Rashad Khalifa's 1974 radio speeches, Quran recitations, Radio Tripoli announcer), provide a faithful, fluent, and precise English translation. Include the Arabic script and Quranic citation [Quran X:Y] when verses are recited.
3. For sections already spoken in English by Edip Yuksel, keep the spoken English text faithfully polished.
4. Do not omit any lines or timestamps. Return the complete timestamped translation from start to finish.

TRANSCRIPT TO TRANSLATE:
{transcript_content}
"""

print("[gemini] Generating complete English translation with timestamps...")
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt,
    config=types.GenerateContentConfig(
        temperature=0.1,
    )
)

translated_text = response.text.strip()

# Remove code blocks if present
if translated_text.startswith("```"):
    lines = translated_text.splitlines()
    if lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].startswith("```"):
        lines = lines[:-1]
    translated_text = "\n".join(lines).strip()

out_dir = Path("transcripts/ceDb6LHzntA")
en_txt = out_dir / "transcript_english.txt"
en_txt.write_text(translated_text, encoding="utf-8")
print("[gemini] Saved English text transcript to:", en_txt)

# Parse to segments & generate SRT / VTT
from tools.transcribe.transcribe_video import parse_timestamps_to_segments, segments_to_srt, segments_to_vtt

duration = 2462
segments = parse_timestamps_to_segments(translated_text, duration)

en_srt = out_dir / "transcript_english.srt"
en_srt.write_text(segments_to_srt(segments), encoding="utf-8")

en_vtt = out_dir / "transcript_english.vtt"
en_vtt.write_text(segments_to_vtt(segments), encoding="utf-8")

en_json = out_dir / "transcript_english.json"
en_json.write_text(json.dumps(segments, indent=2, ensure_ascii=False), encoding="utf-8")

print("[gemini] Saved English SRT, VTT, and JSON successfully!")
