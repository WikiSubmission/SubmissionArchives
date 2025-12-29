import os
import json
import re
import difflib
from datetime import timedelta

# Directories
GITBOOK_DIR = "gitbook_transcripts"
DEEPGRAM_DIR = r"c:\Users\Jonathan\Desktop\RKM\messenger_audios\transcripts"
OUTPUT_DIR = "corrected_transcripts"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def parse_sparse_timestamp(text):
    """Extracts (MM:SS) timestamps from text. Returns cleaned text and list of (time_sec, char_index)."""
    # Regex for (M:SS) or (MM:SS)
    matches = list(re.finditer(r'\((\d{1,2}):(\d{2})\)', text))
    
    anchors = []
    clean_text = ""
    last_idx = 0
    
    # We need to rebuild text without timestamps to get correct char indices for the cleaned text
    
    for m in matches:
        start, end = m.span()
        # Text before this match
        part = text[last_idx:start]
        clean_text += part
        
        # Calculate seconds
        mins = int(m.group(1))
        secs = int(m.group(2))
        total_sec = mins * 60 + secs
        
        # The anchor is at the current end of clean_text
        anchors.append({
            "time": total_sec,
            "char_idx": len(clean_text)
        })
        
        last_idx = end
        
    clean_text += text[last_idx:]
    return clean_text, anchors

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def find_deepgram_file(audio_id):
    # Search for "Messenger Audio | {audio_id}_diarized.json"
    # Handle variations in spacing or pipe char
    for fname in os.listdir(DEEPGRAM_DIR):
        if not fname.endswith("_diarized.json"):
            continue
        
        # Extract ID
        # Assume format: Match "Messenger Audio" ... number ...
        # Simplified: Check if audio_id is present as word
        
        # Strict logic: fname usually "Messenger Audio ｜ 2_diarized.json"
        # audio_id might be "2" or "3.2"
        
        # Normalize
        norm_name = fname.replace("｜", "|").replace("  ", " ")
        if f"Messenger Audio | {audio_id}_diarized" in norm_name or \
           f"Messenger Audio | {audio_id}.mp3" in norm_name or \
           f"Messenger Audio | {audio_id} " in norm_name:
             return os.path.join(DEEPGRAM_DIR, fname)
             
    return None

