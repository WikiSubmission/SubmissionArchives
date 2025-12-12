import json

with open('pdf_structure.json', 'r', encoding='utf-8') as f:
    try:
        data = json.load(f)
        for item in data:
            if "Quran Study" in item['title']:
                print(item['title'])
    except Exception as e:
        print(e)
