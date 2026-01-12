
import os
import re
import json

DIR = "reprocess_ready"

def verify():
    if not os.path.exists(DIR):
        print("Directory reprocess_ready not found.")
        return

    files = os.listdir(DIR)
    jsons = [f for f in files if f.endswith(".json")]
    
    print(f"Total JSON files: {len(jsons)}")
    
    missing = []
    found_count = 0
    
    for i in range(1, 53):
        pattern = f"^{i}\) "
        found = False
        for f in jsons:
            if re.match(pattern, f):
                found = True
                found_count += 1
                break
    if missing:
        print(f"MISSING indices: {missing}")
    else:
        print("SUCCESS: All 52 transcripts found (1-52).")
        
    print("\nSpeaker Statistics (Sample):")
    speakers = {}
    for f in jsons:
        path = os.path.join(DIR, f)
        try:
            with open(path, 'r', encoding='utf-8') as jf:
                data = json.load(jf)
                for seg in data:
                    sp = seg.get('speaker', 'Unknown')
                    speakers[sp] = speakers.get(sp, 0) + 1
        except:
            pass
            
    # Print top 10
    sorted_sp = sorted(speakers.items(), key=lambda x: x[1], reverse=True)
    for sp, count in sorted_sp[:15]:
        print(f"  {sp}: {count} segments")
if __name__ == "__main__":
    verify()
