
import json
import os
import subprocess
import time

# Configuration
LINKS_FILE = "messenger_audios/meta/messenger_audios_links.json"
MAP_FILE = "messenger_audios/messenger_audio_map.json"
OUTPUT_DIR = "messenger_audios"

# yt-dlp options for audio only
YT_OPTS = [
    "yt-dlp",
    "-f", "bestaudio[ext=m4a]/bestaudio/best",
    "-x", "--audio-format", "mp3", 
    "--audio-quality", "0", # Best quality
    "--retries", "10",
    "--fragment-retries", "10",
]

def load_links():
    with open(LINKS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_map():
    if os.path.exists(MAP_FILE):
        with open(MAP_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_map(data):
    with open(MAP_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

def download_audio(url, target_filename):
    """
    Downloads audio from url and saves it as target_filename in OUTPUT_DIR.
    """
    print(f"Downloading {target_filename} from {url}")
    target_path = os.path.join(OUTPUT_DIR, target_filename)
    
    # We use a temporary template, then rename
    temp_template = os.path.join(OUTPUT_DIR, "temp_download_%(id)s.%(ext)s")
    
    cmd = YT_OPTS + ["-o", temp_template, url]
    
    try:
        subprocess.run(cmd, check=True)
        
        # Find the file we just downloaded (it might have a different ID if we didn't capture it)
        # Actually yt-dlp with -o needs careful handling. 
        # Safer: download to temp name, then rename.
        # But we don't know the exact ID for the wildcard.
        # Let's use the video ID from URL if possible, or just standard output.
        
        # Simpler approach: Use the filename directly in output template?
        # yt-dlp might complain about converting extension.
        # Let's try downloading to a specific name without extension, let yt-dlp add it, then rename/convert?
        # Since we use --audio-format mp3, it should result in .mp3
        
        # Re-construct command for precise output
        base_name = os.path.splitext(target_filename)[0]
        final_path = os.path.join(OUTPUT_DIR, base_name + ".mp3") # We want .mp3
        
        # If file exists, skip? Or overwrite? User said update, so overwrite.
        if os.path.exists(final_path):
             print(f"Removing existing {final_path}")
             os.remove(final_path)

        cmd = YT_OPTS + ["-o", os.path.join(OUTPUT_DIR, base_name + ".%(ext)s"), url]
        subprocess.run(cmd, check=True)
        
        print(f"Success: {final_path}")
        return True
    
    except subprocess.CalledProcessError as e:
        print(f"Failed to download {url}: {e}")
        return False

def update_map(existing_map, title, url):
    """
    Update the map entry for this video.
    """
    video_id = url.split("v=")[-1]
    
    # Check if ID exists
    for entry in existing_map:
        if entry['youtube_id'] == video_id:
            return # Already mapped
            
    # If not mapped, creating new entry?
    # The keys in links.json are like "Messenger Audio | 2", which corresponds to filenames "Messenger Audio ｜ 2.mp3"
    # Note the pipe character difference! stored JSON has '|', existing files use '｜' (fullwidth)
    
    # Normalize title to filename
    # We need to match the key from links.json to the filename on disk or desired filename.
    # The keys in links.json seem to match the DESIRED filename structure (roughly).
    
    # Start with key -> filename
    filename = title.replace("|", "｜") + ".mp3" # Replace pipe with fullwidth pipe if that's the convention
    
    # Add to map
    existing_map.append({
        "audio_files": [filename],
        "youtube_id": video_id
    })

def process_item(item):
    """Worker function for parallel processing"""
    title, url = item
    filename = title.replace("|", "｜") + ".mp3"
    
    if download_audio(url, filename):
        return (title, url)
    return None

def main():
    links = load_links()
    existing_map = load_map()
    
    # Pre-calculate items
    items = list(links.items())
    print(f"Starting parallel download for {len(items)} items...")
    
    failed = []
    success_count = 0
    
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    # Use 5 workers to be safe/polite but faster
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_url = {executor.submit(process_item, item): item for item in items}
        
        for future in as_completed(future_to_url):
            try:
                result = future.result()
                if result:
                    title, url = result
                    # We need to protect map update if we were writing parallel, 
                    # but here we are in main thread gathering results.
                    # HOWEVER, map updating in `process_item` (if we moved it there) would need lock.
                    # Current design: `process_item` returns data, main thread updates map.
                    update_map(existing_map, title, url)
                    success_count += 1
                else:
                    failed.append(future_to_url[future])
            except Exception as e:
                print(f"Exception in worker: {e}")
                
    save_map(existing_map)
    print(f"Finished. Processed {success_count} files. Failed: {len(failed)}")

if __name__ == "__main__":
    main()
