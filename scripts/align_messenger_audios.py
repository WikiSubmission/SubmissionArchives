import os
import json
import glob
import stable_whisper
import shutil
import re
from pydub import AudioSegment

MAPPING_FILE = r"c:\Users\Jonathan\Desktop\RKM\messenger_audios\messenger_audio_map.json"
AUDIO_DIR = r"c:\Users\Jonathan\Desktop\RKM\messenger_audios"
SUBS_DIR = r"c:\Users\Jonathan\Desktop\RKM\messenger_audios\transcripts_youtube_raw"
TRANSCRIPTS_DIR = r"c:\Users\Jonathan\Desktop\RKM\messenger_audios\transcripts"

# Need ffmpeg in path for pydub
# Assuming it is installed.

def load_vtt_text(vtt_path):
    # Quick regex parse to get text
    # Or use stable-ts? stable-ts can align plain text string.
    # We want to extract the cleaned text from VTT to align it.
    
    # Let's simple parse: get all text lines, join them.
    text_content = []
    with open(vtt_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    pattern = re.compile(r'\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\n(.*?)(?=\n\n|\Z)', re.DOTALL)
    matches = pattern.findall(content)
    
    for m in matches:
        t = m.replace('\n', ' ').strip()
        # Remove speaker names for raw alignment text?
        # Ideally yes, but stable-ts can handle them if they are spoken.
        # But VTT usually has "Speaker: Text". The "Speaker:" part isn't spoken.
        # So we should regex remove "Name: " prefix if possible.
        
        # Heuristic: Uppercase/Titlecase followed by ": " at start.
        sp_match = re.match(r'^([A-Z][a-zA-z .]+): (.*)', t)
        if sp_match:
            t = sp_match.group(2)
            
        t = t.replace('&nbsp;', ' ')
        text_content.append(t)
        
    return " ".join(text_content)

def process_entry(entry, model):
    audio_files = entry['audio_files']
    vid_id = entry['youtube_id']
    
    print(f"Processing {vid_id} -> {audio_files}")
    
    # Find sub file
    sub_pattern = os.path.join(SUBS_DIR, f"{vid_id}.en*.vtt")
    files = glob.glob(sub_pattern)
    if not files:
        print(f"  No subtitle found for {vid_id}")
        return
    
    # Pick best sub (en-US or first)
    sub_file = files[0]
    for s in files:
        if ".en-US" in s:
            sub_file = s
            break
            
    full_text = load_vtt_text(sub_file)
    
    if not full_text:
        print("  Empty text extracted.")
        return
        
    # Handle Audio
    # 1. Concatenate if multiple
    durations_ms = []
    combined_audio = AudioSegment.empty()
    
    for af in audio_files:
        # Try direct path
        path = os.path.join(AUDIO_DIR, af)
        
        if not os.path.exists(path):
            # robust match via regex normalization
            def normalize(s):
                # Force only ASCII chars and digits
                return re.sub(r'[^a-zA-Z0-9.]', '', s).lower()
                
            target_clean = normalize(af)
            
            found_path = None
            for f in os.listdir(AUDIO_DIR):
                if normalize(f) == target_clean:
                    found_path = os.path.join(AUDIO_DIR, f)
                    break
            
            if found_path:
                path = found_path
            else:
                print(f"  Missing audio: {path} (Normalized: {target_clean})")
                return
        
        print(f"  Loading {os.path.basename(path)}...")
        seg = AudioSegment.from_mp3(path)
        combined_audio += seg
        durations_ms.append(len(seg))
        
    # Save temp Combined
    temp_wav = os.path.join(AUDIO_DIR, f"temp_{vid_id}.wav")
    combined_audio.export(temp_wav, format="wav")
    
    # Run Alignment
    print("  Aligning...")
    try:
        result = model.align(temp_wav, full_text, language='en', verbose=None)
    except Exception as e:
        print(f"  Alignment failed: {e}")
        if os.path.exists(temp_wav): os.remove(temp_wav)
        return
        
    # Remove temp audio
    if os.path.exists(temp_wav): os.remove(temp_wav)
    
    # Split Results
    # Flatten words
    all_words = []
    for s in result.segments:
        all_words.extend(s.words)
        
    # Iterate words and assign to file based on timestamp
    # durations_ms contains lengths.
    # Cumulative boundaries (in seconds)
    
    boundaries = []
    cum = 0
    for d in durations_ms:
        cum += d
        boundaries.append(cum / 1000.0)
        
    # boundaries[0] = end of file 1
    # boundaries[1] = end of file 2
    
    current_file_idx = 0
    file_words = [[] for _ in audio_files]
    
    offset = 0.0
    
    for w in all_words:
        # Check if word start is beyond current boundary
        # If so, move to next file
        
        while current_file_idx < len(boundaries) and w.start >= boundaries[current_file_idx]:
            offset = boundaries[current_file_idx]
            current_file_idx += 1
            
        if current_file_idx >= len(audio_files):
            # Word beyond total audio length?
            continue
            
        # Adjust timestamp relative to this file
        w_start = w.start - offset
        w_end = w.end - offset
        
        file_words[current_file_idx].append({
            "word": w.word,
            "start": round(max(0, w_start), 3),
            "end": round(max(0, w_end), 3),
            "speaker": "Unknown" # Alignment lost speaker? 
            # stable-ts align() uses the text we gave. 
            # If we want speakers, we needed to parse them from VTT and try to map back.
            # But the VTT structure is lost in "full_text".
            # Can we recover speakers?
            # Creating a "speaker-aware" text block is hard for stable-ts unless we segment it.
            # For now, let's accept "Unknown" or "Dr. Khalifa" as default,
            # OR try to map back to VTT segments by text match? (Hard).
            # Limitation: Forced alignment on plain text loses VTT speaker labels.
        })
        
    # Save Transcripts
    for i, af_name in enumerate(audio_files):
        words = file_words[i]
        if not words:
            print(f"  No words assigned to {af_name}")
            continue
            
        # Construct simplified JSON
        # Group into segments? stable-ts has regrouping.
        # But we just have words list. 
        # Create one big segment or simple chunks?
        # Let's simple chunk every 10s or by sentence punctuation if possible?
        # For now, put all in one segment or let frontend handle it? 
        # Existing transcripts have segments.
        # Let's make single-word segments or large blocks.
        # Better: Group words into segments based on gaps > 1s.
        
        segments = []
        if words:
            current_seg = {"text": "", "start": words[0]['start'], "end": words[0]['end'], "speaker": "Dr. Khalifa", "words": []}
            
            for w in words:
                # If gap > 2s, new segment
                if w['start'] - current_seg['end'] > 2.0 and current_seg['words']:
                    segments.append(current_seg)
                    current_seg = {"text": "", "start": w['start'], "end": w['end'], "speaker": "Dr. Khalifa", "words": []}
                
                # Append word
                current_seg['words'].append(w)
                current_seg['text'] += w['word'] + " "
                current_seg['end'] = w['end']
                
            segments.append(current_seg)
            
        final_json = {"segments": segments}
        
        # Filename: Name of audio + .json (roughly)
        # Actually standard is: "{index}) {Name}_diarized.json"
        # But here files are "Messenger Audio | 2.mp3"
        # Target transcript name?
        # Look for existing transcript matching audio name?
        # Or just create "Messenger Audio | 2.json"
        
        target_name = af_name.replace(".mp3", ".json")
        target_path = os.path.join(TRANSCRIPTS_DIR, target_name)
        
        # Check if existing file to preserve naming convention?
        # User said "we dont have handwritten transcripts for the otther messenger audios".
        # So we are creating NEW ones.
        
        with open(target_path, 'w', encoding='utf-8') as f:
            json.dump(final_json, f, indent=2)
        print(f"  Saved {target_path}")

def main():
    with open(MAPPING_FILE, 'r') as f:
        mapping = json.load(f)
        
    print("Loading model...")
    model = stable_whisper.load_model("base")
    
    for entry in mapping:
        process_entry(entry, model)

if __name__ == "__main__":
    main()
