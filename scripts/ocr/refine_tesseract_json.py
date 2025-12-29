import json
import re
import sys
import os
try:
    from scripts.metadata import CHAPTER_METADATA
except ImportError:
    try:
        from metadata import CHAPTER_METADATA
    except ImportError:
        sys.path.append(os.path.join(os.getcwd(), 'scripts'))
        from metadata import CHAPTER_METADATA

INPUT_FILE = r"c:\Users\Jonathan\Desktop\RKM\data\1989_tesseract.json"
OUTPUT_FILE = r"c:\Users\Jonathan\Desktop\RKM\data\1989_refined.json"

# Regex to find verse starts embedded in text
# Looks for " 123. " or start of string "123. "
# We assume verse numbers are 1-286.
VERSE_SPLIT_PAT = re.compile(r'(?:^|\s)(\d{1,3})\.\s+')

def clean_text(text):
    # Remove weird OCR artifacts or footnote refs if needed
    # For now, just strip
    return text.strip()

def refine_json():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        raw_verses = json.load(f)
    
    refined_verses = []
    
    # We might have "chunks" that contain multiple verses.
    # But usually the chunk is identified by the FIRST verse found.
    # e.g. chunk "6. Text... 7. Text..." was identified as Verse 6.
    
    for chunk in raw_verses:
        chapter = chunk.get('chapter_number')
        chunk_text = chunk.get('text', '')
        
        # Split by verse pattern
        # re.split returns [text_before, number1, text1, number2, text2...]
        parts = VERSE_SPLIT_PAT.split(chunk_text)
        
        # Determine the starting verse number for the first text part?
        # If the chunk started with "6. ", parts[0] is empty, parts[1] is "6", parts[2] is text.
        # If the chunk started with text belonging to previous (unlikely with our logic), parts[0] is text.
        
        # Our previous logic `^(\d+)\.` ensures the chunk STARTS with a verse number (mostly).
        # So parts[0] should be empty or noise.
        
        if len(parts) < 2:
            # No split found? Keep as is if it looks valid
            refined_verses.append(chunk)
            continue
            
        # Iterate triplets: (number, text)
        # parts: ['', '6', 'Verily...', '7', 'God...']
        
        # If parts[0] has substantial text, it belongs to the previous verse (or is header noise).
        # Ideally we'd merge it with previous verse, but for now let's just log or ignore if short.
        
        i = 1
        while i < len(parts):
            v_num_str = parts[i]
            v_text = parts[i+1] if i+1 < len(parts) else ""
            
            try:
                v_num = int(v_num_str)
            except ValueError:
                i += 2
                continue
                
            # Validate Verse Number (simple check)
            if v_num > 286: # Max verses in Baqarah
                # Likely a false positive or page number?
                i += 2
                continue

            refined_verses.append({
                "chapter_number": chapter,
                "verse_number": v_num,
                "text": clean_text(v_text),
                "verse_id": f"{chapter}:{v_num}"
            })
            
            i += 2
            
    # Sort just in case
    refined_verses.sort(key=lambda x: (x['chapter_number'], x['verse_number']))
    
    print(f"Refinement Complete.")
    print(f"Original Count: {len(raw_verses)}")
    print(f"Refined Count: {len(refined_verses)}")
    
    # Save
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(refined_verses, f, indent=2)
    print(f"Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    refine_json()
