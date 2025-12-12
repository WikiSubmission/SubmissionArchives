import os
import json
import glob
import stable_whisper
from tqdm import tqdm

TRANSCRIPTS_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\transcripts"
AUDIO_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies"

def load_transcript(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_audio_path(idx):
    # Find audio starting with "idx)"
    pattern = os.path.join(AUDIO_DIR, f"{idx}) *.mp3")
    files = glob.glob(pattern)
    if files:
        return files[0]
    return None

def main():
    print("Loading stable-ts model (base)...")
    model = stable_whisper.load_model("base")
    
    for i in range(1, 53):
        # 1. Find Transcript
        target_file = None
        for f in os.listdir(TRANSCRIPTS_DIR):
            if f.startswith(f"{i})") and f.endswith("_diarized.json"):
                target_file = os.path.join(TRANSCRIPTS_DIR, f)
                break
        
        if not target_file:
            print(f"Skipping {i}: Transcript not found.")
            continue
            
        audio_path = get_audio_path(i)
        if not audio_path:
            print(f"Skipping {i}: Audio not found.")
            continue
            
        print(f"Aligning {i}: {os.path.basename(target_file)}")
        
        # 2. Load Data
        data = load_transcript(target_file)
        original_segments = data.get('segments', [])
        
        # 3. Prepare Text for Alignment
        # We need the full text to feed to stable-ts
        # We also need to keep track of word counts per segment to reconstruct them
        
        full_text_segments = []
        segment_word_counts = []
        
        for seg in original_segments:
            text = seg.get('text', '')
            # Clean/normalize simplisticly just to count words consistently
            # We must use the exact same split logic as we will use later?
            # Actually, stable-ts align() takes a list of strings if we want.
            full_text_segments.append(text)
            
            # Count words. stable-ts words tokenizer might differ slightly (it uses split() usually)
            # but let's assume space splitting for now.
            words = text.split()
            segment_word_counts.append(len(words))
            
        full_text = " ".join(full_text_segments)
        
        # 4. Run Alignment
        # result = model.align(audio_path, full_text, language='en')
        # Using full_text string allows context flow.
        try:
            result = model.align(audio_path, full_text, language='en', verbose=None)
        except Exception as e:
            print(f"Alignment failed for {i}: {e}")
            continue

        # 5. Reconstruct Segments
        # result has .segments, but they are auto-segmented. We want to ignore those
        # and look at the flat list of .words from the entire result.
        
        # Flatten all words from result
        all_aligned_words = []
        for r_seg in result.segments:
            all_aligned_words.extend(r_seg.words)
            
        new_segments = []
        word_cursor = 0
        
        # Iterate original segments and pluck corresponding number of words
        for seg_idx, count in enumerate(segment_word_counts):
            orig_seg = original_segments[seg_idx]
            speaker = orig_seg.get('speaker', 'Unknown')
            orig_text = orig_seg.get('text', '')
            
            # Get next 'count' words
            # Handle potential mismatch in length (though unlikely if text is exact)
            current_words = all_aligned_words[word_cursor : word_cursor + count]
            word_cursor += count
            
            # If we run out of words (mismatch), use what we have or pad?
            # If stable-ts skipped words?
            
            if not current_words:
                 # Fallback to original interpolated timing if something broke greatly?
                 # Or just keep empty.
                 continue

            # Rebuild segment dict
            start = current_words[0].start
            end = current_words[-1].end
            
            # Form words list
            seg_words_obj = []
            for w in current_words:
                seg_words_obj.append({
                    "word": w.word,
                    "start": w.start,
                    "end": w.end,
                    "speaker": speaker
                })
            
            new_segments.append({
                "text": orig_text,
                "start": start,
                "end": end,
                "speaker": speaker,
                "words": seg_words_obj
            })
            
        # 6. Save
        new_data = {"segments": new_segments}
        
        # Backup before align overwrite (we already have .bak_original_deepgram from previous step)
        # Maybe .bak_interpolated?
        bak_path = target_file + ".bak_interpolated"
        if not os.path.exists(bak_path):
            import shutil
            shutil.copy2(target_file, bak_path)
            
        with open(target_file, 'w', encoding='utf-8') as f:
            json.dump(new_data, f, indent=2)
            
        print(f"Saved aligned transcript for {i}")

if __name__ == "__main__":
    main()
