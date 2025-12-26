
import os

filepath = 'server_full.log'
# ... same reading logic ...
encodings = ['utf-16', 'utf-8', 'cp1252']
content = None
for enc in encodings:
    try:
        with open(filepath, 'r', encoding=enc) as f:
            content = f.read()
            break
    except: continue

if content:
    lines = content.split('\n')
    for line in lines:
        if 'TITLE:' in line:
            # Check for possible #32 candidates
            # Keywords: "22:15", "Masjid", "32)"
            if "22" in line or "Masjid" in line or "32)" in line:
                print(line.strip())
            
            # Print neighbors of 31 and 33
            if "31)" in line or "33)" in line:
                 print(line.strip())
