
import os

filepath = 'server.log'

# Try UTF-16 then UTF-8
encodings = ['utf-16', 'utf-8', 'cp1252']

content = None
for enc in encodings:
    try:
        with open(filepath, 'r', encoding=enc) as f:
            content = f.read()
            print(f"Successfully read with {enc}")
            break
    except Exception as e:
        continue

if content:
    lines = content.split('\n')
    for line in lines:
        if 'Norm Codes:' in line or 'Target Cds:' in line:
            print(line.strip())
else:
    print("Could not read file.")
