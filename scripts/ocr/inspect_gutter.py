import pdfplumber
import pandas as pd

PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"

def main():
    with pdfplumber.open(PDF_PATH) as pdf:
        page = pdf.pages[20] # Page 21
        words = page.extract_words()
        
        # We look for a vertical gap.
        # Check X ranges of all words.
        # Find an X interval [start, end] near center that intersects with NO words.
        
        # Sort by x0
        words.sort(key=lambda w: w['x0'])
        
        print(f"Total Words: {len(words)}")
        
        # Simple scan?
        width = float(page.width)
        center = width / 2
        
        # Check a range around center, e.g. center +/- 50
        search_min = center - 50
        search_max = center + 50
        
        # Discretize X axis in this range
        res = 1.0 # 1 point resolution
        counts = {}
        x = search_min
        while x < search_max:
            # Check if any word overlaps x
            hit = 0
            for w in words:
                wx0 = float(w['x0'])
                wx1 = float(w['x1'])
                if wx0 <= x <= wx1:
                    hit += 1
            counts[int(x)] = hit
            x += res
            
        # Print low density spots
        print("Density Map (X +/- 50 from center):")
        for x_val in sorted(counts.keys()):
            c = counts[x_val]
            # Use ASCII bar
            bar = '#' * c
            if c == 0:
                print(f"X={x_val}: GAP")
            else:
                # print(f"X={x_val}: {bar}")
                pass
                
        # Also print first 10 words to see if we have valid data
        print("First 10 words:", words[:10])

if __name__ == "__main__":
    main()
