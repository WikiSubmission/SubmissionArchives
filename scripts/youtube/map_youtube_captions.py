import json
import os
import re

PLAYLIST_FILE = "playlist_info.json"
AUDIO_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies"

def load_playlist():
    videos = []
    with open(PLAYLIST_FILE, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if line.strip():
                try:
                    videos.append(json.loads(line))
                except:
                    pass
    return videos

def get_local_files():
    files = {}
    for f in os.listdir(AUDIO_DIR):
        if not f.endswith(".mp3"): continue
        # Match "1) ..." or "52) ..."
        m = re.match(r'^(\d+)[).]', f)
        if m:
            idx = int(m.group(1))
            files[idx] = f
    return files

def main():
    videos = load_playlist()
    local_files = get_local_files()
    
    print(f"Found {len(videos)} videos in playlist.")
    print(f"Found {len(local_files)} local files.")
    
    # Assuming playlist order matches 1..N
    # Video 0 -> Index 1
    
    mapping = []
    
    for i, vid in enumerate(videos):
        idx = i + 1
        local_f = local_files.get(idx, "MISSING")
        
        print(f"{idx:02d} | {vid['id']} | {local_f[:40]:<40} | {vid.get('title', '')[:40]}")
        
        if local_f != "MISSING":
            mapping.append({
                'index': idx,
                'video_id': vid['id'],
                'video_title': vid.get('title', ''),
                'local_file': local_f
            })
            
    # Check for extra local files
    for k in local_files:
        if k > len(videos):
            print(f"WARNING: Local file {k} has no playlist entry: {local_files[k]}")

    # Save mapping for next step
    with open("caption_mapping.json", "w") as f:
        json.dump(mapping, f, indent=2)

if __name__ == "__main__":
    main()
