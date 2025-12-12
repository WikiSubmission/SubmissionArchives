import os
import glob

VTT_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts_youtube_raw"
OUTPUT_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts"
AUDIO_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies"

# Get all VTT files (prefer en-US)
vtt_files = glob.glob(os.path.join(VTT_DIR, "*.vtt"))
vtt_map = {}
for vtt_path in vtt_files:
    basename = os.path.basename(vtt_path)
    match = __import__('re').match(r'(\d+)_', basename)
    if match:
        num = match.group(1)
        if '.en-US.vtt' in basename and '.en-en-US.vtt' not in basename:
            vtt_map[num] = vtt_path
        elif num not in vtt_map:
            vtt_map[num] = vtt_path

# Get all audio files
audio_files = glob.glob(os.path.join(AUDIO_DIR, "*.mp3"))

print(f"Total VTT files: {len(vtt_map)}")
print(f"Total audio files: {len(audio_files)}\n")

# Check which VTT files didn't get converted
missing = []
for num in sorted(vtt_map.keys()):
    # Try both patterns
    audio_match = []
    audio_match = glob.glob(os.path.join(AUDIO_DIR, f"{int(num)})*"))
    if not audio_match:
        audio_match = glob.glob(os.path.join(AUDIO_DIR, f"{num})*"))
    
    if not audio_match:
        missing.append(num)
        print(f"Missing audio for VTT #{num}: {os.path.basename(vtt_map[num])}")

print(f"\nTotal missing: {len(missing)}")
