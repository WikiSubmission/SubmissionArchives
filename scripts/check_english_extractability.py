from pypdf import PdfReader

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"

def check_english():
    reader = PdfReader(PDF_PATH)
    print(f"Checking PDF... ({len(reader.pages)} pages)")
    
    # Check Page 25 (likely to have text)
    pages_to_check = [20, 25, 50]
    
    for p in pages_to_check:
        try:
            text = reader.pages[p].extract_text()
            print(f"\n--- Page {p} ---")
            if text and len(text.strip()) > 50:
                print(f"Found {len(text)} chars.")
                print("Sample:")
                print(text[:200])
                print("...")
            else:
                print("No significant text found (likely image-based).")
        except Exception as e:
            print(f"Error reading page {p}: {e}")

if __name__ == "__main__":
    check_english()
