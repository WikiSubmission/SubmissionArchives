import re
import pdfplumber

# The pattern currently used
SUBTITLE_SPLIT_PAT = re.compile(r'(.*?)\s+((?:[\(<]\s*(?:\d+|[A-Za-z])\s*[}\)>]|<)\s+[A-Z].*)$')

test_strings = [
    "They have followed the guidance from their Lord; they are the winners. (2} The Disbelievers",
    "They have followed the guidance from their Lord; they are the winners.(2} The Disbelievers",
    "winners. (2} The Disbelievers",
    "winners.(2} The Disbelievers"
]

print("Testing Regex:")
for s in test_strings:
    m = SUBTITLE_SPLIT_PAT.search(s)
    if m:
        print(f"MATCH: '{s}' -> Text: '{m.group(1)}' | Sub: '{m.group(2)}'")
    else:
        print(f"NO MATCH: '{s}'")

print("\nExtracting Actual Text from PDF:")
PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1981.pdf"
with pdfplumber.open(PDF_PATH) as pdf:
   # Page 14 (index 13)
   text = pdf.pages[13].extract_text()
   if "winners" in text:
       # Find the line
       for line in text.split('\n'):
           if "winners" in line:
               print(f"ACTUAL LINE: '{line}'")
               # Test regex on actual line
               m = SUBTITLE_SPLIT_PAT.search(line)
               if m:
                    print(f"MATCH ON ACTUAL: Text: '{m.group(1)}' | Sub: '{m.group(2)}'")
               else:
                    print(f"NO MATCH ON ACTUAL")
