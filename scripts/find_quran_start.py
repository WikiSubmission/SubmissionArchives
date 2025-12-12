import re
from pypdf import PdfReader

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1981.pdf"

def find_start():
    reader = PdfReader(PDF_PATH)
    print(f"Total Pages: {len(reader.pages)}")
    
    for i in range(500, len(reader.pages)):
        text = page = reader.pages[i].extract_text()
        if not text: continue
        
        # Look for Sura 114 Title
        if "The People" in text and "114" in text:
            print(f"FOUND Sura 114 on Page {i+1}")
            print(text[:200])
            
        if "Appendix" in text or "Index" in text:
             print(f"FOUND End Marker on Page {i+1}")
             print(text[:100])

if __name__ == "__main__":
    find_start()
