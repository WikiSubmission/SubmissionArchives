import os
import glob

# Directories
BASE_DIR = r"c:\Users\Jonathan\Desktop\RKM"
FOLDERS = {
    "Messenger Audios": os.path.join(BASE_DIR, "messenger_audios"),
    "Messenger Sermons": os.path.join(BASE_DIR, "Messenger Sermons"),
    "Messenger Quran Studies": os.path.join(BASE_DIR, "Messenger Quran Studies"),
    "Messenger Video Programs": os.path.join(BASE_DIR, "Messenger Video Programs")
}
OUTPUT_FILE = r"c:\Users\Jonathan\.gemini\antigravity\brain\fef80716-3d46-4aab-8bc7-64db929d7881\needs_work_transcripts.md"

EXTENSIONS = {'.mp3', '.mp4', '.m4a', '.wav', '.mov', '.mkv'}

def scan_folder(folder_path):
    """
    Returns dict:
    {
        'corrected': [],
        'raw': [],
        'missing': []
    }
    """
    results = {'corrected': [], 'raw': [], 'missing': []}
    
    if not os.path.exists(folder_path):
        return results
        
    # List all media files
    media_files = []
    for f in os.listdir(folder_path):
        _, ext = os.path.splitext(f)
        if ext.lower() in EXTENSIONS:
            media_files.append(f)
            
    # Check status for each
    for m in media_files:
        base, _ = os.path.splitext(m)
        
        # Check for transcript
        # Candidates:
        # transcripts/{base}_diarized.json
        # transcripts/{base}.json
        # {base}_diarized.json
        # {base}.json
        
        transcript_path = None
        candidates = [
            os.path.join(folder_path, "transcripts", f"{base}_diarized.json"),
            os.path.join(folder_path, "transcripts", f"{base}.json"),
            os.path.join(folder_path, f"{base}_diarized.json"),
            os.path.join(folder_path, f"{base}.json")
        ]
        
        found_candidate = None
        for c in candidates:
            if os.path.exists(c):
                found_candidate = c
                break
                
        if not found_candidate:
            results['missing'].append(m)
            continue
            
        # If found, check if corrected
        # Logic: 
        # 1. Does a .bak_pre_alignment file exist next to it?
        # 2. Or does the content suggest correction (harder to check, stick to backup file for now)
        # 3. Or if we are in Video/QS folders, we might assume PDF alignment = corrected if in list?
        #    Actually, the backup file is the most reliable "action taken" indicator.
        
        backup_path = found_candidate + ".bak_pre_alignment"
        # Also check for .bak if the server created it
        backup_path_server = found_candidate + ".bak"
        
        if os.path.exists(backup_path) or os.path.exists(backup_path_server):
            results['corrected'].append(m)
        else:
            # Special logic for QS/Videos: did we correct them? 
            # The deploy script created .bak_pre_alignment. 
            # If that doesn't exist, it's likely raw.
            results['raw'].append(m)
            
    return results

def main():
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("# Comprehensive Transcript Status Report\n\n")
        
        total_missing = 0
        total_raw = 0
        
        for category, path in FOLDERS.items():
            stats = scan_folder(path)
            
            f.write(f"## {category}\n")
            
            # Missing
            if stats['missing']:
                f.write(f"\n### ❌ Missing Transcripts ({len(stats['missing'])})\n")
                f.write("The following media files have NO detected JSON transcript:\n")
                for x in sorted(stats['missing']):
                    f.write(f"- `{x}`\n")
                total_missing += len(stats['missing'])
            else:
                f.write("\n✅ No missing transcripts.\n")

            # Raw (Needs Work)
            if stats['raw']:
                f.write(f"\n### ⚠️ Uncorrected / Raw Transcripts ({len(stats['raw'])})\n")
                f.write("These transcripts exist but have not been replaced by high-accuracy versions (no backup file found):\n")
                for x in sorted(stats['raw']):
                    f.write(f"- `{x}`\n")
                total_raw += len(stats['raw'])
            else:
                f.write("\n✅ All transcripts appear corrected/verified.\n")
                
            # Corrected (Summary)
            f.write(f"\n**Corrected/Aligned:** {len(stats['corrected'])} files.\n")
            f.write("---\n")
            
        f.write("\n## Summary\n")
        f.write(f"- **Total Missing:** {total_missing}\n")
        f.write(f"- **Total Uncorrected (Raw):** {total_raw}\n")

    print(f"Generated {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
