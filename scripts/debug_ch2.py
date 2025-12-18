import pdfplumber
import re

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1981.pdf"

def get_optimal_gutter(page):
    words = page.extract_words()
    if not words: return page.width / 2
    
    width = page.width
    center_min = width * 0.35
    center_max = width * 0.65
    
    # Histogram logic from digitize_1981.py
    # ... (simplified for debug, actually let's just use width/2 to see BASELINE first)
    # If base is bad, then we know.
    
    return page.width / 2

def debug_ch2():
    with pdfplumber.open(PDF_PATH) as pdf:
        # Check first 5 pages of Ch 2 (starts Page 14)
        for i in range(13, 18):
            page = pdf.pages[i]
            print(f"--- Page {page.page_number} ---")
            
            width = page.width
            height = page.height
            mid = width / 2
            
            left_bbox = (0, 0, mid, height)
            right_bbox = (mid, 0, width, height)
            
            l_text = page.crop(left_bbox).extract_text()
            r_text = page.crop(right_bbox).extract_text()
            
            print("== LEFT ==")
            print(l_text[:200].replace('\n', ' || '))
            print("== RIGHT ==")
            print(r_text[:200].replace('\n', ' || '))
            print("\n")

if __name__ == "__main__":
    debug_ch2()
