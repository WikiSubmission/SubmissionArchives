import os

LOG_PATH = r"c:\Users\Jonathan\Desktop\RKM\debug_ch2_break.txt"

def main():
    if not os.path.exists(LOG_PATH):
        print("Log file not found.")
        return

    try:
        with open(LOG_PATH, 'r', encoding='utf-16') as f:
            lines = f.readlines()
    except:
        with open(LOG_PATH, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            
    for i, line in enumerate(lines):
        if "DEBUG:" in line:
            print(f"Line {i}: {line.strip()}")
            # Print context
            print(f"Context: {lines[i-1].strip() if i>0 else ''}")
            print(f"         {lines[i+1].strip() if i+1<len(lines) else ''}")

if __name__ == "__main__":
    main()
