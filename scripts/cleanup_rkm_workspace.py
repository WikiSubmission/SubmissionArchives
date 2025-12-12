import os
import shutil
import glob

ROOT_DIR = r"c:\Users\Jonathan\Desktop\RKM"
SCRIPTS_DIR = os.path.join(ROOT_DIR, "scripts")
LOGS_DIR = os.path.join(ROOT_DIR, "logs")
DATA_DIR = os.path.join(ROOT_DIR, "data")

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def cleanup_root():
    ensure_dir(LOGS_DIR)
    ensure_dir(DATA_DIR)
    
    # 1. Delete Debug Text/Images
    patterns_to_delete = [
        "debug_*.txt",
        "debug_*.jpg",
        "debug_*.png",
        "surya_*.txt",
        "verify_*.txt",
        "temp_subs"
    ]
    
    print("--- Cleaning Root ---")
    for pat in patterns_to_delete:
        full_pat = os.path.join(ROOT_DIR, pat)
        items = glob.glob(full_pat)
        for item in items:
            try:
                if os.path.isdir(item):
                    shutil.rmtree(item)
                else:
                    os.remove(item)
                print(f"Deleted: {os.path.basename(item)}")
            except Exception as e:
                print(f"Failed to delete {item}: {e}")

    # 2. Move Logs
    logs = glob.glob(os.path.join(ROOT_DIR, "*.log"))
    for log in logs:
        try:
            shutil.move(log, os.path.join(LOGS_DIR, os.path.basename(log)))
            print(f"Moved log: {os.path.basename(log)}")
        except: pass

    # 3. Move Data/Meta
    data_files = ["playlist_info.json", "subs_info.txt", "file_list.txt", "media_audit_report.txt"]
    for f in data_files:
        src = os.path.join(ROOT_DIR, f)
        if os.path.exists(src):
            try:
                shutil.move(src, os.path.join(DATA_DIR, f))
                print(f"Moved data: {f}")
            except: pass

def cleanup_scripts():
    print("\n--- Cleaning Scripts ---")
    archive_dir = os.path.join(SCRIPTS_DIR, "archive")
    debug_dir = os.path.join(SCRIPTS_DIR, "debug")
    tests_dir = os.path.join(SCRIPTS_DIR, "tests")
    ensure_dir(archive_dir)
    ensure_dir(debug_dir)
    ensure_dir(tests_dir)
    
    # Move Debug Scripts
    debugs = glob.glob(os.path.join(SCRIPTS_DIR, "debug_*.py"))
    for d in debugs:
        try:
            shutil.move(d, os.path.join(debug_dir, os.path.basename(d)))
            print(f"Archived Debug: {os.path.basename(d)}")
        except: pass

    # Move Test Scripts
    tests = glob.glob(os.path.join(SCRIPTS_DIR, "test_*.py"))
    for t in tests:
        try:
            shutil.move(t, os.path.join(tests_dir, os.path.basename(t)))
            print(f"Moved Test: {os.path.basename(t)}")
        except: pass

    # Move One-Off/Cleanup Scripts to Archive
    one_offs = [
        "propose_renaming.py", "rename_sermons.py", "delete_vp_sermons_transcripts.py",
        "fix_file_32.py", "fix_transcripts_robust.py", "check_missing_audio.py",
        "check_missing_number.py", "cleanup_mess.py", "cleanup_transcripts.py",
        "cleanup_weird_audios.py", "cleanup_workspace.py"
    ]
    for f in one_offs:
        src = os.path.join(SCRIPTS_DIR, f)
        if os.path.exists(src):
            try:
                shutil.move(src, os.path.join(archive_dir, f))
                print(f"Archived: {f}")
            except: pass

if __name__ == "__main__":
    cleanup_root()
    cleanup_scripts()
