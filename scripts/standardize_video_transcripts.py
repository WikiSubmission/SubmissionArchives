import os
import json
import glob
from collections import defaultdict
import shutil

TRANSCRIPTS_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Video Programs\transcripts"
BACKUP_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Video Programs\transcripts\backup_pre_std"

def standardize():
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        
    files = glob.glob(os.path.join(TRANSCRIPTS_DIR, "*_diarized.json"))
    
    print(f"Found {len(files)} transcripts.")
    
    skipped = []
    processed = []
    
    for f in files:
        basename = os.path.basename(f)
        
        # Skip backups
        if ".bak" in basename: continue
        
        try:
            with open(f, 'r', encoding='utf-8') as fh:
                data = json.load(fh)
                
            stats = defaultdict(float)
            total_dur = 0
            segments = data.get('segments', [])
            
            # 1. Analyze
            for seg in segments:
                dur = seg.get('end', 0) - seg.get('start', 0)
                spk = seg.get('speaker', 'Unknown')
                stats[spk] += dur
                total_dur += dur
                
            if total_dur == 0:
                print(f"Skipping empty: {basename}")
                continue
                
            sorted_stats = sorted(stats.items(), key=lambda x: x[1], reverse=True)
            dominant_spk, dom_dur = sorted_stats[0]
            dom_pct = (dom_dur / total_dur * 100)
            
            # 2. Decide
            if dom_pct > 90.0:
                # Safe to rename dominant speaker
                print(f"Processing {basename} (Dominant: {dominant_spk} {dom_pct:.1f}%)")
                
                # Backup
                shutil.copy2(f, os.path.join(BACKUP_DIR, basename))
                
                # Update
                count = 0
                for seg in segments:
                    if seg.get('speaker') == dominant_spk:
                        seg['speaker'] = "Dr. Rashad Khalifa"
                        count += 1
                        
                    # Update word level too if distinct
                    if 'words' in seg:
                        for w in seg['words']:
                            if w.get('speaker') == dominant_spk:
                                w['speaker'] = "Dr. Rashad Khalifa"
                                
                data['segments'] = segments
                
                with open(f, 'w', encoding='utf-8') as fh:
                    json.dump(data, fh, indent=2, ensure_ascii=False)
                    
                processed.append(basename)
                
            else:
                print(f"Skipping MIXED: {basename} (Dominant: {dominant_spk} {dom_pct:.1f}%)")
                skipped.append(basename)
                
        except Exception as e:
            print(f"Error processing {basename}: {e}")
            
    print("\nSummary:")
    print(f"Processed: {len(processed)}")
    print(f"Skipped: {len(skipped)}")
    for s in skipped:
        print(f" - {s}")

if __name__ == "__main__":
    standardize()
