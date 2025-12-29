import json
import os
import re

MAP_FILE = "messenger_audios/messenger_audio_map.json"
INPUT_DIR = "messenger_audios/transcripts_api_raw"
OUTPUT_DIR = "messenger_audios/transcripts"

def parse_transcript_segment(segment):
    text = segment.get("text", "").strip()
    start = segment.get("start", 0.0)
    duration = segment.get("duration", 0.0)
    end = start + duration
    
    # Regex for Speaker: "Name: Text"
    # Note: Sometimes it's "Name: " (empty text) or multiline "Name: Text"
    speaker_pat = re.compile(r'^([^:]+):\s*(.*)', re.DOTALL)
    
    match = speaker_pat.match(text)
    if match:
        return {
            "start": start,
            "end": end,
            "speaker": match.group(1).strip(),
            "text": match.group(2).strip()
        }
    else:
        return {
            "start": start,
            "end": end,
            "speaker": None, # To be filled
            "text": text
        }

def process_file(json_path, audio_files):
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {json_path}: {e}")
        return

    raw_segments = data.get("transcript", [])
    processed_segments = []
    
    current_speaker = "SPEAKER_UNKNOWN"
    
    for seg in raw_segments:
        parsed = parse_transcript_segment(seg)
        
        if parsed["speaker"]:
            current_speaker = parsed["speaker"]
        else:
            parsed["speaker"] = current_speaker
            
        processed_segments.append(parsed)
        
    # Merge consecutive segments with same speaker, BUT only if speaker is known
    merged_segments = []
    if processed_segments:
        current_merged = processed_segments[0]
        for next_seg in processed_segments[1:]:
            # Check if speakers match
            is_same_speaker = next_seg["speaker"] == current_merged["speaker"]
            # Only merge if the speaker is actually identified. 
            # If unknown, keep segments separate to avoid creating one massive block of text.
            is_known_speaker = current_merged["speaker"] is not None and current_merged["speaker"] != "SPEAKER_UNKNOWN"
            
            if is_same_speaker and is_known_speaker:
                current_merged["text"] += " " + next_seg["text"]
                current_merged["end"] = next_seg["end"]
            else:
                merged_segments.append(current_merged)
                current_merged = next_seg
        merged_segments.append(current_merged)
    
    # Clean up text
    full_text = " ".join([s["text"] for s in merged_segments])
    
    output_data = {
        "text": full_text,
        "segments": merged_segments
    }
    
    for af in audio_files:
        base = os.path.splitext(af)[0]
        out_name = base + "_diarized.json"
        out_path = os.path.join(OUTPUT_DIR, out_name)
        
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2)
        print(f"Generated {out_name}")

def main():
    with open(MAP_FILE, 'r', encoding='utf-8') as f:
        mapping = json.load(f)
        
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for entry in mapping:
        y_id = entry['youtube_id']
        audio_files = entry['audio_files']
        
        # Look for [id].json in input dir
        json_path = os.path.join(INPUT_DIR, f"{y_id}.json")
        
        if os.path.exists(json_path):
            process_file(json_path, audio_files)
        else:
            print(f"Transcript not found for {y_id} (Audio: {audio_files})")

if __name__ == "__main__":
    main()
