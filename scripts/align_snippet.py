
import torch
import torchaudio
import os

# Align text to audio prototype
# Based on Torchaudio tutorial for Forced Alignment

def align_snippet(audio_path, transcript_words, start_sec, end_sec):
    print(f"Loading {audio_path}...")
    
    # Load audio segment
    # For prototype, just load 10s
    waveform, sample_rate = torchaudio.load(audio_path)
    
    # Resample if needed to 16k
    if sample_rate != 16000:
        resampler = torchaudio.transforms.Resample(sample_rate, 16000)
        waveform = resampler(waveform)
        sample_rate = 16000
        
    # Crop to segment
    frame_offset = int(start_sec * sample_rate)
    num_frames = int((end_sec - start_sec) * sample_rate)
    waveform = waveform[:, frame_offset : frame_offset + num_frames]
    
    # Load model
    print("Loading Wav2Vec2 bundle...")
    bundle = torchaudio.pipelines.WAV2VEC2_ASR_BASE_960H
    model = bundle.get_model()
    labels = bundle.get_labels()
    
    dictionary = {c: i for i, c in enumerate(labels)}
    
    print("Running inference...")
    with torch.inference_mode():
        emissions, _ = model(waveform)
        emissions = torch.log_softmax(emissions, dim=-1)
        
    print(f"Emissions shape: {emissions.shape}")
    
    # Prepare text for alignment
    # Text needs to be normalized (upper case, replace punctuation)
    # Transcript words: List of words
    clean_words = [w.upper().replace('.', '').replace(',', '').replace('?', '').replace('!', '') for w in transcript_words]
    transcript = "|".join(clean_words)
    
    # Generate token list
    tokens = [dictionary[c] for c in transcript if c in dictionary]
    # Note: Wav2Vec2 usually expects word separator as "|"
    # But for forced alignment we map character by character? 
    # Actually, the standard CTC forced alignment aligns *characters*.
    
    print(f"Transcript: {transcript}")
    
    # Compute alignment (CTC)
    # Using torchaudio's forced_align/align (might not be in base? Need recent version)
    # Or just use backtracking on emissions.
    
    # Let's try to check if torchaudio.functional.forced_align exists or implement simple CTC decoding
    try:
        from torchaudio.functional import forced_align
        targets = torch.tensor(tokens, dtype=torch.int32).unsqueeze(0)
        # input_lengths = torch.tensor([emissions.shape[1]])
        # target_lengths = torch.tensor([len(tokens)])
        
        # forced_align signature varies.
        # Actually in recent torchaudio it is `forced_align`
        pass
    except ImportError:
        print("torchaudio.functional.forced_align not found. Need manual implementation?")

    # For this prototype, let's just dump the emissions and see if we get something sensible
    # Or try simple greedy decode
    indices = torch.argmax(emissions[0], dim=-1)
    decoded = "".join([labels[i] for i in indices])
    print(f"Greedy Decode: {decoded}")
    print("If Greedy Decode resembles transcript, alignment is feasible.")

if __name__ == "__main__":
    test_audio = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\1) Quran Study 5⧸26⧸89  Sura 72_19 28 & 73 by Kathryn, Jinns - Rashad Khalifa.mp3"
    test_words = ["OUR", "TEACHER", "IS", "CATHERINE"]
    # 0 to 5 seconds
    align_snippet(test_audio, test_words, 0, 5)
