import json
import os

def generate_links():
    input_file = 'messenger_audios/playlist_meta.json'
    output_file = 'messenger_audios/messenger_audios_links.json'
    
    try:
        # PowerShell redirection often creates UTF-16 files
        try:
            with open(input_file, 'r', encoding='utf-16') as f:
                data = json.load(f)
        except UnicodeError:
            with open(input_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
        links = {}
        if 'entries' in data:
            for entry in data['entries']:
                title = entry.get('title')
                url = entry.get('url')
                # If url is just the ID, construct full URL
                if url and not url.startswith('http'):
                    url = f"https://www.youtube.com/watch?v={entry.get('id')}"
                
                if title and url:
                    links[title] = url
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(links, f, indent=4, ensure_ascii=False)
            
        print(f"Successfully created {output_file} with {len(links)} entries.")
        
    except Exception as e:
        print(f"Error processing metadata: {e}")

if __name__ == "__main__":
    generate_links()
