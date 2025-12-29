import stable_whisper

# Prototype for forced alignment using stable-ts

def align_snippet(audio_path, text, start_sec=0, end_sec=10):
    print(f"Loading model (base)...")
    # Using "base" model for speed in prototype
    model = stable_whisper.load_model("base")
    
    print(f"Aligning {audio_path}...")
    # stable-ts allows alignment of text to audio
    # align() performs alignment
    # We can pass the text to align.
    
    # Note: align() usually expects the audio and the text.
    # text can be a list of segments or a string.
    
    # For a full file, we'd do:
    # result = model.align(audio_path, text, language='en')
    
    # But for this snippet, let's try to align just a small part or the whole thing?
    # Aligning the whole 30MB file might take a moment.
    # Let's try to align the whole file but with a very short text to see behaviors 
    # OR better: use the 'text' argument which forces alignment.
    
    # Let's try to align the first few sentences we know are there.
    # "Our teacher is Catherine. The new translation, page 573."
    
    # However, stable-ts alignment works best if you give it the whole text and whole audio.
    # If we only give partial text, it might get confused or fail if it expects full coverage.
    
    # Strategy:
    # 1. Load model.
    # 2. Perform alignment on a clipped audio?
    # No, let's just run it on the file with the text we expect at the start.
    
    # Test text from 1) ... json
    transcript_text = "Our teacher is Catherine. The new translation, page 573."
    
    # We will clip the audio virtually by loading it via ffmpeg into python first? 
    # Or just tell stable-ts to look at the start?
    # model.align doesn't seemingly support start/end constraints easily for the audio input unless pre-sliced.
    
    # Let's try running on the full file but providing just the start text is risky.
    # Instead, let's just run a normal transcription on the first 10s and see if the timestamps are word-level.
    # Then we know we can use the "alignment" feature.
    
    print("Testing transcription on first 10s...")
    # audio can be a path or a tensor.
    # We can load it with torchaudio or ffmpeg-python.
    # stable-ts handles paths.
    
    # To test word-timings presence:
    # result = model.transcribe(audio_path, word_timestamps=True) 
    # But we want FORCED alignment of OUR text.
    
    result = model.align(audio_path, transcript_text, language='en')
    
    # Print first few words
    for seg in result.segments[:3]:
        print(f"Segment: {seg.text}")
        for w in seg.words:
            print(f"  {w.word} {w.start:.2f}-{w.end:.2f}")

if __name__ == "__main__":
    test_audio = r"c:\Users\Jonathan\Desktop\RKM\Messenger Quran Studies\1) Quran Study 5⧸26⧸89  Sura 72_19 28 & 73 by Kathryn, Jinns - Rashad Khalifa.mp3"
    test_text = "Our teacher is Catherine. The new translation, page 573."
    
    align_snippet(test_audio, test_text)
