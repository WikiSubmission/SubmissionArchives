import os
import glob
import shutil

# Directories
YOUTUBE_AUDIO_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\youtube_audio"
VTT_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts_youtube_raw"
TRANSCRIPTS_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts"
TARGET_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies"

def replace_audio_files():
    """Replace original audio files with YouTube audio"""
    
    # Get all VTT files (format: XX_YOUTUBE_ID.en-US.vtt)
    vtt_files = glob.glob(os.path.join(VTT_DIR, "*_*.en-US.vtt"))
    
    print(f"Found {len(vtt_files)} VTT files to process\n")
    
    replaced = 0
    skipped = 0
    
    for vtt_path in vtt_files:
        basename = os.path.basename(vtt_path)
        
        # Extract number and YouTube ID
        parts = basename.split('_', 1)
        if len(parts) < 2:
            continue
        
        number = parts[0]
        youtube_id = parts[1].split('.en')[0]
        
        # Strip leading zeros (e.g., "01" -> "1")
        number = str(int(number))
        
        # Find corresponding transcript file (try both _diarized.json and _youtube.json)
        transcript_pattern_diarized = os.path.join(TRANSCRIPTS_DIR, f"{number}) *_diarized.json")
        transcript_pattern_youtube = os.path.join(TRANSCRIPTS_DIR, f"{number}) *_youtube.json")
        
        transcript_files = glob.glob(transcript_pattern_diarized)
        if not transcript_files:
            transcript_files = glob.glob(transcript_pattern_youtube)
        
        if not transcript_files:
            print(f"⚠ No transcript for {number}")
            skipped += 1
            continue
        
        # Get the target audio filename (same as transcript but .mp3)
        transcript_name = os.path.basename(transcript_files[0])
        transcript_name = transcript_name.replace('_diarized.json', '.mp3').replace('_youtube.json', '.mp3')
        target_audio = os.path.join(TARGET_DIR, transcript_name)
        
        # Find YouTube audio file
        youtube_audio = os.path.join(YOUTUBE_AUDIO_DIR, f"{youtube_id}.mp3")
        
        if not os.path.exists(youtube_audio):
            print(f"⚠ YouTube audio not found: {youtube_id}.mp3")
            skipped += 1
            continue
        
        # Delete old audio if exists
        if os.path.exists(target_audio):
            os.remove(target_audio)
        
        # Copy YouTube audio to target location
        shutil.copy2(youtube_audio, target_audio)
        
        print(f"✓ {number}) {youtube_id}.mp3 → {transcript_name}")
        replaced += 1
    
    print(f"\n✅ Replaced {replaced} audio files")
    print(f"   Skipped {skipped} files")

if __name__ == "__main__":
    print("Replacing audio files with YouTube audio...\n")
    replace_audio_files()
