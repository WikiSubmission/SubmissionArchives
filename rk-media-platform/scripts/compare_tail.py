
import os

filepath = 'server.log'
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
    norm_codes = []
    target_codes = []
    for line in content.split('\n'):
        if 'Norm Codes:' in line:
            parts = line.split('Norm Codes:')[1].strip()
            try: norm_codes = [int(x) for x in parts.split(',') if x.strip().isdigit()]
            except: pass
        if 'Target Cds:' in line:
            parts = line.split('Target Cds:')[1].strip()
            try: target_codes = [int(x) for x in parts.split(',') if x.strip().isdigit()]
            except: pass

    print(f"Norm Len: {len(norm_codes)}")
    print(f"Targ Len: {len(target_codes)}")
    
    print("Norm Tail (last 10):", norm_codes[-10:])
    print("Targ Tail (last 10):", target_codes[-10:])
    print("Targ Tail Chars:", "".join([chr(c) for c in target_codes[-10:]]))
    print("Norm Tail Chars:", "".join([chr(c) for c in norm_codes[-10:]]))
