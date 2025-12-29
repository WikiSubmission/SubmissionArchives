import subprocess
import sys
import time

def main():
    start_time = time.time()
    for chapter in range(114, 115):
        print(f"\n[{time.strftime('%H:%M:%S')}] Processing Chapter {chapter}...")
        try:
            # Run the digitize script for this chapter
            # We use the same python interpreter
            cmd = [sys.executable, "scripts/digitize_chapter.py", "--chapter", str(chapter)]
            subprocess.run(cmd, check=True)
            
            print(f"[{time.strftime('%H:%M:%S')}] Chapter {chapter} COMPLETED.")
            
        except subprocess.CalledProcessError as e:
            print("\n" + "!" * 50)
            print(f"STOPPING: Error encountered in Chapter {chapter}.")
            print(f"Validation failed or script crashed. Exit code: {e.returncode}")
            print("!" * 50)
            sys.exit(1)
            
    total_time = time.time() - start_time
    print(f"\nAll 114 Chapters processed successfully in {total_time/60:.2f} minutes.")

if __name__ == "__main__":
    main()
