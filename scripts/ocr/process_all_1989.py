import multiprocessing
import subprocess
import os
import time

def process_chapter(ch):
    print(f"Starting Chapter {ch}...")
    try:
        subprocess.run(["python", r"scripts\fix_1989_chapter.py", "--chapter", str(ch)], check=True, capture_output=True)
        print(f"Finished Chapter {ch}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error checking Chapter {ch}: {e.stderr.decode()}")
        return False

def main():
    chapters = list(range(1, 115))
    # We already did 1 and 2, but running again is fine (idempotent)
    
    print(f"Batch Processing {len(chapters)} chapters...")
    start_time = time.time()
    
    # Python's multiprocessing Pool
    # Limit to 4-6 processes effectively to avoid OS lag
    with multiprocessing.Pool(processes=6) as pool:
        pool.map(process_chapter, chapters)
        
    end_time = time.time()
    print(f"Batch completed in {end_time - start_time:.2f} seconds.")

if __name__ == "__main__":
    main()
