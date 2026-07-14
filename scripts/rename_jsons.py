import os
import json
import re

jsons_dir = r"c:\Users\Jonathan\Desktop\SA\public\content\books\jsons"

files = [
    "English Meanings of the Quran - Rashad Khalifa Ph.D._organized.json",
    "ETERNITY - Screenplay - Rashad Khalifa Ph. D._organized.json",
    "Islam - Volume 1_organized.json",
    "Miracle of Quran - Significance of the Mysterious Alphabets - Rashad Khalifa Ph. D._organized.json",
    "Quran - Visual Presentation of the Miracle - Rashad Khalifa Ph. D._organized.json",
    "The Computer Speaks God's Message to the World - Rashad Khalifa Ph. D._organized.json"
]

for filename in files:
    old_path = os.path.join(jsons_dir, filename)
    if not os.path.exists(old_path):
        print(f"Skipping {filename}, not found.")
        continue

    # Extract the actual book title by removing " - Rashad Khalifa..." and "_organized.json"
    new_title = filename.replace("_organized.json", "")
    new_title = re.sub(r'\s*-\s*Rashad Khalifa.*$', '', new_title)
    
    # Update the JSON content
    with open(old_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    data['metadata']['title'] = new_title

    # New file path
    new_filename = new_title + ".json"
    new_path = os.path.join(jsons_dir, new_filename)
    
    # Save with new title
    with open(old_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    # Rename the file
    os.rename(old_path, new_path)
    print(f"Renamed '{filename}' -> '{new_filename}' and updated title to '{new_title}'")
