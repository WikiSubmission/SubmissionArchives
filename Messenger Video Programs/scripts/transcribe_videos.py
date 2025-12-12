import os
import glob
import stable_whisper
import torch
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("transcription.log"),
        logging.StreamHandler()
    ]
)

def main():
    # check for GPU
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logging.info(f"Using device: {device}")
    
    if device == "cpu":
         logging.warning("CUDA not available. Transcription will be slow.")

    # Load model
    logging.info("Loading stable-whisper model (large-v2) with faster-whisper backend...")
    try:
        # Use faster-whisper backend via engine parameter
        model = stable_whisper.load_model('large-v2', device=device, engine='faster-whisper')
    except Exception as e:
        logging.error(f"Failed to load model: {e}")
        return

    # Find video files
    video_files = glob.glob("*.mp4")
    logging.info(f"Found {len(video_files)} video files.")

    for i, video_path in enumerate(video_files):
        base_name = os.path.splitext(video_path)[0]
        json_output_path = base_name + ".json"
        
        logging.info(f"[{i+1}/{len(video_files)}] Processing: {video_path}")

        # Resume capability
        if os.path.exists(json_output_path):
            logging.info(f"Skipping {video_path} - Output already exists: {json_output_path}")
            continue
        
        try:
            logging.info(f"Starting transcription for {video_path}...")
            # Transcribe with word-level timestamps
            # stable-ts offers 'transcribe' which returns a StableWhisperResult
            result = model.transcribe(video_path, word_timestamps=True)
            
            # Save to JSON
            result.save_as_json(json_output_path)
            logging.info(f"Completed and saved to {json_output_path}")
            
        except Exception as e:
            logging.error(f"Error transcribing {video_path}: {e}")
            # Continue to next file instead of crashing entirely
            continue

    logging.info("Batch transcription finished.")

if __name__ == "__main__":
    main()
