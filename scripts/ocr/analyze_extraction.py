import json
import sys

JSON_PATH = r"c:\Users\Jonathan\Desktop\RKM\data\1989_extracted.json"

def main():
    try:
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading JSON: {e}")
        return

    print(f"Total Verses Extracted: {len(data)}")
    
    # Group by Chapter
    chapter_counts = {}
    for key in data.keys():
        try:
            chap, verse = key.split(':')
            chap = int(chap)
            chapter_counts[chap] = chapter_counts.get(chap, 0) + 1
        except:
            pass
            
    # Print Summary
    print("-" * 40)
    print(f"{'Sura':<10} | {'Count':<10}")
    print("-" * 40)
    
    sorted_chaps = sorted(chapter_counts.keys())
    for chap in sorted_chaps:
        print(f"{chap:<10} | {chapter_counts[chap]:<10}")
        
    print("-" * 40)
    print(f"Total Chapters Represented: {len(sorted_chaps)}")

if __name__ == "__main__":
    main()
