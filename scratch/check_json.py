import os

path = r'c:\Users\Jonathan\Desktop\SA\public\data\generated_indices\VIDEO_PROGRAMS_LIST.json'
with open(path, 'rb') as f:
    content = f.read(20)
    print(f"First 20 bytes: {content}")
    print(f"Hex: {content.hex(' ')}")
