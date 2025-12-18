import subprocess
import os

def main():
    print("Re-extracting 1981 Chapter 114...")
    # Using existing digitize_1981.py which uses the map we just updated
    cmd = ["python", r"scripts\digitize_1981.py", "--chapter", "114"]
    subprocess.run(cmd, check=True)
    print("Extraction Complete.")

if __name__ == "__main__":
    main()
