import pdfplumber
import sys

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\Hard Cover 1989.pdf"

def main():
    page_num = 48
    print(f"--- DUMPING PAGE {page_num} ---")
    with pdfplumber.open(PDF_PATH) as pdf:
        p = pdf.pages[page_num - 1]
        text = p.extract_text()
        print(f"RAW TEXT:\n{text}")
        
        print("-" * 20)
        from scripts.digitize_chapter import extract_text_from_page_crop
        crop_text = extract_text_from_page_crop(p)
        print(f"CROP TEXT:\n{crop_text}")

if __name__ == "__main__":
    main()
