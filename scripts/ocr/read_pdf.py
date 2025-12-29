import sys
try:
    from pypdf import PdfReader
except ImportError:
    try:
        import PyPDF2 as PdfReader
    except ImportError:
        print("No pypdf or PyPDF2 found")
        sys.exit(1)

pdf_path = r"c:\Users\Jonathan\Desktop\RKM\Transcripts of All Quran Studies (Audios) - Dr. Rashad Khalifa (Messenger of the Covenant).pdf"

try:
    reader = PdfReader(pdf_path)
    print(f"Total Pages: {len(reader.pages)}")
    for i in range(min(3, len(reader.pages))):
        print(f"\n--- Page {i+1} ---")
        print(reader.pages[i].extract_text())
except Exception as e:
    print(f"Error reading PDF: {e}")
