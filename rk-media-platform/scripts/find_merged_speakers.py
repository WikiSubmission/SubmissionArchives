import os
import json
import re

directory = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\rk-media-platform\reprocess_ready"

# Broadest Regex for debugging
pattern = re.compile(r'(?<!\w)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*):\s')

matches = []

for filename in os.listdir(directory):
    if not filename.endswith(".json"):
        continue
    
    filepath = os.path.join(directory, filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if isinstance(data, list):
            for i, segment in enumerate(data):
                content = segment.get('content', '')
                
                # Simple check for colon to see candidates
                if ":" in content:
                    # Check if it looks like a speaker label
                    # We look for "Name: " pattern again but maybe print ALL likely candidates
                     for m in pattern.finditer(content):
                        print(f"Match in {filename} index {i}: '{m.group(0)}'")
                        print(f"Content: {content}")
                        print("-" * 10)

    except Exception as e:
        print(f"Error {filename}: {e}")
