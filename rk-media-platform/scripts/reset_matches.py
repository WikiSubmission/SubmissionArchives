
import os
import shutil

TRANSCRIPT_DIR = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\rk-media-platform\transcripts"
PROCESSED_DIR = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\rk-media-platform\transcripts\processed"
RECOVERY_DIR = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\rk-media-platform\recovery_output"

def reset_files():
    print("Starting Reset Process...")
    
    # 1. Restore transcripts from processed/ to transcripts/
    if os.path.exists(PROCESSED_DIR):
        files = os.listdir(PROCESSED_DIR)
        print(f"Restoring {len(files)} files from {PROCESSED_DIR}...")
        for f in files:
            src = os.path.join(PROCESSED_DIR, f)
            dest = os.path.join(TRANSCRIPT_DIR, f)
            try:
                # Move back
                shutil.move(src, dest)
                print(f"Restored: {f}")
            except Exception as e:
                print(f"Error restoring {f}: {e}")
        
        # Remove processed dir
        try:
            os.rmdir(PROCESSED_DIR)
            print("Removed processed directory.")
        except:
            print("Could not remove processed directory (might not be empty).")
    else:
        print("No processed directory found. Skipping restore.")

    # 2. Clear recovery_output
    if os.path.exists(RECOVERY_DIR):
        print(f"Cleaning up {RECOVERY_DIR}...")
        files = os.listdir(RECOVERY_DIR)
        for f in files:
            # Only delete JSONs we likely created? 
            # User might have other stuff there. 
            # The tool creates "N) Quran Study....json".
            if f.endswith(".json") and "Quran Study" in f:
                path = os.path.join(RECOVERY_DIR, f)
                try:
                    os.remove(path)
                    print(f"Deleted: {f}")
                except Exception as e:
                    print(f"Error deleting {f}: {e}")
    
    print("Reset Complete.")

if __name__ == "__main__":
    reset_files()
