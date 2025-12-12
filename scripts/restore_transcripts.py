import os
import glob
import shutil

TRANSCRIPTS_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts"
BACKUP_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts\backup_old_versions"

def restore_transcripts():
    if not os.path.exists(BACKUP_DIR):
        print("Backup directory not found!")
        return

    # Get list of backups
    backups = glob.glob(os.path.join(BACKUP_DIR, "*.json"))
    print(f"Found {len(backups)} backup files.\n")
    
    restored = 0
    kept_new = 0
    
    # We want to restore backups.
    # If a backup exists, we want to use it instead of the current file.
    # Current files are named "N) Title.json"
    # Backup files are named "N) Title_diarized.json" (mostly)
    
    # Strategy:
    # 1. Move all backups to TRANSCRIPTS_DIR.
    # 2. Since the server prefers "_diarized.json" over ".json", 
    #    having both is technically fine, but messy.
    #    We should probably delete the .json version if we have a _diarized version for the same number.
    
    # Step 1: Restore
    for backup_path in backups:
        filename = os.path.basename(backup_path)
        dest_path = os.path.join(TRANSCRIPTS_DIR, filename)
        shutil.copy2(backup_path, dest_path)
        print(f"Restored: {filename}")
        restored += 1
        
    print(f"\nRestored {restored} files.")
    
    # Step 2: Cleanup redundant VTT-based files
    # Iterate through numbered files 1..52
    # If we have a _diarized version, delete the non-diarized version
    
    print("\nCleaning up redundant VTT files...")
    
    all_files = glob.glob(os.path.join(TRANSCRIPTS_DIR, "*.json"))
    
    # Group by number
    files_by_num = {}
    for f in all_files:
        basename = os.path.basename(f)
        try:
            num = int(basename.split(')')[0])
            if num not in files_by_num:
                files_by_num[num] = []
            files_by_num[num].append(f)
        except:
            pass
            
    removed = 0
    for num, files in files_by_num.items():
        has_diarized = any("_diarized.json" in f for f in files)
        
        if has_diarized:
            # Remove the non-diarized ones (the VTT ones we just made)
            for f in files:
                if "_diarized.json" not in f:
                    print(f"Removing redundant VTT: {os.path.basename(f)}")
                    os.remove(f)
                    removed += 1
        else:
            # We only have one version (likely the VTT one for missing files like 1-9)
            print(f"Keeping VTT (no backup available): {os.path.basename(files[0])}")
            kept_new += 1

    print(f"\nSummary:")
    print(f"- Restored {restored} diarized transcripts")
    print(f"- Removed {removed} redundant VTT transcripts")
    print(f"- Kept {kept_new} VTT transcripts (where no backup existed)")

if __name__ == "__main__":
    restore_transcripts()
