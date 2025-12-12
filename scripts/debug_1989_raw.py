import sys
from pypdf import PdfReader

def debug_page(path, page_idx):
    reader = PdfReader(path)
    page = reader.pages[page_idx]
    try:
        text = page.extract_text(extraction_mode="layout")
        print("Using extraction_mode='layout'")
    except Exception as e:
        print(f"Layout mode failed: {e}")
        text = page.extract_text()
    
    print(f"--- RAW TEXT PAGE {page_idx+1} ---")
    print(repr(text)) # repr() reveals hidden chars like \n, \t, etc.
    print("-" * 20)
    for line in text.split('\n'):
        print(f"LINE: '{line}'")

if __name__ == "__main__":
    # Page 21 of 1989 PDF (Index 20)
    debug_page(r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf", 20)
