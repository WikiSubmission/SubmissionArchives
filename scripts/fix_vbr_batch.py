import os
import subprocess
import shutil

# Targeted directories
TARGET_DIRS = [
    r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies",
    r"c:\Users\Jonathan\Desktop\RKM\Messenger Sermons",
    r"c:\Users\Jonathan\Desktop\RKM\messenger_audios"
]

FFPROBE_CMD = ["ffprobe", "-v", "error", "-show_entries", "stream=bit_rate", "-of", "default=noprint_wrappers=1:nokey=1"]
FFMPEG_CMD_TEMPLATE = ["ffmpeg", "-y", "-i", "", "-codec:a", "libmp3lame", "-b:a", "128k", ""]

def is_cbr(file_path):
    """Checks if file is CBR 128k using ffprobe."""
    try:
        # If bitrate isn't exactly 128000 (allowing small variance if needed, but usually exact for CBR), it might be VBR
        # Actually VBR usually reports "N/A" or an average. 
        # Easier check: if we re-encode everything, we GUARANTEE consistency. 
        # But let's check current bitrate first to avoid redundant work if already 128k.
        result = subprocess.run(FFPROBE_CMD + [file_path], capture_output=True, text=True)
        if result.returncode != 0:
            return False
        
        bitrate = result.stdout.strip()
        # If bitrate is exactly 128000, it's likely already CBR 128k.
        return bitrate == "128000"
    except Exception as e:
        print(f"Error checking {file_path}: {e}")
        return False

def process_file(file_path):
    print(f"Checking: {os.path.basename(file_path)}...")
    
    if is_cbr(file_path):
        print(" -> Already CBR 128k. Skipping.")
        return

    print(" -> VBR detected (or non-128k). Re-encoding...")
    
    dir_name = os.path.dirname(file_path)
    file_name = os.path.basename(file_path)
    backup_path = os.path.join(dir_name, file_name + ".vbr_backup")
    temp_output = os.path.join(dir_name, "temp_cbr_" + file_name)

    # 1. Back up original
    if not os.path.exists(backup_path):
        shutil.copy2(file_path, backup_path)
    
    # 2. Re-encode to temp
    cmd = list(FFMPEG_CMD_TEMPLATE)
    cmd[3] = file_path   # Input
    cmd[-1] = temp_output # Output
    
    try:
        subprocess.run(cmd, check=True, stderr=subprocess.DEVNULL)
        
        # 3. Replace original
        shutil.move(temp_output, file_path)
        print(" -> Fixed!")
        
    except subprocess.CalledProcessError:
        print(" -> FAILED to re-encode.")
        if os.path.exists(temp_output):
            os.remove(temp_output)

def main():
    count = 0
    for root_dir in TARGET_DIRS:
        if not os.path.exists(root_dir):
            print(f"Directory not found: {root_dir}")
            continue
            
        print(f"\nScanning {root_dir}...")
        for root, dirs, files in os.walk(root_dir):
            for file in files:
                if file.lower().endswith(".mp3") and "backup" not in file.lower():
                    full_path = os.path.join(root, file)
                    process_file(full_path)
                    count += 1
    print(f"\nDone! Processed {count} files.")

if __name__ == "__main__":
    main()
