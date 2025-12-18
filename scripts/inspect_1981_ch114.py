import pdfplumber

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1981.pdf"

def main():
    with pdfplumber.open(PDF_PATH) as pdf:
        # Check Page 481 (Index 480)
        page_idx = 480
        page = pdf.pages[page_idx]
        print(f"=== PAGE {page_idx+1} ===")
        print(page.extract_text() or "[NO TEXT]")
        
        if page_idx < len(pdf.pages):
            page = pdf.pages[page_idx]
            print(f"=== PAGE {page_idx+1} ===")
            text = page.extract_text()
            if text:
                print(text)
            else:
                print("[NO TEXT EXTRACTED]")

if __name__ == "__main__":
    main()
