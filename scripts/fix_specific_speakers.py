import json
import os

DIR = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\rk-media-platform\reprocess_ready"

# fixes: (filename_part, bad_speaker_text, new_speaker, prepend_to_content: bool, move_text_to_prev: bool)
FIXES = [
    # QS 4
    ("4) Quran Study - Q.37", 
     "Day of Judgment. And this is why you will not be sad. This is Shakira", 
     "Shakira", 
     False, # Prepend? No.
     True), # Move text to previous seg? Yes. Specific logic needed.

    # QS 27
    ("27) Quran Study",
     "The prophets that are honored in the Quran are the following",
     "Dr. Khalifa",
     True, # Prepend text to content? Yes.
     False),

    # QS 36
    ("36) Quran Study",
     "Following the Parents Blindly",
     "Dr. Khalifa", # Or Note
     True,
     False),

    # QS 48
    ("48) Quran Study",
     "And they are in this order",
     "Dr. Khalifa",
     True,
     False),

     # QS 39
    ("39) Quran Study",
     "Materials of This World",
     "Dr. Khalifa",
     True,
     False),

     # QS 19
    ("19) Quran Study",
     "Ok. The Ultimate Miracle",
     "Dr. Khalifa",
     True,
     False),

    # QS 3
    ("3) Quran Study",
     "OK. Number one",
     "Dr. Khalifa",
     True,
     False),
     
     # QS 5
     ("5) Quran Study",
      "A woman and a group of children is convenient because they use it a lot. D",
      "Dr. Khalifa", # Guessing
      True,
      False),
     ("5) Quran Study",
      "A woman and a group of children", # The one I saw in file might be valid or not, but analysis showed the long one?
      # If analysis showed the long one, it must exist.
      "Dr. Khalifa", 
      False, # If it is the valid group singing, don't change it? 
      # I will SKIP this one unless I match the LONG text exactly.
      False),
]

def apply_fixes():
    files = os.listdir(DIR)
    
    for fname_part, bad_spk, new_spk, prepend, move_prev in FIXES:
        # Find file
        target_file = None
        for f in files:
            if fname_part in f and f.endswith(".json"):
                target_file = f
                break
        
        if not target_file:
            print(f"Could not find file for {fname_part}")
            continue
            
        path = os.path.join(DIR, target_file)
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        modified = False
        for i, seg in enumerate(data):
            if seg.get('speaker') == bad_spk:
                print(f"Fixing {bad_spk} in {target_file}")
                
                # Special logic for QS 4 move_prev
                if move_prev and i > 0:
                    # Specific to QS 4 case: "Day of Judgment... This is Shakira"
                    # Text to move: "Day of Judgment. And this is why you will not be sad."
                    # Text to keep (implied): None, the speaker label was the text.
                    # Wait, the speaker label was "Day of Judgment... This is Shakira"
                    # Content was "Ok. Storming..."
                    
                    # Logic: 
                    # 1. Parse bad_spk.
                    # 2. Append real text to prev seg content.
                    # 3. Set current speaker to new_spk.
                    
                    text_to_move = "Day of Judgment. And this is why you will not be sad."
                    prev_seg = data[i-1]
                    prev_seg['content'] = prev_seg['content'] + " " + text_to_move
                    
                    seg['speaker'] = new_spk
                    modified = True
                    
                elif prepend:
                    # Move speaker text to content
                    # e.g. "The prophets..." -> content "The prophets... " + existing content
                    seg['speaker'] = new_spk
                    seg['content'] = bad_spk + " " + seg['content']
                    modified = True
                
                else:
                    # Just rename
                    seg['speaker'] = new_spk
                    modified = True

        if modified:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"Saved {target_file}")

if __name__ == "__main__":
    apply_fixes()
