import json
import os

BASELINE_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\1992 Quran.json"
TARGET_FILES = {
    "1981": r"c:\Users\Jonathan\Desktop\RKM\data\1981_extracted.json",
    "1989": r"c:\Users\Jonathan\Desktop\RKM\data\1989_layout_extracted.json"
}

def analyze():
    # Load Baseline
    with open(BASELINE_PATH, 'r', encoding='utf-8') as f:
        baseline_data = json.load(f)
        
    baseline_keys = set()
    for item in baseline_data:
        baseline_keys.add(f"{item['chapter_number']}:{item['verse_number']}")
        
    print(f"Baseline Verses: {len(baseline_keys)}")
    
    for label, path in TARGET_FILES.items():
        if not os.path.exists(path):
            print(f"\n--- {label} ---")
            print("File not found yet.")
            continue
            
        print(f"\n--- {label} ---")
        with open(path, 'r', encoding='utf-8') as f:
            extracted = json.load(f)
            
        extracted_keys = set(extracted.keys())
        print(f"Extracted: {len(extracted_keys)}")
        
        missing = sorted(list(baseline_keys - extracted_keys), key=lambda x: [int(y) for y in x.split(':')])
        
        print(f"Missing: {len(missing)}")
        if missing:
            print("First 20 missing:", missing[:20])
            
            # Analyze chunks
            print("Missing Chunks (Sample):")
            prev_sura = -1
            prev_verse = -1
            chunk_start = None
            
            # Simple chunk detector
            chunks = []
            current_chunk = []
            
            for m in missing:
                s, v = map(int, m.split(':'))
                if not current_chunk:
                    current_chunk = [m]
                else:
                    last_s, last_v = map(int, current_chunk[-1].split(':'))
                    if s == last_s and v == last_v + 1:
                        current_chunk.append(m)
                    else:
                        chunks.append(current_chunk)
                        current_chunk = [m]
            if current_chunk: chunks.append(current_chunk)
            
            # Print top 10 biggest chunks
            chunks.sort(key=len, reverse=True)
            for c in chunks[:10]:
                print(f"  Missing {len(c)}: {c[0]} to {c[-1]}")

if __name__ == "__main__":
    analyze()
