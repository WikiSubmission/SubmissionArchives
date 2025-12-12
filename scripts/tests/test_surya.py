import fitz
from PIL import Image
import os
import sys

# imports
from surya.foundation import FoundationPredictor
from surya.layout import LayoutPredictor

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"

def get_page_image(page_num):
    doc = fitz.open(PDF_PATH)
    page = doc.load_page(page_num)
    pix = page.get_pixmap(dpi=200)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    doc.close()
    return img

def test_layout(page_num):
    print(f"Analyzing Page {page_num}...")
    image = get_page_image(page_num)
    
    fp = FoundationPredictor() 
    predictor = LayoutPredictor(foundation_predictor=fp) 
    
    results = predictor([image])
    res = results[0] # One page
    
    # print(f"--- Detected Regions [{len(res.bboxes)}] ---")
    print(f"Result Object Dir: {dir(res)}")
    print(f"Result Object Raw: {res}")
    if hasattr(res, 'bboxes') and len(res.bboxes) > 0:
        box = res.bboxes[0]
        print(f"LayoutBox Attributes: {dir(box)}")
        print(f"Sample LayoutBox: {box}")

if __name__ == "__main__":
    test_layout(365)
