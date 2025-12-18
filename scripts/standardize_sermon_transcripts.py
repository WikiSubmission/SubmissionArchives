
import os
import glob
import json
import re

TRANSCRIPTS_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Sermons\transcripts"

def get_deepgram_data(data):
    """Helper to safely extract the main result object from Deepgram structure."""
    if data.get("results") and data["results"].get("channels"):
        return data["results"]["channels"][0]["alternatives"][0]
    return None

def find_dominant_speaker(words):
    """Finds the speaker ID with the most words."""
    counts = {}
    for w in words:
        spk = str(w.get("speaker", "unknown"))
        counts[spk] = counts.get(spk, 0) + 1
    
    if not counts:
        return None
        
    # Return speaker with max count
    return max(counts, key=counts.get)

def standardize_json(file_path):
    print(f"Processing: {os.path.basename(file_path)}...")
    
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Check if already standardized (has valid segments)
    # Actually, we might want to re-run to ensure sentence granularity if previous run was paragraph
    # So we'll proceed unless it's already perfect? 
    # Let's just overwrite to be safe and ensure consistency.

    result = get_deepgram_data(data)
    if not result:
        print(f"  [Skipped] Invalid Deepgram structure.")
        return

    words = result.get("words", [])
    paragraphs = result.get("paragraphs", {}).get("paragraphs", [])

    if not paragraphs:
        print(f"  [Warning] No paragraphs found. Using raw words fallback?")
        # Fallback logic could go here, but Nova-2 usually gives paragraphs
        return

    # 2. Identify Dr. Khalifa
    dominant_speaker_id = find_dominant_speaker(words)
    print(f"  Dominant Speaker ID: {dominant_speaker_id}")

    # 3. Build Segments (Sentences)
    new_segments = []
    
    for p in paragraphs:
        speaker_id = str(p.get("speaker", "unknown"))
        
        # Determine Display Name
        if speaker_id == dominant_speaker_id:
            display_speaker = "Dr. Khalifa"
        else:
            # Keep original ID for others (or map if we knew them)
            display_speaker = f"SPEAKER_{speaker_id}"

        # Extract Sentences
        for sent in p.get("sentences", []):
            original_text = sent["text"]
            original_start = sent["start"]
            original_end = sent["end"]
            
            # Helper to recursively split text into chunks ~150 chars
            def split_text_into_chunks(text, max_len=150):
                if len(text) <= max_len:
                    return [text]
                
                # Find nearest space before max_len
                split_idx = text.rfind(' ', 0, max_len)
                if split_idx == -1: 
                    # No space found, force split at max_len
                    split_idx = max_len
                
                return [text[:split_idx]] + split_text_into_chunks(text[split_idx+1:], max_len)

            chunks = split_text_into_chunks(original_text, 150)
            
            # Distribute time proportionally (rough approximation)
            total_chars = len(original_text)
            duration = original_end - original_start
            
            current_start = original_start
            
            for i, chunk in enumerate(chunks):
                chunk_len = len(chunk)
                chunk_duration = (chunk_len / total_chars) * duration
                chunk_end = current_start + chunk_duration
                
                # Ensure the last chunk ends exactly at original_end to prevent drift
                if i == len(chunks) - 1:
                    chunk_end = original_end

                new_segments.append({
                    "text": chunk.strip(),
                    "start": round(current_start, 3),
                    "end": round(chunk_end, 3),
                    "speaker": display_speaker,
                    "words": [] 
                })
                
                current_start = chunk_end
            
    # 4. Save Updates
    # We will preserve the original deepgram result in 'raw_deepgram' field just in case, 
    # but put 'segments' at top level.
    
    if "raw_deepgram" not in data:
        data["raw_deepgram"] = data.get("results") # Backup original
        
    data["segments"] = new_segments
    
    # We can perform a sanity check:
    print(f"  Generated {len(new_segments)} sentence segments.")
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print("  [Saved]")

def main():
    files = glob.glob(os.path.join(TRANSCRIPTS_DIR, "*.json"))
    print(f"Found {len(files)} transcripts.")
    
    for f in files:
        try:
            standardize_json(f)
        except Exception as e:
            print(f"  [Error] Failed to process {os.path.basename(f)}: {e}")

if __name__ == "__main__":
    main()
