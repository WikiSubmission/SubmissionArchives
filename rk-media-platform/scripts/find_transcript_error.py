import os
import json

directory = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\quran-studies\transcripts"
target_text = "Dr. Sabahi:"

for filename in os.listdir(directory):
    if not filename.endswith(".json"):
        continue
    
    filepath = os.path.join(directory, filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        # Assuming the structure is a list of segments or similar
        # Depending on Deepgram or other format
        # Deepgram usually: results -> channels -> alternatives -> paragraphs -> paragraphs -> sentences
        
        # Let's search simply in the raw string first or traverse common structures
        content = json.dumps(data)
        if target_text in content:
            print(f"Found in: {filename}")
            
            # Now let's try to extract the specific segment
            # Try to handle generic structure: list of objects with 'text' field
            if isinstance(data, list):
                for i, item in enumerate(data):
                    if target_text in item.get('text', ''):
                        print(f"Segment Index: {i}")
                        print(f"Segment Content: {item}")
                        break
            elif isinstance(data, dict):
                 # Check for 'segments' key
                 segments = data.get('segments', [])
                 for i, item in enumerate(segments):
                    if target_text in item.get('text', ''):
                        print(f"Segment Index: {i}")
                        print(f"Segment Content: {item}")
                        break
    except Exception as e:
        print(f"Error reading {filename}: {e}")
