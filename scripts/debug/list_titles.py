import json

with open('pdf_structure.json', 'r', encoding='utf-8') as f:
    chapters = json.load(f)

for i, chap in enumerate(chapters):
    print(f"{i}: {chap['title']}")
