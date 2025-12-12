import os
import glob
import json
import shutil
from flask import Flask, jsonify, request, send_from_directory, abort, render_template_string

app = Flask(__name__)

# Base Directory (Desktop/RKM)
# Base Directory (Desktop/RKM/tools/verify_app)
APP_DIR = os.path.dirname(os.path.abspath(__file__))
# Content Directory (Desktop/RKM)
# Go up 2 levels: tools/verify_app -> tools -> RKM
CONTENT_DIR = os.path.dirname(os.path.dirname(APP_DIR))

# Targeted Folders
FOLDERS = {
    "Quran Studies": "Messenger Quran Studies",
    "Sermons": "Messenger Sermons",
    "Video Programs": "Messenger Video Programs",
    "Audios": "messenger_audios"
}

def find_transcript(media_path):
    """
    Tries to find the corresponding JSON transcript for a media file.
    Strategies:
    1. transcripts/<basename>_diarized.json
    2. transcripts/<basename>.json
    3. meta/<basename>_diarized.json
    4. meta/<basename>.json
    5. <basename>_diarized.json
    6. <basename>.json
    """
    dirname = os.path.dirname(media_path)
    basename = os.path.splitext(os.path.basename(media_path))[0]
    
    candidates = [
        os.path.join(dirname, "transcripts", f"{basename}_diarized.json"),
        os.path.join(dirname, "transcripts", f"{basename}.json"),
        os.path.join(dirname, "meta", f"{basename}_diarized.json"),
        os.path.join(dirname, "meta", f"{basename}.json"),
        os.path.join(dirname, f"{basename}_diarized.json"),
        os.path.join(dirname, f"{basename}.json"),
    ]
    
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

@app.route("/")
def index():
    return send_from_directory(APP_DIR, "verify_app.html")

import re

# ... (imports remain)

def natural_keys(text):
    """
    alist.sort(key=natural_keys) sorts in human order
    http://nedbatchelder.com/blog/200712/human_sorting.html
    (See Toothy's implementation in the comments)
    """
    return [ int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', text) ]

# ... (rest of imports/constants)

@app.route("/api/files")
def list_files():
    """Returns a tree of media files and their transcript status."""
    tree = {}
    
    # Extensions to look for (case insensitive logic below)
    EXTENSIONS = {'.mp3', '.mp4', '.m4a', '.wav', '.mov', '.mkv'}
    
    for category, folder_name in FOLDERS.items():
        folder_path = os.path.join(CONTENT_DIR, folder_name)
        if not os.path.exists(folder_path):
            continue
            
        files_data = []
        
        # Walk or list directory? 
        # User said "folders", implying root of those folders. 
        # Previous list_dir showed flat structure. Stick to os.listdir for speed, 
        # but filter manually for extensions to be case-insensitive.
        
        try:
            for entry in os.listdir(folder_path):
                full_path = os.path.join(folder_path, entry)
                if not os.path.isfile(full_path):
                    continue
                    
                _, ext = os.path.splitext(entry)
                if ext.lower() not in EXTENSIONS:
                    continue
                    
                transcript_path = find_transcript(full_path)
                has_transcript = transcript_path is not None
                
                rel_path = os.path.relpath(full_path, CONTENT_DIR)
                
                files_data.append({
                    "name": entry,
                    "path": rel_path,
                    "has_transcript": has_transcript,
                    "type": "video" if ext.lower() in ['.mp4', '.mov', '.mkv'] else "audio"
                })
        except OSError as e:
            print(f"Error listing {folder_name}: {e}")
        
        # Sort by natural keys
        files_data.sort(key=lambda x: natural_keys(x["name"]))
        tree[category] = files_data
        
    return jsonify(tree)

# ... (rest of file)

@app.route("/media/<path:filename>")
def serve_media(filename):
    """Serves the media file."""
    return send_from_directory(CONTENT_DIR, filename)

@app.route("/api/transcript")
def get_transcript():
    """Gets the transcript for a given media file path."""
    media_rel_path = request.args.get("path")
    if not media_rel_path:
        return jsonify({"error": "No path provided"}), 400
        
    full_media_path = os.path.join(CONTENT_DIR, media_rel_path)
    transcript_path = find_transcript(full_media_path)
    
    if not transcript_path or not os.path.exists(transcript_path):
        return jsonify({"error": "Transcript not found"}), 404
        
    with open(transcript_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    return jsonify({
        "data": data,
        "path": os.path.relpath(transcript_path, CONTENT_DIR) # Send relative path back for saving
    })

@app.route("/api/save", methods=["POST"])
def save_transcript():
    """Saves the updated transcript. Creates a backup first."""
    payload = request.json
    rel_path = payload.get("path")
    data = payload.get("data")
    
    if not rel_path or not data:
        return jsonify({"error": "Invalid payload"}), 400
        
    full_path = os.path.join(CONTENT_DIR, rel_path)
    
    if not os.path.exists(full_path):
        return jsonify({"error": "File not found"}), 404
        
    # Create backup
    backup_path = full_path + ".bak"
    shutil.copy2(full_path, backup_path)
    
    try:
        with open(full_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return jsonify({"status": "success", "message": "Saved successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/rename_speaker", methods=["POST"])
def rename_speaker():
    """Renames all occurrences of a speaker in the JSON."""
    # This logic can be handled client-side before saving, 
    # but having an API allows for more complex logic if needed. 
    # For now, we'll let the client Modify the JSON and call /save.
    # This endpoint is kept as a placeholder if we want server-side processing.
    return jsonify({"status": "use_save_endpoint_instead"})

if __name__ == "__main__":
    print(f"Universal Verification Tool running at http://localhost:8000")
    print(f"Serving files from: {CONTENT_DIR}")
    app.run(debug=True, port=8000)
