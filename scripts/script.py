import os
import json
import fitz

base_dir = r"c:\Users\Jonathan\Desktop\SA\public\content\books"
jsons_dir = os.path.join(base_dir, "jsons")
thumbnails_dir = os.path.join(base_dir, "thumbnails")

os.makedirs(thumbnails_dir, exist_ok=True)

mapping = {
    "English Meanings of the Quran.json": "English Meanings of the Quran - Rashad Khalifa Ph.D..pdf",
    "ETERNITY - Screenplay.json": "ETERNITY - Screenplay - Rashad Khalifa Ph. D..pdf",
    "Islam - Volume 1.json": "Islam - Volume 1.pdf",
    "Miracle of Quran - Significance of the Mysterious Alphabets.json": "miracle_of_quran_alphabets.pdf",
    "Quran - Visual Presentation of the Miracle.json": "quran_visual_presentation.pdf",
    "The Computer Speaks God's Message to the World.json": "computer_speaks.pdf",
    "The Contact Prayers.json": "salat_booklet.pdf",
    "The Perpetual Miracle of Muhammad.json": "perpetual_miracle.pdf"
}

for json_filename, old_pdf_name in mapping.items():
    json_path = os.path.join(jsons_dir, json_filename)
    old_pdf_path = os.path.join(base_dir, old_pdf_name)
    
    new_pdf_name = json_filename.replace(".json", ".pdf")
    new_pdf_path = os.path.join(base_dir, new_pdf_name)
    
    # 1. Rename PDF
    if os.path.exists(old_pdf_path) and not os.path.exists(new_pdf_path):
        os.rename(old_pdf_path, new_pdf_path)
        print(f"Renamed PDF: {old_pdf_name} -> {new_pdf_name}")
    elif not os.path.exists(new_pdf_path):
        print(f"Warning: {old_pdf_path} not found.")
        continue

    # 2. Update JSON
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'source_file' in data.get('metadata', {}):
            data['metadata']['source_file'] = new_pdf_name
        if 'source_files' in data.get('metadata', {}):
            data['metadata']['source_files'] = [new_pdf_name]
            
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Updated source_file in JSON: {json_filename}")

    # 3. Create Thumbnail
    try:
        doc = fitz.open(new_pdf_path)
        page = doc.load_page(0)
        pix = page.get_pixmap()
        thumb_name = json_filename.replace(".json", ".png")
        thumb_path = os.path.join(thumbnails_dir, thumb_name)
        pix.save(thumb_path)
        print(f"Created thumbnail: {thumb_name}")
    except Exception as e:
        print(f"Error creating thumbnail for {new_pdf_name}: {e}")
