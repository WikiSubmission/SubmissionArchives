import json
import os

LINKS_FILE = "messenger_audios/meta/messenger_audios_links.json"
MAP_FILE = "messenger_audios/messenger_audio_map.json"

def main():
    with open(LINKS_FILE, 'r', encoding='utf-8') as f:
        links = json.load(f)
        
    new_map = []
    
    for title, url in links.items():
        # video_id = url.split("v=")[-1]
        # logic from update script
        if "v=" in url:
            video_id = url.split("v=")[-1].split("&")[0]
        else:
            video_id = url.split("/")[-1]
            
        filename = title.replace("|", "｜") + ".mp3"
        
        new_map.append({
            "audio_files": [filename],
            "youtube_id": video_id
        })
        
    print(f"Reconstructed map with {len(new_map)} entries.")
    
    with open(MAP_FILE, 'w', encoding='utf-8') as f:
        json.dump(new_map, f, indent=4)
        
if __name__ == "__main__":
    main()
