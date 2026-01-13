
import os
import json
import re

INPUT_DIR = "reprocess_ready"
OUTPUT_FILE = "ALL_QURAN_STUDIES_TRANSCRIPTS_MEGA.json"

def create_mega_json():
    if not os.path.exists(INPUT_DIR):
        print("Input directory not found.")
        return

    files = [f for f in os.listdir(INPUT_DIR) if f.endswith(".json") and not f.endswith("MEGA.json")]
    
    # Sort files by the numeric index at the start "1) ...", "10) ..."
    def get_index(fname):
        match = re.search(r'^(\d+)\)', fname)
        if match:
            return int(match.group(1))
        return 9999

    files.sort(key=get_index)
    
    master_list = []
    
    print(f"Combining {len(files)} transcripts...")
    
    for fname in files:
        index = get_index(fname)
        path = os.path.join(INPUT_DIR, fname)
        
        with open(path, 'r', encoding='utf-8') as f:
            transcript_data = json.load(f)
            
        entry = {
            "index": index,
            "filename": fname,
            "title": fname.replace(".json", ""),
            "transcript": transcript_data
        }
        master_list.append(entry)
        print(f"  Added #{index}: {fname}")

    # Write Mega JSON
    print(f"Writing {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as out:
        json.dump(master_list, out, indent=2)
        
    size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
    print(f"Done. File size: {size_mb:.2f} MB")
    print(f"Saved to: {os.path.abspath(OUTPUT_FILE)}")

if __name__ == "__main__":
    create_mega_json()
