import whisperx
import torch
import logging

logging.basicConfig(level=logging.INFO)

HF_TOKEN = "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"
DEVICE = "cpu"

print("Initializing DiarizationPipeline...")
try:
    diarize_model = whisperx.DiarizationPipeline(use_auth_token=HF_TOKEN, device=DEVICE)
    print("Success!")
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
