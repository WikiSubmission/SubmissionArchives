import os

VTT_PATH = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts_youtube_raw\22_-ApTJpCzxso.en-en-US.vtt"

def debug():
    print(f"Reading {VTT_PATH}...")
    try:
        with open(VTT_PATH, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                if i > 20: break
                print(f"Line {i}: {repr(line)}")
                print(f"  Has arrow: {'-->' in line}")
    except Exception as e:
        print(f"Error reading utf-8: {e}")
        
    print("-" * 20)
    
if __name__ == "__main__":
    debug()
