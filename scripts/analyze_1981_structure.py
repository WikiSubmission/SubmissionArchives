import pdfplumber
import re

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1981.pdf"

def analyze():
    try:
        with pdfplumber.open(PDF_PATH) as pdf:
            print(f"Opened PDF: {PDF_PATH}")
            print(f"Total Pages: {len(pdf.pages)}")
            
            # 1. Check Text on Page 50
            if len(pdf.pages) > 50:
                p50 = pdf.pages[50]
                text = p50.extract_text()
                if text and len(text.strip()) > 100:
                    print(f"\n--- Page 50 Text Sample ---\n{text[:200]}...\n---------------------------")
                    print("Status: TEXT EXTRACTABLE")
                else:
                    print("Status: NO TEXT / SCANNED IMAGE")
                    return

            # 2. Analyze Potential Headers
            print("\nScanning first 100 pages for headers (Sura/Chapter)...")
            count = 0
            for i, page in enumerate(pdf.pages[:100]):
                words = page.extract_words(extra_attrs=['fontname', 'size'])
                for w in words:
                    txt = w['text']
                    if 'Sura' in txt or 'Chapter' in txt or 'SURA' in txt:
                        print(f"Page {i+1}: Found '{txt}' | Font: {w['fontname']} | Size: {w['size']:.2f} | Y: {w['top']:.2f}")
                        count += 1
                        if count > 20: break
                if count > 20: break

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze()
