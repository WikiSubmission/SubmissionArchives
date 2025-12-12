import pdfplumber

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"

def inspect_bbox(page_num):
    with pdfplumber.open(PDF_PATH) as pdf:
        page = pdf.pages[page_num - 1]
        print(f"Page {page_num} BBox: {page.bbox}")
        print(f"Page {page_num} Height: {page.height}")

if __name__ == "__main__":
    inspect_bbox(20)
    inspect_bbox(21)
