import json
import os

def fix_basmalahs():
    file_path = r'C:\Users\Jonathan\Desktop\RKM\data\1989_refined.json'
    
    # helper for verse id
    def get_verse_id(ch, v):
        return f"{ch}:{v}"

    print(f"Loading {file_path}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Original item count: {len(data)}")

    # Group existing verses by chapter
    # We will keep them in a list per chapter to preserve original order (and duplicates)
    chapters = {}
    for item in data:
        # Skip existing verse 0s
        if item.get('verse_number') == 0:
            continue
            
        ch = item.get('chapter_number')
        if ch is None:
            # try parsing verse_id if chapter_number missing
            vid = item.get('verse_id')
            if vid:
                parts = vid.split(':')
                if len(parts) == 2:
                    try:
                        ch = int(parts[0])
                    except:
                        pass
        
        if ch:
            if ch not in chapters:
                chapters[ch] = []
            chapters[ch].append(item)
        else:
            # if we can't identify chapter, stick it in a 'unknown' bin 
            print(f"Warning: Item without chapter number: {item}")

    new_data = []

    basmalah_text = "In the name of God, Most Gracious, Most Merciful"

    # Reconstruct the list 1..114
    for ch_num in range(1, 115):
        # 1. Handle Basmalah
        # Rule: Ch 1 and 9 DO NOT have verse 0.
        # All others DO.
        
        needs_basmalah = (ch_num != 1 and ch_num != 9)
        
        if needs_basmalah:
            basmalah_verse = {
                "chapter_number": ch_num,
                "verse_number": 0,
                "text": basmalah_text,
                "verse_id": get_verse_id(ch_num, 0)
            }
            new_data.append(basmalah_verse)

        # 2. Append existing verses for this chapter
        if ch_num in chapters:
            # We assume the list is already sorted-ish or we just append order preserved
            for item in chapters[ch_num]:
                new_data.append(item)

    print(f"New item count: {len(new_data)}")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, indent=2, ensure_ascii=False)
    
    print("Done.")

if __name__ == "__main__":
    fix_basmalahs()
