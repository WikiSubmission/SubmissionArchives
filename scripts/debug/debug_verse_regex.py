import ocr_utils
import re

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"

def main():
    # Scan a range
    start_p = 360
    end_p = 375
    
    with open("debug_sura26.txt", "w", encoding="utf-8") as f:
        for p in range(start_p, end_p):
            print(f"OCR Page {p}...")
            text = ocr_utils.ocr_page(PDF_PATH, p)
            f.write(f"\n--- PAGE {p} ---\n")
            f.write(text)
    
    # Test Patterns
    patterns = [
        re.compile(r'^\W*(\d+)\.\s+(.*)'), # Original: "1. Text"
        re.compile(r'^\W*(\d+)\s+(.*)'),   # No dot: "1 Text"
        re.compile(r'^\W*(\d+)\.\W*(.*)'), # Dot with potential noise
        r'(\d+)[:\.]'                      # Loose scan
    ]
    
    print("Testing Regex Patterns:")
    count = 0
    for line in lines:
        line = line.strip()
        for i, pat in enumerate(patterns):
            if isinstance(pat, str): continue
            m = pat.match(line)
            if m:
                if count < 5:
                    print(f"MATCH (Pat {i}): '{line}' -> Verse {m.group(1)}")
                count += 1
                break
    
    print(f"Total Matches: {count}")

if __name__ == "__main__":
    main()
