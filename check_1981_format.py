import sys
from pypdf import PdfReader

def check_specific_page(path, page_idx):
    print(f"Checking: {path} (Page {page_idx+1})")
    try:
        reader = PdfReader(path)
        text = reader.pages[page_idx].extract_text()
        print(text[:1000])
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Page 51 (Index 50) of 1981 Edition
    check_specific_page(r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Quran The Final Scripture (Authorized English Version) by Rashad Khalifa (z-lib.org) (2).pdf", 50)
