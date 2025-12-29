import sys
import shutil

print(f"Python: {sys.version}")

# 1. Check pytesseract
try:
    import pytesseract
    print(f"pytesseract: {pytesseract.__version__}")
    try:
        # This calls tesseract --version
        ver = pytesseract.get_tesseract_version()
        print(f"Tesseract Binary: Found (Version {ver})")
    except Exception as e:
        print(f"Tesseract Binary: NOT FOUND or ERROR ({e})")
        # Check if set in path
        path_tess = shutil.which("tesseract")
        print(f"  shutil.which('tesseract'): {path_tess}")

        # Common locations
        import os
        common = [r"C:\Program Files\Tesseract-OCR\tesseract.exe", r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"]
        for c in common:
            if os.path.exists(c):
                print(f"  Found at: {c}")

except ImportError:
    print("pytesseract: NOT INSTALLED")

# 2. Check pdf2image (needs poppler)
try:
    import pdf2image
    print("pdf2image: INSTALLED")
    try:
        # Check poppler
        # Just check if 'pdftoppm' is in path
        path_pop = shutil.which("pdftoppm")
        if path_pop:
            print(f"Poppler (pdftoppm): Found at {path_pop}")
        else:
            print("Poppler (pdftoppm): NOT FOUND in PATH")
    except:
        pass
except ImportError:
    print("pdf2image: NOT INSTALLED")

# 3. Check OpenCV
try:
    import cv2
    print(f"OpenCV: {cv2.__version__}")
except ImportError:
    print("OpenCV: NOT INSTALLED")
