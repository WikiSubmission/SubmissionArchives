import os
import json
import glob
from collections import defaultdict

TRANSCRIPTS_DIR = r"c:\Users\Jonathan\Desktop\RKM\Messenger Video Programs\transcripts"

def analyze():
    files = glob.glob(os.path.join(TRANSCRIPTS_DIR, "*_diarized.json"))
    
    print(f"Found {len(files)} transcripts.")
    
    for f in files:
        basename = os.path.basename(f)
        try:
            with open(f, 'r', encoding='utf-8') as fh:
                data = json.load(fh)
                
            stats = defaultdict(float)
            total_dur = 0
            
            # support both 'segments' list and 'utterances' if present
            # Deepgram output structure might vary
            segments = data.get('segments', [])
            
            for seg in segments:
                dur = seg.get('end', 0) - seg.get('start', 0)
                spk = seg.get('speaker', 'Unknown')
                stats[spk] += dur
                total_dur += dur
                
            print(f"\nFile: {basename}")
            print(f"  Total Duration: {total_dur/60:.2f} min")
            sorted_stats = sorted(stats.items(), key=lambda x: x[1], reverse=True)
            
            for spk, dur in sorted_stats:
                pct = (dur / total_dur * 100) if total_dur > 0 else 0
                print(f"  {spk}: {dur/60:.2f} min ({pct:.1f}%)")
                
        except Exception as e:
            print(f"Error reading {basename}: {e}")

if __name__ == "__main__":
    analyze()
