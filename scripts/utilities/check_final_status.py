import os
import glob
import re

AUDIO_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies"

def check_files():
    # Get all mp3 files
    mp3_files = sorted(glob.glob(os.path.join(AUDIO_DIR, "*.mp3")))
    
    print(f"Checking {len(mp3_files)} MP3 files:\n")
    
    weird_files = []
    standard_pattern = re.compile(r'^\d+\)\s+.*\.mp3$')
    
    seen_numbers = {}
    
    for file_path in mp3_files:
        filename = os.path.basename(file_path)
        
        if not standard_pattern.match(filename):
            print(f"⚠️ WEIRD: {filename}")
            weird_files.append(filename)
            continue
            
        try:
            num = int(filename.split(')')[0])
            if num > 52:
                print(f"⚠️ HIGH NUMBER: {filename}")
                weird_files.append(filename)
                
            if num in seen_numbers:
                print(f"⚠️ DUPLICATE NUMBER {num}:")
                print(f"  1: {seen_numbers[num]}")
                print(f"  2: {filename}")
                weird_files.append(filename)
            else:
                seen_numbers[num] = filename
        except:
            pass

    if not weird_files:
        print("\n✅ All files look standard (numbered 1-52).")
        print(f"Total files: {len(mp3_files)}")
    else:
        print(f"\n❌ Found {len(weird_files)} anomalies.")
        
if __name__ == "__main__":
    check_files()
