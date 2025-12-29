import pdfplumber

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"

def main():
    with pdfplumber.open(PDF_PATH) as pdf:
        # Chapter 2 starts early. Let's dump pages 10-30 to find Verse 16 context.
        for i in range(10, 30):
            print(f"=== PAGE {i} ===")
            page = pdf.pages[i-1]
            text = page.extract_text()
            if text:
                print(text)
            else:
                print("EMPTY PAGE")
                
if __name__ == "__main__":
    main()
