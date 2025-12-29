import json
import os
import glob

def load_json(path):
    if not os.path.exists(path):
        return []
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {path}: {e}")
        return []

def normalize_text(text):
    if text is None: return ""
    return text.strip()

def merge_chapters():
    # 1. Load Reference (The anchor)
    print("Loading Reference Data...")
    ref_path = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1992 Quran.json"
    ref_data = load_json(ref_path)
    
    # Organize Reference by Chapter -> Verse -> Text
    # ref_map[chapter_num][verse_num] = text
    ref_map = {}
    for item in ref_data:
        ch = item.get('chapter_number')
        v = item.get('verse_number')
        txt = item.get('verse_text_english')
        sub = item.get('verse_subtitle_english')
        fn = item.get('verse_footnote_english')
        
        if ch and v is not None:
            if ch not in ref_map: ref_map[ch] = {}
            ref_map[ch][v] = { 'text': txt, 'subtitle': sub, 'footnote': fn }

    output_dir = r"c:\Users\Jonathan\Desktop\RKM\data\merged_chapters"
    os.makedirs(output_dir, exist_ok=True)

    print("Merging Chapters 1-114...")
    
    for ch_num in range(1, 115):
        # Paths
        p81 = fr"c:\Users\Jonathan\Desktop\RKM\data\1981_chapters\chapter_{ch_num}.json"
        p89 = fr"c:\Users\Jonathan\Desktop\RKM\data\1989_chapters\chapter_{ch_num}.json"
        
        data81 = load_json(p81)
        data89 = load_json(p89)
        
        # Maps for quick lookup (Store text AND index for full object access)
        map81 = {}
        map81_idx = {} # To access full object by verse number
        for idx, item in enumerate(data81):
            v = item.get('verse_number')
            t = item.get('verse_text_english') or item.get('text')
            if v is not None: 
                map81[v] = t
                map81_idx[v] = idx
            
        map89 = {}
        map89_idx = {}
        for idx, item in enumerate(data89):
            v = item.get('verse_number')
            t = item.get('verse_text_english')
            if v is not None: 
                map89[v] = t
                map89_idx[v] = idx

        # Collect all unique verse numbers from all sources for this chapter
        all_verses = set()
        if ch_num in ref_map: all_verses.update(ref_map[ch_num].keys())
        all_verses.update(map81.keys())
        all_verses.update(map89.keys())
        
        sorted_verses = sorted(list(all_verses))
        
        merged_chapter = []
        
        for v_num in sorted_verses:
            # Skip verse 0 if it's just Basmalah header logic, but keep if it's in the data
            # User wants comparison, so we keep everything.
            
            # Prioritize subtitle from Ref > 1989 > 1981
            sub81 = data81[map81_idx.get(v_num)].get('verse_subtitle_english') if v_num in map81_idx else None
            sub89 = data89[map89_idx.get(v_num)].get('verse_subtitle_english') if v_num in map89_idx else None
            subRef = ref_map.get(ch_num, {}).get(v_num, {}).get('subtitle')
            
            final_subtitle = subRef or sub89 or sub81
            
            # 1981/1989 Footnotes
            fn81 = data81[map81_idx.get(v_num)].get('verse_footnote_english') if v_num in map81_idx else ""
            fn89 = data89[map89_idx.get(v_num)].get('verse_footnote_english') if v_num in map89_idx else ""
            fnRef = ref_map.get(ch_num, {}).get(v_num, {}).get('footnote')

            row = {
                "chapter": ch_num,
                "verse": v_num,
                "subtitle": normalize_text(final_subtitle),
                "text_1981": normalize_text(map81.get(v_num, "")),
                "footnote_1981": normalize_text(fn81),
                "text_1989": normalize_text(map89.get(v_num, "")),
                "footnote_1989": normalize_text(fn89),
                "text_ref": normalize_text(ref_map.get(ch_num, {}).get(v_num, {}).get('text')),
                "footnote_ref": normalize_text(fnRef)
            }
            merged_chapter.append(row)
            
        out_file = os.path.join(output_dir, f"chapter_{ch_num}.json")
        with open(out_file, 'w', encoding='utf-8') as f:
            json.dump(merged_chapter, f, indent=2)
            
    print(f"Done. Merged files saved to {output_dir}")

if __name__ == "__main__":
    merge_chapters()
