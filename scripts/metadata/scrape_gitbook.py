import requests
from bs4 import BeautifulSoup
import json
import os
import re

# Mapping of GitBook URLs to Local Filename identifiers (Numbers)
# User URL format: .../messenger-audio-{ID}-{DATE}
# Local Key format: Messenger Audio ｜ {ID}

URL_MAP = {
    "2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-2-22-oct-1982",
    "3.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-3.2-22-oct-1982",
    "4": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-4-23-oct-1982",
    "5.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-5.2-29-oct-1982",
    "10.1": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-10.1-12-nov-1982",
    "10.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-10.2-12-nov-1982",
    "11": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-11-12-nov-1982",
    "12": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-12-19-nov-1982",
    "14.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-14.2-1982",
    "15.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-15.2-26-nov-1982",
    "17.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-17.2-03-dec-1982",
    "18.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-18.2-26-nov-1982",
    "19.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-19.2-10-dec-1982",
    "20.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-20.2-10-dec-1982",
    "22.1": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-22.1-17-dec-1982",
    "22.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-22.2-17-dec-1982",
    "24.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-24.2-17-dec-1982",
    "27": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-27-24-dec-1982",
    "29": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-29-31-dec-1982",
    "30.1": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-30.1-7-jan-1983",
    "30.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-30.2-05-nov-1982",
    "31.1": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-31.1-7-jan-1983",
    "31.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-31.2-7-jan-1983",
    "33.1": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-33.1-21-jan-1983",
    "33.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-33.2-21-jan-1983",
    "34.1": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-34.1-21-jan-1983",
    "34.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-34.2-21-jan-1983",
    "35": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-35-21-jan-1983",
    "36.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-36.2-28-jan-1983",
    "37.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-37.2-28-jan-1983",
    "38.1": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-38.1-4-feb-1983",
    "39": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-39-4-feb-1983",
    "43.1": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-43.1-25-feb-1983",
    "43.2": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-43.2-25-feb-1983",
    "44": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-44-4-mar-1983",
    "46": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-46-11-mar-1983",
    "47": "https://rashad-khalifa-audios-and-videos.gitbook.io/rashad-khalifa-audios-and-videos/messenger-audios/messenger-audio-47-18-mar-1983"
}

OUTPUT_DIR = "gitbook_transcripts"
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def scrape_url(audio_id, url):
    print(f"Scraping {audio_id} from {url}...")
    try:
        resp = requests.get(url)
        if resp.status_code != 200:
            print(f"  Failed: {resp.status_code}")
            return
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # GitBook usually puts content in <main> or similar. 
        # But we need to look for where the text is.
        # Based on previous check, text is likely in <article> or just P tags.
        # We will iterate P tags.
        
        structure = []
        
        # Heuristic: Find the main content area to avoid nav links
        main = soup.find('main') or soup.find('article') or soup.body
        
        # Iterate all paragraphs
        if not main:
            print("  No main content found")
            return

        for p in main.find_all(['p']):
            # Text inside P might be mixed.
            # We need to iterate children of P to handle mixed text/span.
            # E.g. "Also <span red>Hello</span> there."
            
            # This is complex because children can be strings or Tags.
            
            p_text_nodes = []
            
            for child in p.contents:
                if isinstance(child, str):
                    text = child.strip()
                    if text:
                        p_text_nodes.append({"text": text, "speaker": "Audience"})
                elif child.name == 'span':
                    text = child.get_text().strip()
                    if not text:
                        continue
                        
                    is_red = False
                    classes = child.get('class', [])
                    if 'text-red-500' in classes:
                        is_red = True
                    
                    speaker = "Rashad Khalifa" if is_red else "Audience"
                    p_text_nodes.append({"text": text, "speaker": speaker})
                elif child.name == 'br':
                    continue
                else:
                     # Nested formatting like strong/em? 
                     # Treat like generic text for now, or recurse? 
                     # Let's simple get_text but we lose specific color if nested.
                     # Assuming formatting is flat: P > SPAN for color.
                     text = child.get_text().strip()
                     if text:
                         # Check if the child ITSELF has the color class?
                         classes = child.get('class', [])
                         speaker = "Rashad Khalifa" if 'text-red-500' in classes else "Audience"
                         p_text_nodes.append({"text": text, "speaker": speaker})

            # Append this P's nodes to structure
            structure.extend(p_text_nodes)

        # Save to JSON
        outfile = os.path.join(OUTPUT_DIR, f"Messenger_Audio_{audio_id}_gitbook.json")
        with open(outfile, 'w', encoding='utf-8') as f:
            json.dump(structure, f, indent=2)
            
        print(f"  Saved {len(structure)} segments to {outfile}")
        
    except Exception as e:
        print(f"  Error: {e}")

def main():
    for audio_id, url in URL_MAP.items():
        scrape_url(audio_id, url)

if __name__ == "__main__":
    main()
