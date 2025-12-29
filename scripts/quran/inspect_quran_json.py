import json

path = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\ws-quran-word-by-word_2025-09-19.json"

try:
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Type: {type(data)}")
    if isinstance(data, list):
        print(f"Length: {len(data)}")
        first_item = data[0]
        with open('scripts/sample_quran_item.json', 'w', encoding='utf-8') as f_out:
            json.dump(first_item, f_out, indent=2)
        print("Sample written to scripts/sample_quran_item.json")

except Exception as e:
    print(f"Error: {e}")
