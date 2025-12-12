import torch
from transformers import AutoModel, AutoTokenizer
from PIL import Image
import fitz
import io
import sys
import os

# Configuration
PDF_PATH = r"c:\Users\Jonathan\Desktop\RKM\QURAN TRANSLATIONS\Hard Cover 1989.pdf"
PAGE_IDX = 20 # Page 21
MODEL_NAME = "deepseek-ai/deepseek-vl2-tiny"

def main():
    print(f"Loading Model: {MODEL_NAME}...")
    try:
        # DeepSeek-VL2 usually requires AutoModelForCausalLM
        from transformers import AutoModelForCausalLM
        
        # OFF-DISK CACHE PATH
        CACHE_DIR = r"C:\Users\Jonathan\OneDrive\huggingface_cache"
        if not os.path.exists(CACHE_DIR):
            os.makedirs(CACHE_DIR, exist_ok=True)
            print(f"Created cache dir: {CACHE_DIR}")
        
        # Load Processor / Tokenizer
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True, cache_dir=CACHE_DIR)
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME, 
            trust_remote_code=True, 
            device_map="auto",
            torch_dtype=torch.bfloat16,
            cache_dir=CACHE_DIR
        )
    except Exception as e:
        print(f"Failed to load model: {e}")
        return

    print(f"Rendering Page {PAGE_IDX+1}...")
    doc = fitz.open(PDF_PATH)
    page = doc[PAGE_IDX]
    pix = page.get_pixmap(dpi=150)
    img_data = pix.tobytes("png")
    pil_image = Image.open(io.BytesIO(img_data)).convert("RGB")
    
    # DeepSeek-VL2 Conversation Format
    # Based on typical usage: <|image_pad|>...
    # We will try a simple prompt first.
    
    # Prepare inputs using the model's internal logic if available, or manual construction.
    # Typically: define a conversation.
    
    # Ensure helper function exists
    if hasattr(model, 'generate'):
        # Construct simplified input for VL model
        # The specific tokenizer usage depends on the repo code.
        # Let's try to find the 'DeepseekVLV2Processor'
        pass
    
    # We will rely on the model's 'chat' or 'generate' method often exposed by these remote code models.
    # OR we use a simple prompting strategy.
    
    # Let's save the image for local reference by the model code if needed
    tmp_img_path = "temp_ocr_page_vl2.png"
    pil_image.save(tmp_img_path)
    
    print("Running Inference...")
    try:
        # Try generic generation
        # <image_placeholder> token is often specific.
        # DeepSeek-VL usually uses <image_placeholder>
        
        question = "Transcribe the text in this image verbatim."
        
        # Check if the model has a generate_content method (common in their demos)
        # Otherwise use standard transformers pipeline.
        
        # Creating a standard prompt input
        # We need the processor.
        from transformers import AutoProcessor
        processor = AutoProcessor.from_pretrained(MODEL_NAME, trust_remote_code=True, cache_dir=CACHE_DIR)
        
        conversation = [
            {
                "role": "User",
                "content": "<image_placeholder>\n" + question,
                "images": [tmp_img_path]
            },
            {
                "role": "Assistant",
                "content": ""
            }
        ]
        
        # Prepare inputs
        inputs = processor(
            conversations=conversation,
            images=[pil_image],
            force_batchify=True,
            return_tensors="pt"
        ).to(model.device)
        
        # Generate
        with torch.no_grad():
            outputs = model.generate(
                inputs.input_ids,
                images=inputs.pixel_values,
                image_sizes=inputs.image_sizes, # Verify this argument support
                max_new_tokens=2048,
                pad_token_id=tokenizer.eos_token_id,
                do_sample=False
            )
            
        response = processor.batch_decode(outputs, skip_special_tokens=True)[0]
        
        print("-" * 20)
        print("RESULT:")
        print(response)
        print("-" * 20)
        
        # Cleanup
        if os.path.exists(tmp_img_path):
            os.remove(tmp_img_path)
            
    except Exception as e:
        print(f"Inference Failed: {e}")
        # Fallback print to see what attrs are available
        # print(dir(model))

if __name__ == "__main__":
    main()
