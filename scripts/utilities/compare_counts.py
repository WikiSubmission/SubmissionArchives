import json
import os
import glob

PATH_1989_DIR = r"c:\Users\Jonathan\Desktop\RKM\data\1989_chapters"
PATH_1992_REF = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1992 Quran.json"

def count_1989():
    total = 0
    files = glob.glob(os.path.join(PATH_1989_DIR, "chapter_*.json"))
    print(f"Found {len(files)} 1989 chapter files.")
    for fpath in files:
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                total += len(data)
        except Exception as e:
            print(f"Error reading {fpath}: {e}")
    return total

def count_1992():
    total = 0
    try:
        with open(PATH_1992_REF, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Schema analysis: It's likely a dict by chapter or list of verses.
            # Let's inspect structure first if needed, but previous scripts treated it as iteratable or dict.
            # In digitize_chapter.py: 
            # ref_data = json.load(f)
            # ref_count = len([v for v in ref_data if v['chapter'] == chapter])
            # So it is a flat list of verses.
            total = len(data)
    except Exception as e:
        print(f"Error reading 1992 ref: {e}")
    return total

def main():
    count89 = count_1989()
    count92 = count_1992()
    
    print(f"\nTotal Verses 1989 Extracted: {count89}")
    print(f"Total Verses 1992 Reference: {count92}")
    
    if count89 == count92:
        print("MATCH: Perfect alignment.")
    else:
        diff = count89 - count92
        print(f"MISMATCH: Difference of {diff} verses.")

if __name__ == "__main__":
    main()
