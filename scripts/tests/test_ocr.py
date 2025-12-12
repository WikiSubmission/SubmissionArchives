import fitz
import easyocr
import PIL.Image

if not hasattr(PIL.Image, 'ANTIALIAS'):
    PIL.Image.ANTIALIAS = PIL.Image.LANCZOS
import io
import time

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"

def test_single_page(page_idx):
    print(f"Opening PDF: {PDF_PATH}")
    doc = fitz.open(PDF_PATH)
    page = doc[page_idx]
    
    print(f"Rendering Page {page_idx + 1} (150 DPI)...")
    pix = page.get_pixmap(dpi=150) # Reduced DPI for memory safety
    img_data = pix.tobytes("png")
    
    print("Initializing EasyOCR (en)...")
    reader = easyocr.Reader(['en']) # Auto download model if needed
    
    print("Running OCR...")
    t0 = time.time()
    # detail=0 -> paragraph output? No, let's get raw list.
    result = reader.readtext(img_data, detail=0, paragraph=True)
    t1 = time.time()
    
    print(f"OCR Complete in {t1-t0:.2f}s")
    print("-" * 20)
    for block in result:
        print(block)
    print("-" * 20)

if __name__ == "__main__":
    # Page 21 is Index 20
    test_single_page(20)
