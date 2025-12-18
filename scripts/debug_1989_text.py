import pdfplumber
import json
import os

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"
MAP_PATH = r"c:\Users\Jonathan\Desktop\RKM\data\chapter_map_1989.json"

def main():
    start_page = 21
    end_page = 23
    
    with pdfplumber.open(PDF_PATH) as pdf:
        for i in range(start_page-1, end_page):
            page = pdf.pages[i]
            print(f"=== PAGE {i+1} (Raw) ===")
            print(page.extract_text() or "")

if __name__ == "__main__":
    main()
