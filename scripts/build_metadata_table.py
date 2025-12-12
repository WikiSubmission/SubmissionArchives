import json

JSON_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1992 Quran.json"

def build_metadata():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    metadata = {}
    
    for verse in data:
        c_num = verse.get("chapter_number")
        if c_num and c_num not in metadata:
            metadata[c_num] = {
                "revelation_order": verse.get("chapter_revelation_order"),
                "total_verses": verse.get("chapter_verses"),
                "name_arabic": verse.get("chapter_title_arabic"),
                "name_english": verse.get("chapter_title_english")
            }
            
    # Write to file directly to avoid console encoding issues
    with open(r"c:\Users\Jonathan\Desktop\RKM\scripts\metadata.py", "w", encoding="utf-8") as f_out:
        f_out.write("CHAPTER_METADATA = {\n")
        for k in sorted(metadata.keys()):
            v = metadata[k]
            f_out.write(f"    {k}: {v},\n")
        f_out.write("}\n")
    print("Metadata written to scripts/metadata.py")

if __name__ == "__main__":
    build_metadata()
