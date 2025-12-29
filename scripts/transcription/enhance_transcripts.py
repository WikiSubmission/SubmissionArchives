import os
import json
import glob

VTT_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts_youtube_raw"
TRANSCRIPTS_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts"

TARGETS = {
    "22": "22) Quran Study Sura 39_11 by Rashad Khalifa, Admission Test-I don't compromise with a little ins ....json",
    "32": "32) Quran Study (YouTube) - Rashad Khalifa.json"
}

def parse_vtt_time(time_str):
    parts = time_str.split(':')
    seconds = 0
    if len(parts) == 3:
        seconds += int(parts[0]) * 3600
        seconds += int(parts[1]) * 60
        seconds += float(parts[2])
    elif len(parts) == 2:
        seconds += int(parts[0]) * 60
        seconds += float(parts[1])
    return seconds

def enhance_transcript(number, filename):
    # Find matching VTT
    pattern = os.path.join(VTT_DIR, f"{number}_*.vtt")
    vtt_files = glob.glob(pattern)
    
    if not vtt_files:
        print(f"✗ VTT for {number} not found!")
        return

    vtt_path = vtt_files[0]
    print(f"Processing {os.path.basename(vtt_path)}...")
    
    segments = []
    current_segment = None
    
    with open(vtt_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line: continue
            if '-->' in line:
                times = line.split(' --> ')
                start = parse_vtt_time(times[0])
                end = parse_vtt_time(times[1].split()[0])
                current_segment = {'start': start, 'end': end, 'text': '', 'speaker': 'Dr. Khalifa'} # Adding Speaker!
            elif current_segment:
                current_segment['text'] = line
                segments.append(current_segment)
                current_segment = None
    
    output_path = os.path.join(TRANSCRIPTS_DIR, filename)
    
    # Check if we should backup existing
    if os.path.exists(output_path):
        base, ext = os.path.splitext(output_path)
        os.replace(output_path, f"{base}_backup{ext}")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({"segments": segments}, f, indent=2, ensure_ascii=False)
        
    print(f"✓ Created enhanced transcript: {filename}")
    print(f"  - Segments: {len(segments)}")
    print(f"  - Speaker set to 'Dr. Khalifa' (Yellow Highlight)")

def main():
    print("Enhancing transcripts for 22 and 32...\n")
    for num, filename in TARGETS.items():
        enhance_transcript(num, filename)

if __name__ == "__main__":
    main()
