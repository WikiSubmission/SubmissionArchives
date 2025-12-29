import pdfplumber

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1981.pdf"

def inspect():
    with pdfplumber.open(PDF_PATH) as pdf:
        # Page 29 (idx 28)
        page = pdf.pages[28]
        print(f"--- Page {page.page_number} ---")
        words = page.extract_words()
        
        target_nums = ["160", "161", "162", "148", "149"]
        found = []
        for w in words:
            txt = w['text']
            # stripped
            clean = "".join(filter(str.isdigit, txt))
            if clean in target_nums:
                found.append(f"Found {clean} at X={w['x0']:.2f}, Y={w['top']:.2f}")
                
        if found:
            for f in found: print(f)
        else:
            print("No verse numbers found in text layer.")

if __name__ == "__main__":
    inspect()
