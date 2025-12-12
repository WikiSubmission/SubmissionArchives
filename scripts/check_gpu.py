
import torch
print(f"CUDA Available: {torch.cuda.is_available()}")
try:
    import torchvision
    print(f"Torchvision Version: {torchvision.__version__}")
    from torchvision.ops import nms
    print("Mask R-CNN NMS op found.")
except Exception as e:
    print(f"Torchvision Error: {e}")
