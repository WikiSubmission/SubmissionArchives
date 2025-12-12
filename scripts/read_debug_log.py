import chardet

LOG_PATH = r"c:\Users\Jonathan\Desktop\RKM\debug_ch98.txt"

def main():
    try:
        # Try UTF-16LE first (Powershell default)
        with open(LOG_PATH, 'r', encoding='utf-16') as f:
            content = f.read()
    except Exception:
        # Fallback
        with open(LOG_PATH, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

    lines = content.split('\n')
    print(f"DEBUG: Read {len(lines)} lines from {LOG_PATH}")
    
    printing = False
    for line in lines:
        if "PAGE 618 DUMP" in line:
            printing = True
            print(line.strip())
        
        if printing:
            print(line.strip())
            if "--------" in line and "DUMP" not in line: # End identifier
                printing = False

if __name__ == "__main__":
    main()
