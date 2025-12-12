from pdf2image import convert_from_path
import pytesseract
import os
import cv2
import numpy as np

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"
POPPLER_PATH = r"C:\Users\Jonathan\AppData\Local\Programs\MiKTeX\miktex\bin\x64"
TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

if os.path.exists(TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

def debug_page(page_num):
    print(f"Processing Page {page_num}...")
    try:
        images = convert_from_path(
            PDF_PATH, 
            first_page=page_num, 
            last_page=page_num, 
            dpi=300,
            poppler_path=POPPLER_PATH
        )
        if not images:
            print("No images returned.")
            return

        image = images[0]
        # Save raw image
        raw_path = f"debug_page_{page_num}_raw.png"
        image.save(raw_path)
        print(f"Saved {raw_path}")

        # Raw Text Extraction
        raw_text = pytesseract.image_to_string(image, lang='eng')
        print("\nRAW TESSERACT TEXT (String Mode):")
        print("="*40)
        print(raw_text[:1000]) # First 1000 chars
        print("="*40)
        
        # Word Data Extraction
        data = pytesseract.image_to_data(image, lang='eng', output_type=pytesseract.Output.DICT)
        n_boxes = len(data['text'])
        
        print(f"\nDetected {n_boxes} text elements.")
        
        # Visualize Bounding Boxes
        opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        for i in range(n_boxes):
            if int(data['conf'][i]) > 0:
                x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
                text = data['text'][i]
                cv2.rectangle(opencv_image, (x, y), (x + w, y + h), (0, 255, 0), 2)
        
        box_path = f"debug_page_{page_num}_boxes.jpg"
        cv2.imwrite(box_path, opencv_image)
        print(f"Saved visualization to {box_path}")

        with open(f"debug_page_{page_num}.txt", "w", encoding="utf-8") as f:
            f.write(raw_text)
        print(f"Saved text to debug_page_{page_num}.txt")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_page(21) # Likely Sura 1 or 2 start
