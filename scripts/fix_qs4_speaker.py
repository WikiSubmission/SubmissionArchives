import json
import os

filepath = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\rk-media-platform\reprocess_ready\4) Quran Study - Q.37, Q.3 -118-129 - Asteroid (01-21&22-1990).json"

target_bad_speaker = "I stop here because I think these three are related to each other under the title"
replacement_speaker = "Dr. Sabahi"

with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

count = 0
for seg in data:
    if seg.get('speaker') == target_bad_speaker:
        seg['speaker'] = replacement_speaker
        count += 1

print(f"Fixed {count} segments.")

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
