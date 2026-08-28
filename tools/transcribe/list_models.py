import os
import sys
from pathlib import Path

# Ensure UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from google import genai

env_file = Path(".env.local")
for line in env_file.read_text(encoding="utf-8").splitlines():
    if line.startswith("GEMINI_API_KEY="):
        os.environ["GEMINI_API_KEY"] = line.split("=", 1)[1].strip().strip('"').strip("'")

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

print("Available models supporting generateContent:")
for m in client.models.list():
    if "generateContent" in (m.supported_actions or []):
        print(" -", m.name)
