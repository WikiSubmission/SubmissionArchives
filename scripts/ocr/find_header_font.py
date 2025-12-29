import pdfplumber

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"

def find_headers(page_idx):
    with pdfplumber.open(PDF_PATH) as pdf:
        page = pdf.pages[page_idx]
        print(f"--- Page Index {page_idx} (Page {page_idx+1}) ---")
        
        words = page.extract_words(extra_attrs=['fontname', 'size'])
        
        for w in words:
            txt = w['text'].upper()
            if 'SURA' in txt or 'CHAPTER' in txt:
                print(f"MATCH: '{w['text']}' | Font: {w['fontname']} | Size: {w['size']:.2f} | Top: {w['top']:.2f}")

if __name__ == "__main__":
    find_headers(19) # Check Page 20
    find_headers(38) # Check Page 39 (TOC?)
