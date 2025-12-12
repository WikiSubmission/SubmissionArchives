import sys
try:
    from pypdf import PdfReader
except ImportError:
    print("pypdf not installed")
    sys.exit(1)

def check_pdf(path, pages=3):
    print(f"Checking: {path}")
    try:
        reader = PdfReader(path)
        print(f"Total Pages: {len(reader.pages)}")
        print(f"Total Pages: {len(reader.pages)}")
        # Check page 50 (index 49)
        if len(reader.pages) > 50:
            print(f"\n--- Page 50 ---")
            text = reader.pages[49].extract_text()
            print(text[:500] if text else "[NO TEXT FOUND]")
        else:
            print("PDF has fewer than 50 pages.")
    except Exception as e:
        print(f"Error reading PDF: {e}")

if __name__ == "__main__":
    # Check 1981 PDF - Page 51
    check_pdf(r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Quran The Final Scripture (Authorized English Version) by Rashad Khalifa (z-lib.org) (2).pdf", pages=1) # The function logic handles page index extraction, but I want specific page.

    # Actually, let's just hack the function call to read page index 50 (Page 51)
    pass
