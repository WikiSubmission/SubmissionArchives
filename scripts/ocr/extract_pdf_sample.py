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
output_path = r"c:\Users\Jonathan\Desktop\RKM\pdf_sample.txt"

try:
    reader = PdfReader(pdf_path)
    with open(output_path, "w", encoding="utf-8") as f:
        for i in range(min(20, len(reader.pages))):
            f.write(f"\n--- Page {i+1} ---\n")
            text = reader.pages[i].extract_text()
            f.write(text)
    print(f"Extracted {min(20, len(reader.pages))} pages to {output_path}")
except Exception as e:
    print(f"Error reading PDF: {e}")
