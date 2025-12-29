import os
import shutil
import re

CORRECTED_DIR = r"c:\Users\Jonathan\Desktop\RKM\corrected_transcripts"
TARGET_DIRS = [
    r"c:\Users\Jonathan\Desktop\RKM\Messenger Video Programs\transcripts",
    r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts",
    r"c:\Users\Jonathan\Desktop\RKM\messenger_audios\transcripts"
]

def main():
    if not os.path.exists(CORRECTED_DIR):
        print(f"Corrected dir not found: {CORRECTED_DIR}")
        return

    files = os.listdir(CORRECTED_DIR)
    deployed_count = 0
    
    # Mapping for video files explicitly
    explicit_map = {
        # Not strictly needed if filenames match, but "What Is Life All About_diarized_corrected.json"
        # should map to "What Is Life All About_diarized.json"
    }

    print(f"Deploying {len(files)} transcripts...")
    
    for filename in files:
        if not filename.endswith('_corrected.json'):
            continue
            
        # Determine original filename: remove "_corrected"
        original_name = filename.replace('_corrected.json', '.json')
        
        # Find where this file lives
        target_path = None
        for d in TARGET_DIRS:
            candidate = os.path.join(d, original_name)
            if os.path.exists(candidate):
                target_path = candidate
                break
        
        if target_path:
            # Backup
            backup_path = target_path + ".bak_pre_alignment"
            if not os.path.exists(backup_path):
                shutil.copy2(target_path, backup_path)
                print(f"  Backed up: {os.path.basename(backup_path)}")
            
            # Copy corrected over original
            src_path = os.path.join(CORRECTED_DIR, filename)
            shutil.copy2(src_path, target_path)
            print(f"  Deployed: {os.path.basename(target_path)}")
            deployed_count += 1
        else:
            print(f"  SKIPPED: Could not find original location for {original_name}")

    print(f"\nDeployment Complete. {deployed_count} files updated.")

if __name__ == "__main__":
    main()
