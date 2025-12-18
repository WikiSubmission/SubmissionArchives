import pdfplumber

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1981.pdf"

def main():
    with pdfplumber.open(PDF_PATH) as pdf:
        for p_idx in [13, 14]:
            print(f"=== PAGE {p_idx+1} ===")
            print(pdf.pages[p_idx].extract_text())

if __name__ == "__main__":
    main()
