
import os
import glob
import time
import datetime

# Configuration
QURAN_STUDIES_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts"
MESSENGER_AUDIO_DIR = r"c:\Users\Jonathan\Desktop\RKM\messenger_audios\transcripts"
DIGITIZATION_OUTPUT = r"c:\Users\Jonathan\Desktop\RKM\data\1989_tesseract.json"
CHAPTERS_DIR = r"c:\Users\Jonathan\Desktop\RKM\data\1989_chapters"

def get_file_info(path):
    if not os.path.exists(path):
        return "Not Created Yet"
    mtime = os.path.getmtime(path)
    dt = datetime.datetime.fromtimestamp(mtime)
    size = os.path.getsize(path) / 1024 # KB
    return f"Modified: {dt.strftime('%H:%M:%S')} ({size:.1f} KB)"

def count_aligned(directory):
    # Check for .json files that are distinct from original backups
    # Original naming: "1) ..._diarized.json"
    # Alignment overwrites them.
    # But we can check modification time?
    # Or check if ".bak_original_deepgram" exists? 
    # If backup exists, then the main json is arguably the aligned one (or interpolated).
    
    processed = 0
    total = 0
    recent_activity = []
    
    now = time.time()
    
    files = glob.glob(os.path.join(directory, "*.json"))
    total = len(files)
    
    for f in files:
        # Check if backup exists
        bak = f + ".bak_original_deepgram"
        # Or ".bak_interpolated"
        bak2 = f + ".bak_interpolated"
        
        if os.path.exists(bak) or os.path.exists(bak2):
            processed += 1
            # Check if recently touched (last 5 mins)
            mtime = os.path.getmtime(f)
            if now - mtime < 300:
                recent_activity.append(os.path.basename(f)[:30] + "...")
                
    return processed, total, recent_activity

def count_messenger_aligned():
    # These are NEW files being created.
    files = glob.glob(os.path.join(MESSENGER_AUDIO_DIR, "*.json"))
    current_count = len(files)
    
    # We expected ~14 files (from ~9 videos)
    # Just list them.
    recent = []
    now = time.time()
    for f in files:
        if now - os.path.getmtime(f) < 300:
            recent.append(os.path.basename(f))
            
    return current_count, recent

def main():
    print("=== RKM Progress Report ===")
    print(f"Time: {datetime.datetime.now().strftime('%H:%M:%S')}")
    print("-" * 40)
    
    # 1. Digitization
    print(f"1. PDF Digitization (1989 Quran):")
    print(f"   Legacy Output: {get_file_info(DIGITIZATION_OUTPUT)}")
    
    # Check Chapters
    if os.path.exists(CHAPTERS_DIR):
        chapters = glob.glob(os.path.join(CHAPTERS_DIR, "chapter_*.json"))
        print(f"   Extracted Chapters: {len(chapters)} / 114")
        if chapters:
             latest = max(chapters, key=os.path.getmtime)
             print(f"   Latest: {os.path.basename(latest)} ({get_file_info(latest)})")
    else:
        print(f"   Extracted Chapters: 0 (Directory not found)")
    print("-" * 40)
    
    # 2. Quran Studies Alignment
    done, total, recent = count_aligned(QURAN_STUDIES_DIR)
    print(f"2. Quran Studies Transcript Alignment:")
    print(f"   Progress: {done} / 52 (approx)")
    if recent:
        print(f"   Recently Updated:")
        for r in recent:
            print(f"     - {r}")
    else:
        print("   (No updates in last 5 minutes)")
    print("-" * 40)
    
    # 3. Messenger Audio
    m_count, m_recent = count_messenger_aligned()
    print(f"3. Messenger Audio Transcripts:")
    print(f"   Files Created: {m_count}")
    if m_recent:
        print(f"   Recently Created:")
        for r in m_recent:
            print(f"     - {r}")
    print("=" * 40)

if __name__ == "__main__":
    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        main()
        print("\nRefreshing in 10 seconds... (Ctrl+C to stop)")
        time.sleep(10)
