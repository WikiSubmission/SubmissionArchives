import json
import os
import subprocess

LINKS_FILE = "messenger_audios/meta/messenger_audios_links.json"
OUTPUT_DIR = "messenger_audios/transcripts_youtube_raw"

def load_links():
    with open(LINKS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def fetch_subs():
    links = load_links()
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"Fetching subtitles for {len(links)} videos...")
    
    for title, url in links.items():
        # video_id = url.split("v=")[-1]
        # We want to save them with a name we can map back.
        # But yt-dlp naming can be tricky with subs.
        # Let's use the ID as filename for the raw VTT
        
        print(f"Processing {title}...")
        
        cmd = [
            "yt-dlp",
            "--write-sub",
            "--sub-lang", "en,en-US",
            "--skip-download",
            "-o", os.path.join(OUTPUT_DIR, "%(id)s.%(ext)s"),
            url
        ]
        
        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Failed for {url}: {e}")

if __name__ == "__main__":
    fetch_subs()
