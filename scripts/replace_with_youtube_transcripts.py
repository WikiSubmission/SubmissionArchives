import json
import os
import glob
import shutil

# Directories
QURAN_STUDIES_TRANSCRIPTS = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts"
MESSENGER_AUDIOS_TRANSCRIPTS = r"c:\Users\Jonathan\Desktop\RKM\messenger_audios\transcripts"

def replace_transcripts(transcript_dir):
    """Replace old _diarized.json files with _youtube.json files"""
    youtube_files = glob.glob(os.path.join(transcript_dir, "*_youtube.json"))
    
    replaced = 0
    for youtube_path in youtube_files:
        basename = os.path.basename(youtube_path)
        # Get the base name without _youtube.json
        base = basename.replace("_youtube.json", "")
        
        # Find corresponding _diarized.json file
        diarized_path = os.path.join(transcript_dir, f"{base}_diarized.json")
        
        if os.path.exists(diarized_path):
            # Backup old file
            backup_path = os.path.join(transcript_dir, "backups", f"{base}_diarized.json.bak")
            os.makedirs(os.path.dirname(backup_path), exist_ok=True)
            
            # Only backup if not already backed up
            if not os.path.exists(backup_path):
                shutil.copy2(diarized_path, backup_path)
                print(f"  Backed up: {base}_diarized.json")
            
            # Replace with YouTube version
            shutil.copy2(youtube_path, diarized_path)
            replaced += 1
            print(f"  ✓ Replaced: {base}_diarized.json")
        else:
            # No existing diarized file, just rename youtube to diarized
            new_path = os.path.join(transcript_dir, f"{base}_diarized.json")
            shutil.copy2(youtube_path, new_path)
            replaced += 1
            print(f"  ✓ Created: {base}_diarized.json")
    
    return replaced

def main():
    print("Replacing Quran Studies transcripts...")
    quran_replaced = replace_transcripts(QURAN_STUDIES_TRANSCRIPTS)
    print(f"\n✓ Replaced {quran_replaced} Quran Studies transcripts\n")
    
    # Check if Messenger Audios has YouTube transcripts
    messenger_youtube = glob.glob(os.path.join(MESSENGER_AUDIOS_TRANSCRIPTS, "*_youtube.json"))
    if messenger_youtube:
        print("Replacing Messenger Audios transcripts...")
        messenger_replaced = replace_transcripts(MESSENGER_AUDIOS_TRANSCRIPTS)
        print(f"\n✓ Replaced {messenger_replaced} Messenger Audios transcripts")
    else:
        print("No YouTube transcripts found for Messenger Audios (expected)")
    
    print(f"\n✅ All transcripts updated with YouTube versions!")
    print(f"   Backups saved in transcripts/backups/ folders")

if __name__ == "__main__":
    main()
