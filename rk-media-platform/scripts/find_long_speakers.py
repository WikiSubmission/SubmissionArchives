import os
import json

directory = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\rk-media-platform\reprocess_ready"

for filename in os.listdir(directory):
    if not filename.endswith(".json"):
        continue
    path = os.path.join(directory, filename)
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        for seg in data:
            spk = seg.get('speaker', '')
            if len(spk) > 50:
                print(f"File: {filename}")
                print(f"Speaker: {spk}")
                print("-" * 20)
