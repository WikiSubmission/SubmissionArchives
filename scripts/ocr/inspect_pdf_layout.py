import pdfplumber

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"

def inspect_page(page_num):
    with pdfplumber.open(PDF_PATH) as pdf:
        page = pdf.pages[page_num - 1] # 0-indexed
        
        print(f"--- Page {page_num} Inspection ---")
        words = page.extract_words(extra_attrs=['fontname', 'size'])
        
        # Print first 20 words with font info
        for w in words[:20]:
            print(f"Text: '{w['text']}' | Font: {w['fontname']} | Size: {w['size']:.2f} | Top: {w['top']:.2f}")

if __name__ == "__main__":
    inspect_page(21) # Check Ch 2 start
