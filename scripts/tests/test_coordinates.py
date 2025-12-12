from pypdf import PdfReader

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"

def visitor_body(text, cm, tm, fontDict, fontSize):
    x = tm[4]
    y = tm[5]
    if text and text.strip():
        print(f"[{x:3.0f}, {y:3.0f}] {text.strip()}")

reader = PdfReader(PDF_PATH)
page = reader.pages[100]
print("--- Page 100 Coordinates ---")
page.extract_text(visitor_text=visitor_body)
