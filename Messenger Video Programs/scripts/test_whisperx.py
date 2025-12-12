import whisperx
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Device: {device}")

try:
    # Just check if we can load the pipeline
    # diarize_model = whisperx.DiarizationPipeline(use_auth_token="TEST_TOKEN", device=device)
    print("WhisperX imported successfully.")
except Exception as e:
    print(f"Error: {e}")
