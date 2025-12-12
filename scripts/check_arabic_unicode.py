from pypdf import PdfReader
import re

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"

def check_arabic():
    reader = PdfReader(PDF_PATH)
    print(f"Checking {len(reader.pages)} pages for Arabic Unicode...")
    
    arabic_pattern = re.compile(r'[\u0600-\u06FF]')
    
    # Check a few pages
    pages_to_check = [19, 20, 100, 200, 300] # Random sample
    
    found_arabic = False
    for p in pages_to_check:
        if p >= len(reader.pages): continue
        
        text = reader.pages[p].extract_text()
        matches = arabic_pattern.findall(text)
        
        if matches:
            print(f"Page {p}: Found {len(matches)} Arabic characters.")
            print(f"Sample: {''.join(matches[:20])}...")
            found_arabic = True
        else:
            print(f"Page {p}: No Arabic characters found.")

    if found_arabic:
        print("\nCONCLUSION: Arabic text IS Unicode-selectable!")
    else:
        print("\nCONCLUSION: Arabic text is likely an image/glyph (not Unicode).")

if __name__ == "__main__":
    check_arabic()
