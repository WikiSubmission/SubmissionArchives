import os
import json
import subprocess
import difflib

# -----------------------------------------------------------------------------
# PREREQUISITES (Run in your terminal before executing this script):
# 1. pip install yt-dlp openai-whisper ffmpeg-python
# 2. Install NVIDIA NeMo (Highly recommended to do this in WSL2/Linux):
#    pip install nemo_toolkit[asr]
# 3. Ensure `ffmpeg` is installed and accessible in your system PATH.
# -----------------------------------------------------------------------------

def run_yt_dlp(youtube_url, output_path):
    print(f"[*] Downloading audio from {youtube_url}...")
    cmd = [
        "yt-dlp",
        "-x",
        "--audio-format", "wav",
        "--output", output_path,
        youtube_url
    ]
    subprocess.run(cmd, check=True)
    # Ensure yt-dlp outputs .wav correctly
    if not os.path.exists(output_path):
        for file in os.listdir('.'):
            if file.startswith('temp_audio') and file.endswith('.wav'):
                os.rename(file, output_path)

def run_ffmpeg_cleanup(input_wav, output_wav):
    print(f"[*] Running FFmpeg Cleanup on {input_wav}...")
    # Aggressive cleanup: 16kHz, mono, highpass 200Hz, lowpass 3000Hz, noise reduction
    # afftdn is FFT-based noise reduction.
    cmd = [
        "ffmpeg", "-y", "-i", input_wav,
        "-ac", "1", "-ar", "16000",
        "-af", "highpass=f=200,lowpass=f=3000,afftdn=nf=-25",
        output_wav
    ]
    subprocess.run(cmd, check=True)

def run_whisper(audio_path):
    print("[*] Running Whisper large-v3...")
    import whisper
    # Note: large-v3 requires ~10GB VRAM.
    model = whisper.load_model("large-v3")
    result = model.transcribe(audio_path, word_timestamps=True)
    return result["text"], result.get("segments", [])

def run_canary(audio_path):
    print("[*] Running Canary-1B-v2...")
    import nemo.collections.asr as nemo_asr
    # Requires nemo_toolkit[asr]
    canary_model = nemo_asr.models.EncDecMultiTaskModel.from_pretrained('nvidia/canary-1b')
    canary_model.eval()
    # Canary uses a specific decoding strategy
    predicted_text = canary_model.transcribe([audio_path])[0]
    return predicted_text

def run_parakeet(audio_path):
    print("[*] Running Parakeet-v3 (RNN-T)...")
    import nemo.collections.asr as nemo_asr
    parakeet_model = nemo_asr.models.EncDecRNNTModel.from_pretrained('nvidia/parakeet-rnnt-1.1b')
    parakeet_model.eval()
    predicted_text = parakeet_model.transcribe([audio_path])[0]
    # In RNN-T models, it returns a tuple (text, something) depending on version, 
    # taking the first element is usually the string or list of strings.
    if isinstance(predicted_text, list):
        predicted_text = predicted_text[0]
    return predicted_text

def compare_and_merge(whisper_text, canary_text, parakeet_text):
    print("[*] Running NLP Comparison (Consensus Voting)...")
    # Naive ROVER-style consensus based on Whisper as the anchor
    # In a full production system, we'd use word-level timestamps and JiWER alignment.
    # Here we perform a chunked consensus voting.
    
    # We will prioritize Whisper's semantics, but use Canary for punctuation.
    # For now, we will save all three and do a very basic length comparison 
    # to catch gross hallucinations.
    
    # Example logic: if Whisper heavily hallucinated (length mismatch), fallback to Canary.
    w_len = len(whisper_text)
    c_len = len(canary_text)
    
    if abs(w_len - c_len) > (0.2 * c_len):
        print("[!] Whisper length differs significantly from Canary. Possible hallucination.")
    
    # Return a structured JSON of all three for manual diffing/UI integration
    return {
        "final_consensus": whisper_text,  # defaulting to whisper in this stub
        "models": {
            "whisper_large_v3": whisper_text,
            "canary_1b": canary_text,
            "parakeet_1_1b": parakeet_text
        }
    }

def main(youtube_url, output_dir="output"):
    os.makedirs(output_dir, exist_ok=True)
    
    raw_wav = os.path.join(output_dir, "raw.wav")
    clean_wav = os.path.join(output_dir, "clean.wav")
    out_json = os.path.join(output_dir, "final_transcript.json")
    
    # 1. Download
    if not os.path.exists(raw_wav):
        run_yt_dlp(youtube_url, raw_wav)
        
    # 2. Cleanup
    if not os.path.exists(clean_wav):
        run_ffmpeg_cleanup(raw_wav, clean_wav)
        
    # 3. Models
    w_text, w_segments = run_whisper(clean_wav)
    try:
        c_text = run_canary(clean_wav)
        p_text = run_parakeet(clean_wav)
    except ImportError:
        print("[!] nemo_toolkit is not installed. Skipping Canary & Parakeet.")
        c_text = "N/A"
        p_text = "N/A"
        
    # 4. Compare
    final_json = compare_and_merge(w_text, c_text, p_text)
    final_json["whisper_segments"] = w_segments
    
    # 5. Save
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(final_json, f, indent=4)
        
    print(f"[*] Done! Saved to {out_json}")

def format_timestamp(seconds: float):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"

def export_vtt(segments, vtt_path):
    with open(vtt_path, "w", encoding="utf-8") as f:
        f.write("WEBVTT\n\n")
        for seg in segments:
            start = format_timestamp(seg["start"])
            end = format_timestamp(seg["end"])
            text = seg["text"].strip().replace("\n", " ")
            f.write(f"{start} --> {end}\n")
            f.write(f"{text}\n\n")

def process_catalog():
    catalog_path = "data/catalog/audios.json"
    with open(catalog_path, "r", encoding="utf-8") as f:
        audios = json.load(f)
        
    for audio in audios:
        if audio.get("type") != "messenger-audio":
            continue
            
        title = audio.get("title", "")
        if "MA " not in title:
            continue
            
        import re
        match = re.search(r'MA (\d+)', title)
        if not match:
            continue
            
        ma_num = int(match.group(1))
        if ma_num >= 71:
            youtube_url = audio.get("youtubeUrl")
            folder = audio.get("folder")
            vtt_file = audio.get("vttFile")
            
            if not youtube_url or not folder or not vtt_file:
                continue
                
            target_vtt = os.path.join("public", "content", "audio", "messenger-audios", folder, vtt_file)
            print(f"\n======================================")
            print(f"Processing {title} -> {target_vtt}")
            print(f"======================================")
            
            output_dir = f"temp_processing_{ma_num}"
            os.makedirs(output_dir, exist_ok=True)
            
            raw_wav = os.path.join(output_dir, "raw.wav")
            clean_wav = os.path.join(output_dir, "clean.wav")
            
            try:
                # 1. Download
                if not os.path.exists(raw_wav):
                    run_yt_dlp(youtube_url, raw_wav)
                    
                # 2. Cleanup
                if not os.path.exists(clean_wav):
                    run_ffmpeg_cleanup(raw_wav, clean_wav)
                    
                # 3. Whisper (Anchor)
                w_text, w_segments = run_whisper(clean_wav)
                
                # 4. Export directly to VTT
                export_vtt(w_segments, target_vtt)
                print(f"[+] Successfully saved VTT to {target_vtt}")
                
            except Exception as e:
                print(f"[!] Error processing {title}: {e}")

if __name__ == "__main__":
    process_catalog()
