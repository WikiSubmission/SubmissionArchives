import os
import glob

VTT_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts_youtube_raw"
TRANSCRIPTS_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts"

# Get all VTT files
vtt_files = glob.glob(os.path.join(VTT_DIR, "*_*.en-US.vtt"))

print("VTT files without matching transcripts:\n")

missing = []
for vtt_path in vtt_files:
    basename = os.path.basename(vtt_path)
    parts = basename.split('_', 1)
    if len(parts) < 2:
        continue
    
    number = parts[0]
    youtube_id = parts[1].split('.en')[0]
    
    # Check if transcript exists
    transcript_pattern = os.path.join(TRANSCRIPTS_DIR, f"{number}) *.json")
    transcript_files = glob.glob(transcript_pattern)
    
    if not transcript_files:
        missing.append((number, youtube_id, basename))
        print(f"  {number}) YouTube ID: {youtube_id}")
        print(f"      VTT file: {basename}")
        print()

print(f"\nTotal missing: {len(missing)} out of {len(vtt_files)} VTT files")

# Check if we have the YouTube audio for these
YOUTUBE_AUDIO_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\youtube_audio"
print("\nYouTube audio availability:")
for number, youtube_id, vtt_name in missing:
    audio_file = os.path.join(YOUTUBE_AUDIO_DIR, f"{youtube_id}.mp3")
    status = "✓ Audio exists" if os.path.exists(audio_file) else "✗ Audio missing"
    print(f"  {number}) {youtube_id}: {status}")
