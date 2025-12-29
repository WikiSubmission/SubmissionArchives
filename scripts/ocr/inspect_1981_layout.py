import pdfplumber
import matplotlib.pyplot as plt

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1981.pdf"

def inspect_layout():
    with pdfplumber.open(PDF_PATH) as pdf:
        page = pdf.pages[50] # Page 50 again
        words = page.extract_words()
        
        print(f"Page Width: {page.width}")
        
        # Analyze X coordinates
        x_positions = [w['x0'] for w in words]
        
        # Simple histogram (text based)
        print("X-Coordinate Distribution (0 to Width):")
        for x in sorted(x_positions):
            print(f"{x:.1f}", end=" ")
        print("\n")
        
        mid = page.width / 2
        left_count = sum(1 for x in x_positions if x < mid - 50)
        right_count = sum(1 for x in x_positions if x > mid + 50)
        center_count = sum(1 for x in x_positions if abs(x - mid) <= 50)
        
        print(f"Left Side Words: {left_count}")
        print(f"Right Side Words: {right_count}")
        print(f"Center Words: {center_count}")

        if left_count > 10 and right_count > 10 and center_count < (left_count + right_count) / 4:
            print("VERDICT: LIKELY DUAL COLUMN")
        else:
            print("VERDICT: LIKELY SINGLE COLUMN")

if __name__ == "__main__":
    inspect_layout()
