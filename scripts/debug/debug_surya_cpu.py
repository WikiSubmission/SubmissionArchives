import os
import sys

# CRITICAL: Set this BEFORE importing torch/surya
os.environ["CUDA_VISIBLE_DEVICES"] = ""

print("Set CUDA_VISIBLE_DEVICES=''")

try:
    import torch
    print(f"Torch imported. Version: {torch.__version__}")
    print(f"CUDA available (should be False): {torch.cuda.is_available()}")
    
    from surya.foundation import FoundationPredictor
    from surya.layout import LayoutPredictor
    print("Surya imports successful.")
    
    print("Initializing FoundationPredictor...")
    fp = FoundationPredictor()
    print("FoundationPredictor initialized.")
    
    print("Initializing LayoutPredictor...")
    lp = LayoutPredictor(foundation_predictor=fp)
    print("LayoutPredictor initialized.")
    
    print("SUCCESS: Surya loaded on CPU.")
    
except Exception as e:
    print(f"FAILURE: {e}")
    import traceback
    traceback.print_exc()
