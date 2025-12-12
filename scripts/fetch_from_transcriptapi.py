import json
import os
import urllib.request
import urllib.error
import time

API_KEY = "sk_9R1pYXCzCLMk5Uz4feinjpCugUfVJ_E7lCsikaxHTtk"
LINKS_FILE = "messenger_audios/meta/messenger_audios_links.json"
OUTPUT_DIR = "messenger_audios/transcripts_api_raw"

def load_links():
    with open(LINKS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def fetch_transcript(video_url, video_id):
    url = f"https://transcriptapi.com/api/v2/youtube/transcript?video_url={video_url}&include_timestamp=true"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {API_KEY}")
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                return data
    except urllib.error.HTTPError as e:
        print(f"Error fetching {video_id}: {e.code} - {e.reason}")
        if e.code == 429:
            print("Rate limit hit. Waiting...")
            time.sleep(10)
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def main():
    links = load_links()
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"Found {len(links)} videos to process.")
    
    for title, url in links.items():
        # Extract ID only if needed, but API takes URL too.
        # We need ID for filename
        if "v=" in url:
            video_id = url.split("v=")[1].split("&")[0]
        else:
            video_id = url.split("/")[-1]
            
        output_file = os.path.join(OUTPUT_DIR, f"{video_id}.json")
        
        if os.path.exists(output_file):
            print(f"Skipping {title} ({video_id}) - already exists")
            continue
            
        print(f"Fetching {title} ({video_id})...")
        data = fetch_transcript(url, video_id)
        
        if data:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            print(f"Saved to {output_file}")
            # Rate limit is 200/min, roughly 3 per second. Sleeping slightly just to be safe.
            time.sleep(0.5)

if __name__ == "__main__":
    main()
