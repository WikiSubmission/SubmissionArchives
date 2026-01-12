import os
import json

directory = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\rk-media-platform\reprocess_ready"
target = "is convenient because they use it a lot"

for filename in os.listdir(directory):
    if not filename.endswith(".json"):
        continue
    path = os.path.join(directory, filename)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        if target in content:
            print(f"Found in {filename}")
