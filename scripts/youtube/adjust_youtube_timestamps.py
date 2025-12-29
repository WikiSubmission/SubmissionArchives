import json
import glob
import os

# Directory containing transcripts
TRANSCRIPTS_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts"

# Offset to add (in seconds)
OFFSET = -9.0  # Revert the 9 seconds we added (5 + 4)

def adjust_timestamps(transcript_path):
    """Add 5 seconds to all timestamps in a transcript"""
    
    with open(transcript_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Adjust segment timestamps
    if 'segments' in data:
        for seg in data['segments']:
            seg['start'] += OFFSET
            seg['end'] += OFFSET
            
            # Adjust word timestamps if present
            if 'words' in seg:
                for word in seg['words']:
                    if 'start' in word:
                        word['start'] += OFFSET
                    if 'end' in word:
                        word['end'] += OFFSET
    
    # Save adjusted transcript
    with open(transcript_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    return True

def main():
    # Find all transcript files
    transcript_files = glob.glob(os.path.join(TRANSCRIPTS_DIR, "*_diarized.json"))
    
    print(f"Found {len(transcript_files)} transcript files\n")
    
    adjusted = 0
    for transcript_path in transcript_files:
        filename = os.path.basename(transcript_path)
        
        try:
            adjust_timestamps(transcript_path)
            print(f"✓ Adjusted: {filename}")
            adjusted += 1
        except Exception as e:
            print(f"✗ Error with {filename}: {e}")
    
    print(f"\n✅ Adjusted {adjusted} out of {len(transcript_files)} transcripts")
    print(f"   Added {OFFSET} seconds to all timestamps")

if __name__ == "__main__":
    print("Adjusting YouTube transcript timestamps...\n")
    main()