def align_file(gitbook_path):
    gitbook_data = load_json(gitbook_path)
    
    # Extract ID from filename "Messenger_Audio_{ID}_gitbook.json"
    fname = os.path.basename(gitbook_path)
    match = re.search(r'Messenger_Audio_(.+)_gitbook\.json', fname)
    if not match:
        print(f"Skipping {fname}: Cannot parse ID")
        return
    
    audio_id = match.group(1)
    deepgram_path = find_deepgram_file(audio_id)
    
    if not deepgram_path:
        print(f"Skipping {audio_id}: Deepgram file not found")
        return
        
    print(f"Aligning {audio_id}...")
    deepgram_data = load_json(deepgram_path)
    
    # Flatten Deepgram words
    dg_words = []
    if "results" in deepgram_data and "channels" in deepgram_data["results"]:
         # deepgram API v2 or v3? 
         # The files we saw earlier had "segments": [ { "words": [...] } ]
         # Let's assume the unified format seen in `1) Quran Study...json`
         pass
    
    if "segments" in deepgram_data:
        for seg in deepgram_data["segments"]:
            if "words" in seg:
                dg_words.extend(seg["words"])
    else:
        # Unexpected format
        print(f"  Unknown Deepgram format for {audio_id}")
        return
        
    if not dg_words:
        print("  No words in Deepgram transcript")
        return

    # Prepare GitBook text
    # We will treat the entire GitBook content as one long string for alignment, 
    # but keep track of segment boundaries so we can reconstruct paragraphs.
    
    gb_full_text = ""
    gb_segments_map = [] # list of {start_char, end_char, valid_speaker}
    
    sparse_anchors = []
    
    for seg in gitbook_data:
        raw_text = seg["text"]
        speaker = seg["speaker"]
        
        cleaned, anchors = parse_sparse_timestamp(raw_text)
        
        # Adjust anchor char_indices by current offset
        offset = len(gb_full_text)
        for a in anchors:
            a["char_idx"] += offset
            sparse_anchors.append(a)
            
        start_char = len(gb_full_text)
        gb_full_text += cleaned + " " # Add space separator
        end_char = len(gb_full_text) - 1
        
        gb_segments_map.append({
            "start_char": start_char,
            "end_char": end_char,
            "speaker": speaker,
            "text": cleaned
        })

    # ALIGNMENT LOGIC
    # 1. Map DG words to GB text positions
    # Simple strategy: Linear interpolation based on word count ratio? No, bad.
    # Anchor strategy: Use the (MM:SS) anchors to constrain.
    
    # Sort anchors by time
    sparse_anchors.sort(key=lambda x: x["time"])
    
    # Map anchors to DG indices
    # Find DG word closest to anchor time
    anchor_pairs = [] # (gb_char_idx, dg_word_idx)
    
    dg_idx = 0
    for anc in sparse_anchors:
        target_time = anc["time"]
        # Scan DG words to find this time
        while dg_idx < len(dg_words):
            w = dg_words[dg_idx]
            if w["start"] >= target_time:
                # Found match
                anchor_pairs.append((anc["char_idx"], dg_idx))
                break
            dg_idx += 1
            
    # Add Start/End anchors
    anchor_pairs.insert(0, (0, 0))
    anchor_pairs.append((len(gb_full_text), len(dg_words)))
    
    # Process segments between anchors
    aligned_segments = []
    
    # We will iterate through GB Segments.
    # For each segment, calculate its char range relative to anchors to estimate time range.
    # This is a simplification. Ideally we align words.
    # Given the high quality of text, we want to construct the output JSON using specific GB segments.
    # We just need "start" and "end" for each GB segment.
    
    # Helper to get time from char index using anchors
    def get_time_for_char(char_idx):
        # Find surrounding anchors
        prev = anchor_pairs[0]
        nxt = anchor_pairs[-1]
        
        for i in range(len(anchor_pairs)-1):
            if anchor_pairs[i][0] <= char_idx <= anchor_pairs[i+1][0]:
                prev = anchor_pairs[i]
                nxt = anchor_pairs[i+1]
                break
                
        # Interpolate
        # Range Chars
        char_dist = nxt[0] - prev[0]
        # Range Words/Time
        # We map char -> word_idx -> time
        prev_word = dg_words[min(prev[1], len(dg_words)-1)]
        nxt_word = dg_words[min(nxt[1], len(dg_words)-1)]
        
        t1 = prev_word["start"]
        t2 = nxt_word["end"]
        
        if char_dist == 0: return t1
        
        ratio = (char_idx - prev[0]) / char_dist
        return t1 + (t2 - t1) * ratio

    for gb_seg in gb_segments_map:
        start_time = get_time_for_char(gb_seg["start_char"])
        end_time = get_time_for_char(gb_seg["end_char"])
        
        # Create output segment
        out_seg = {
            "text": gb_seg["text"],
            "start": round(start_time, 2),
            "end": round(end_time, 2),
            "speaker": "SPEAKER_00" if gb_seg["speaker"] == "Rashad Khalifa" else "SPEAKER_01" if gb_seg["speaker"] == "Audience" else "SPEAKER_02",
            "words": [] # We could fill this if we did word alignment, but start/end is crucial.
        }
        
        # Try to gather words? 
        # For simplicity in this v1, we leave words empty or simplistic.
        # But if we want clickable transcripts, we usually need words.
        # Let's attempt to collect words from DG that fall in this time range.
        
        seg_words = []
        for w in dg_words:
            # Overlap check
            # Word center
            w_center = (w["start"] + w["end"]) / 2
            if start_time <= w_center <= end_time:
                # Copy word but maybe don't replace text?
                # Actually, we want the GB text. 
                # Ideally we assign GB text to these timestamps.
                pass
        
        aligned_segments.append(out_seg)
        
    # Construct Final JSON
    final_json = {
        "text": gb_full_text.strip(),
        "segments": aligned_segments
    }
    
    # Save
    out_name = os.path.basename(deepgram_path).replace(".json", "_corrected.json")
    # Ensuring it ends with _diarized_corrected if original was _diarized
    if not out_name.endswith("_corrected.json"):
         out_name = out_name.replace(".json", "_corrected.json")
         
    out_path = os.path.join(OUTPUT_DIR, out_name)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(final_json, f, indent=2)
    
    print(f"  Saved {out_name}")

def main():
    files = os.listdir(GITBOOK_DIR)
    for f in files:
        if f.endswith("_gitbook.json"):
            align_file(os.path.join(GITBOOK_DIR, f))

if __name__ == "__main__":
    main()
