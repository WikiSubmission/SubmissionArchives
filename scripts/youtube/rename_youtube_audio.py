import os
import glob
import shutil

# Directories
YOUTUBE_AUDIO_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\youtube_audio"
VTT_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts_youtube_raw"
TRANSCRIPTS_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts"
OUTPUT_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\youtube_audio_renamed"

def map_youtube_to_transcript():
    """Map YouTube IDs to transcript file names"""
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Get all VTT files (format: XX_YOUTUBE_ID.en-US.vtt)
    vtt_files = glob.glob(os.path.join(VTT_DIR, "*_*.en-US.vtt"))
    
    print(f"Found {len(vtt_files)} VTT files\n")
    
    copied = 0
    for vtt_path in vtt_files:
        basename = os.path.basename(vtt_path)
        
        # Extract number and YouTube ID
        # Format: XX_YOUTUBE_ID.en-US.vtt
        parts = basename.split('_', 1)
        if len(parts) < 2:
            continue
        
        number = parts[0]
        youtube_id = parts[1].split('.en')[0]
        
        # Find corresponding transcript file
        transcript_pattern = os.path.join(TRANSCRIPTS_DIR, f"{number}) *.json")
        transcript_files = glob.glob(transcript_pattern)
        
        if not transcript_files:
            print(f"⚠ No transcript found for {number}")
            continue
        
        transcript_path = transcript_files[0]
        transcript_name = os.path.basename(transcript_path).replace('_diarized.json', '.mp3')
        
        # Find YouTube audio file
        youtube_audio = os.path.join(YOUTUBE_AUDIO_DIR, f"{youtube_id}.mp3")
        
        if not os.path.exists(youtube_audio):
            print(f"⚠ YouTube audio not found: {youtube_id}.mp3")
            continue
        
        # Copy and rename
        output_path = os.path.join(OUTPUT_DIR, transcript_name)
        shutil.copy2(youtube_audio, output_path)
        
        print(f"✓ {number}) {youtube_id}.mp3 → {transcript_name}")
        copied += 1
    
    print(f"\n✅ Copied and renamed {copied} audio files")
    print(f"   Files saved to: {OUTPUT_DIR}")
    print(f"\n   Next step: Copy these files to 'Messenger Quran Studies' folder")

if __name__ == "__main__":
    print("Mapping YouTube audio to transcript file names...\n")
    map_youtube_to_transcript()
