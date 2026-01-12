import os
import json
from collections import Counter

directory = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\rk-media-platform\reprocess_ready"
speakers = Counter()

print(f"Scanning {directory}...")

for filename in os.listdir(directory):
    if not filename.endswith(".json"):
        continue
    
    path = os.path.join(directory, filename)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if isinstance(data, list):
            for seg in data:
                spk = seg.get('speaker', '').strip()
                if spk:
                    # Track which file had it? Maybe just count for now.
                    speakers[spk] += 1
    except Exception as e:
        print(f"Error reading {filename}: {e}")

print("\nAll Unique Speakers Found:")
print("-" * 30)

# Sort by length of name to easily spot long "sentence" names
sorted_speakers = sorted(speakers.items(), key=lambda x: len(x[0]), reverse=True)

for spk, count in sorted_speakers:
    print(f"[{count}] {spk}")

print("-" * 30)
