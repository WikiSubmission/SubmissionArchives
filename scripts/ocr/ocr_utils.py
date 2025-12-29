import easyocr
import fitz
import PIL.Image
import io
import sys

# Compat fix for newer Pillow versions used by dependencies
if not hasattr(PIL.Image, 'ANTIALIAS'):
    PIL.Image.ANTIALIAS = PIL.Image.LANCZOS

_READER = None

def get_reader(lang='en'):
    global _READER
    if _READER is None:
        print("Initializing EasyOCR Reader...")
        # gpu=True will use CUDA if available, else CPU
        _READER = easyocr.Reader([lang], gpu=True)
    return _READER

def ocr_page(pdf_path, page_idx, dpi=150):
    """
    Renders a specific page of a PDF to an image and runs OCR on it.
    Returns the extracted text as a single string (paragraphs separated by newlines).
    """
    doc = fitz.open(pdf_path)
    if page_idx < 0 or page_idx >= len(doc):
        raise ValueError(f"Page index {page_idx} out of range (0-{len(doc)-1})")
        
    page = doc[page_idx]
    
    # Render page to image
    # 150 DPI is usually sufficient for clear text and faster than 300
    pix = page.get_pixmap(dpi=dpi)
    img_data = pix.tobytes("png")
    
    reader = get_reader()
    
    # detail=0 returns just the text list
    # paragraph=True combines lines into paragraphs
    result = reader.readtext(img_data, detail=0, paragraph=True)
    
    return "\n".join(result)

if __name__ == "__main__":
    # Test on the known bad page if run directly
    path = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"
    # Page 21 is index 20
    print(ocr_page(path, 20))
