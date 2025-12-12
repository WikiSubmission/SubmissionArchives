from pypdf import PdfReader

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"
reader = PdfReader(PDF_PATH)
total_pages = len(reader.pages)

print(f"Total Pages: {total_pages}")

# Inspect Page 100
for i in [100]:
    print(f"\n--- Page {i} ---")
    try:
        text = reader.pages[i].extract_text()
        print(text) 
    except:
        print("Error extracting text")
