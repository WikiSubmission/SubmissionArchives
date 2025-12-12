import json
import os
import subprocess
import time
import random

def download_audios():
    json_file = 'Messenger Quran Studies/quran_studies_links.json'
    output_dir = 'Messenger Quran Studies'
    
    with open(json_file, 'r', encoding='utf-8') as f:
        links = json.load(f)
        
    print(f"Found {len(links)} items to process.")
    
    started = False
    start_marker = "36)"
    
    for title, url in links.items():
        if not started:
            if title.startswith(start_marker):
                started = True
            else:
                continue

        # Sanitize title for filename check (simplified, yt-dlp handles complex sanitation)
        # We will let yt-dlp manage the check mostly, or check existence loosely.
        # Ideally, we just run yt-dlp for each. It's smart enough to skip if file exists 
        # IF we formatted the filename exactly the same.
        
        # But to be safe and avoid re-download cost if possible, we rely on yt-dlp's download archive 
        # or just let it run. It checks file existence quickly.
        
        print(f"Processing: {title}")
        cmd = [
            'yt-dlp',
            '--cookies', 'cookies.txt',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            '--referer', 'https://www.youtube.com/',
            '-f', 'bestaudio/best',
            '-x', '--audio-format', 'mp3',
            '-o', f'{output_dir}/%(title)s.%(ext)s',
            url
        ]
        
        try:
            # Run and capture output to prevent massive log spam, but print error if fails
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                print(f"Failed to download {title}: {result.stderr}")
            else:
                print(f"Success: {title}")
                
            # Rate limiting as suggested by documentation
            # Sleep 3-7 seconds between downloads (Speeding up as requested)
            sleep_time = random.uniform(3, 7)
            print(f"Sleeping for {sleep_time:.2f} seconds...")
            time.sleep(sleep_time)
            
        except Exception as e:
            print(f"Error executing command for {title}: {e}")

if __name__ == "__main__":
    download_audios()
