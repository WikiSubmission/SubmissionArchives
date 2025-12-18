import multiprocessing
import subprocess
import os
import time

def process_chapter(ch):
    print(f"Starting Chapter {ch}...")
    try:
        subprocess.run(["python", r"scripts\digitize_1981.py", "--chapter", str(ch)], check=True, capture_output=True)
        print(f"Finished Chapter {ch}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error checking Chapter {ch}: {e.stderr.decode()}")
        return False

def main():
    chapters = list(range(1, 115))
    
    print(f"Batch Processing {len(chapters)} chapters for 1981...")
    start_time = time.time()
    
    # Limit to 4-6 processes
    with multiprocessing.Pool(processes=6) as pool:
        pool.map(process_chapter, chapters)
        
    end_time = time.time()
    print(f"Batch completed in {end_time - start_time:.2f} seconds.")

if __name__ == "__main__":
    main()
