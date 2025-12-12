import fitz
import easyocr
import numpy as np
from PIL import Image
import io
import os
import torch

try:
    from surya.foundation import FoundationPredictor
    from surya.layout import LayoutPredictor
    SURYA_AVAILABLE = True
except ImportError:
    SURYA_AVAILABLE = False
    print("WARNING: Surya not installed. Intelligent OCR disabled.")

# Singletons
_READER = None
_FP = None
_LP = None

def get_reader():
    global _READER
    if _READER is None:
        print("Initializing EasyOCR Reader...")
        # Use GPU if available
        gpu = torch.cuda.is_available()
        _READER = easyocr.Reader(['en'], gpu=gpu, verbose=False)
    return _READER

def get_surya_predictors():
    global _FP, _LP
    if not SURYA_AVAILABLE:
        return None, None
    
    if _LP is None:
        print("Initializing Surya Predictors...")
        _FP = FoundationPredictor()
        _LP = LayoutPredictor(foundation_predictor=_FP)
    return _FP, _LP

def crop_image(pil_image, bbox):
    # bbox is [x1, y1, x2, y2]
    return pil_image.crop((bbox[0], bbox[1], bbox[2], bbox[3]))

def get_page_text_layout_aware(pdf_path, page_num):
    """
    Uses Surya for Layout Analysis to detect structure (Headers, Footers, Columns),
    then extracts text from those regions using PyMuPDF (fast, accurate) instead of OCR.
    Returns: String with [[HEADER]] tags for structure.
    """
    doc = fitz.open(pdf_path)
    page = doc.load_page(page_num)
    
    # Render image for Surya
    pix = page.get_pixmap(dpi=200)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

    fp, lp = get_surya_predictors()
    if not lp:
        # Fallback to plain text if surya missing
        return page.get_text()

    # 1. Run Layout Analysis
    results = lp([img])[0]
    
    # 2. Process Regions
    regions = []
    if hasattr(results, 'bboxes'):
        for box in results.bboxes:
            # box: .bbox=[x1,y1,x2,y2], .label=str
            regions.append( {'bbox': box.bbox, 'label': box.label} )
    
    # 3. Sort by reading order
    # Primary sort: Y-axis, Secondary: X-axis
    # Group by "Lines" roughly? 
    # Actually simple Top-Down is usually enough for 1-col. 
    # For 2-col, we might need more logic, but let's stick to simple Y sort for now or Y+X.
    # We allow a small Y-tolerance to group items on same line? No, regions are blocks.
    regions.sort(key=lambda x: (x['bbox'][1], x['bbox'][0]))

    full_text = []

    for reg in regions:
        # Scale bbox to PDF coordinates? 
        # Surya runs on the image. PyMuPDF 'clip' expects PDF coords.
        # We need to map Image coords -> PDF coords.
        # Image w/h: pix.width, pix.height
        # PDF w/h: page.rect.width, page.rect.height
        
        rx_scale = page.rect.width / pix.width
        ry_scale = page.rect.height / pix.height
        
        x1, y1, x2, y2 = reg['bbox']
        rect = fitz.Rect(x1 * rx_scale, y1 * ry_scale, x2 * rx_scale, y2 * ry_scale)
        
        # MEANINGFUL DEBUG
        # print(f"DEBUG: Region {reg['label']} ImgBox: {reg['bbox']} -> PDFRect: {rect}")
        
        # Extract text from this region
        extracted_text = page.get_text("text", clip=rect).strip()
        
        # print(f"   -> Extracted: {extracted_text[:30]}...")
        
        if not extracted_text:
            continue

        label = reg['label']
        # Normalize labels (Surya models might vary, checking standard ones)
        # Standard: Caption, Footnote, Formula, List-item, Page-footer, Page-header, Picture, Section-header, Table, Text, Title
        
        if label in ["Section-header", "Title", "Page-header", "Header"]:
             print(f"DEBUG: Tagging Header: {extracted_text}")
             full_text.append(f"[[HEADER]] {extracted_text}")
        
        elif label in ["Page-footer", "Footer"]:
             print(f"DEBUG: Tagging Footer: {extracted_text}")
             full_text.append(f"[[FOOTER]] {extracted_text}")
             
        else:
             full_text.append(extracted_text)

    # doc.close() # moved to end
    
    result = "\n".join(full_text)
    
    # Compute raw text length for fail-safe check (Doc must be open)
    raw_text_txt = page.get_text()
    raw_text_len = len(raw_text_txt)
    layout_text_len = len(result)
    
    print(f"DEBUG: Layout Text: {layout_text_len} chars vs Raw Text: {raw_text_len} chars")
    
    # Fail-safe: If we lost > 30% of text, something is wrong with layout detection (missed body).
    # Fallback to standard extraction to ensure we don't lose verses.
    if raw_text_len > 0 and (layout_text_len / raw_text_len) < 0.7:
        print("WARNING: Layout Analysis missed significant content. Fallback to standard extraction.")
        doc.close()
        return raw_text_txt
        
    doc.close()
    return result
