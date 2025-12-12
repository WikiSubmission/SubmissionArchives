
import os
import json
import hashlib

# Configuration
ROOT_DIR = r"c:\Users\Jonathan\Desktop\RKM"
CATEGORIES = {
    "Messenger Audios": "messenger_audios",
    "Messenger Quran Studies": "Messenger Quran Studies",
    "Messenger Sermons": "Messenger Sermons",
    "Messenger Video Programs": "Messenger Video Programs"
}

MEDIA_EXTENSIONS = {".mp3", ".mp4", ".m4a"}

def get_transcript_path(media_path, category_dir):
    """
    Tries to find a matching transcript file.
    Strategies:
    1. Same filename + .json in 'transcripts' subdir
    2. Same filename + _diarized.json in 'transcripts' subdir
    """
    dirname = os.path.dirname(media_path)
    basename = os.path.basename(media_path)
    base_no_ext = os.path.splitext(basename)[0]
    
    transcript_dir = os.path.join(dirname, "transcripts")
    
    # Candidates to check
    candidates = [
        os.path.join(transcript_dir, base_no_ext + "_diarized.json"),
        os.path.join(transcript_dir, base_no_ext + ".json"),
        os.path.join(transcript_dir, base_no_ext + ".mp3.json"), # Sometimes happens
        os.path.join(transcript_dir, base_no_ext + ".mp4.json")
    ]
    
    for cand in candidates:
        if os.path.exists(cand):
            return cand
    return None

def check_speakers(transcript_path):
    """
    Returns 'Verified' if Rashad/Khalifa is found in distinct speaker labels.
    Returns 'Unverified' otherwise.
    """
    try:
        with open(transcript_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        speakers = set()
        # Handle 'segments' list
        if isinstance(data, dict) and 'segments' in data:
            for seg in data['segments']:
                spk = seg.get('speaker', '')
                if spk:
                    speakers.add(spk.lower())
        
        # Check for target names
        for s in speakers:
            if "rashad" in s or "khalifa" in s:
                return "Verified"
                
    except Exception as e:
        print(f"Error reading {transcript_path}: {e}")
        
    return "Unverified"

def generate_id(path):
    return hashlib.md5(path.encode('utf-8')).hexdigest()[:8]

def main():
    index = []
    
    for cat_name, rel_path in CATEGORIES.items():
        cat_path = os.path.join(ROOT_DIR, rel_path)
        if not os.path.exists(cat_path):
            print(f"Warning: Path not found: {cat_path}")
            continue
            
        print(f"Scanning {cat_name}...")
        
        for root, dirs, files in os.walk(cat_path):
            # Skip transcripts folders
            if "transcripts" in root:
                continue
                
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in MEDIA_EXTENSIONS:
                    full_path = os.path.join(root, file)
                    transcript_path = get_transcript_path(full_path, cat_path)
                    
                    status = "Missing Transcript"
                    if transcript_path:
                        status = check_speakers(transcript_path)
                    
                    item = {
                        "id": generate_id(full_path),
                        "title": file,
                        "category": cat_name,
                        "media_path": full_path,
                        "transcript_path": transcript_path,
                        "status": status
                    }
                    index.append(item)
    
    # Sort index by category then by title naturally
    import re
    def natural_keys(text):
        return [ int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', text) ]
        
    index.sort(key=lambda x: (x['category'], natural_keys(x['title'])))
    
    output_path = os.path.join(ROOT_DIR, "media_index.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2)
        
    print(f"Done. Index saved to {output_path}. Found {len(index)} items.")

if __name__ == "__main__":
    main()
