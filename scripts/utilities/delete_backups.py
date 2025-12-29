import os
import glob

ROOT = r"c:\Users\Jonathan\Desktop\RKM"

def delete_backups():
    print("--- Deleting Backup Files ---")
    
    # Recursive walk
    count = 0
    for root, dirs, files in os.walk(ROOT):
        # Skip .git expressly
        if ".git" in root: continue
        
        for f in files:
            if f.endswith(".bak") or ".bak_" in f or "_interpolated" in f:
                full_path = os.path.join(root, f)
                try:
                    os.remove(full_path)
                    print(f"Deleted: {f}")
                    count += 1
                except Exception as e:
                    print(f"Failed to delete {f}: {e}")
                    
    print(f"Total Deleted: {count}")

if __name__ == "__main__":
    delete_backups()
