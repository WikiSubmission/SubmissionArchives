
import os

filepath = 'server.log'
encodings = ['utf-16', 'utf-8', 'cp1252']

content = None
for enc in encodings:
    try:
        with open(filepath, 'r', encoding=enc) as f:
            content = f.read()
            break
    except:
        continue

if content:
    norm_codes = []
    target_codes = []
    
    for line in content.split('\n'):
        if 'Norm Codes:' in line:
            parts = line.split('Norm Codes:')[1].strip()
            # It might meet garbage or newlines, be careful
            # We assume comma separated ints
            try:
                norm_codes = [int(x) for x in parts.split(',') if x.strip().isdigit()]
            except: pass
            
        if 'Target Cds:' in line:
            parts = line.split('Target Cds:')[1].strip()
            try:
                target_codes = [int(x) for x in parts.split(',') if x.strip().isdigit()]
            except: pass

    print(f"Norm Len: {len(norm_codes)}")
    print(f"Targ Len: {len(target_codes)}")
    
    min_len = min(len(norm_codes), len(target_codes))
    for i in range(min_len):
        if norm_codes[i] != target_codes[i]:
            print(f"MISMATCH at Index {i}: Norm={norm_codes[i]} vs Targ={target_codes[i]}")
            print(f"Norm Char: {chr(norm_codes[i])}")
            print(f"Targ Char: {chr(target_codes[i])}")
            break
    else:
        if len(norm_codes) != len(target_codes):
            print("Prefix Matches, but specific lengths differ.")
        else:
            print("NO MISMATCH FOUND?? Then why did map lookup fail?")

else:
    print("Could not read file")
