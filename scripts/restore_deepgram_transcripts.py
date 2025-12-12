import os
import shutil
import glob

# Directories
QURAN_STUDIES_TRANSCRIPTS = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts"
QURAN_STUDIES_BACKUPS = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts\backups"

def restore_deepgram_transcripts():
    """Restore original Deepgram transcripts with accurate timestamps"""
    
    # Find all original Deepgram backups
    deepgram_backups = glob.glob(os.path.join(QURAN_STUDIES_BACKUPS, "*_original_deepgram"))
    
    print(f"Found {len(deepgram_backups)} Deepgram backup files\n")
    
    restored = 0
    for backup_path in deepgram_backups:
        # Extract the base filename
        backup_name = os.path.basename(backup_path)
        # Remove the _original_deepgram suffix
        original_name = backup_name.replace("_original_deepgram", "")
        
        # Target path in transcripts folder
        target_path = os.path.join(QURAN_STUDIES_TRANSCRIPTS, original_name)
        
        # Copy the Deepgram backup to replace the YouTube transcript
        shutil.copy2(backup_path, target_path)
        print(f"✓ Restored: {original_name}")
        restored += 1
    
    print(f"\n✅ Restored {restored} Deepgram transcripts with accurate timestamps")
    print(f"   Note: Speaker labels are generic (SPEAKER_00, SPEAKER_01, etc.)")
    print(f"   Use the verifier to rename speakers and save changes")

if __name__ == "__main__":
    print("Restoring Deepgram transcripts with accurate timestamps...\n")
    restore_deepgram_transcripts()
