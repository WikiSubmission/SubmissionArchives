
import csv
import re

# Load data
audio = []
transcripts = []

with open('duration_match_debug.csv', 'r', encoding='utf-8') as f:
    # Skip header
    next(f)
    for line in f:
        line = line.strip()
        if not line: continue
        
        # Format: Type,Name,Value
        # Name can contain commas. Value is int/float.
        # Split from right to get Value
        rest, value = line.rsplit(',', 1)
        # Split from left to get Type
        row_type, name = rest.split(',', 1)
        
        row = {'Type': row_type, 'Name': name, 'Value': value}
        
        if row['Type'] == 'AUDIO':
            audio.append(row)
        else:
            transcripts.append(row)

# Correlation Constant (Bytes per second for 192kbps)
BYTES_PER_SEC = 24000

print(f"Loaded {len(audio)} audio files and {len(transcripts)} transcripts.")

matches = []
used_transcripts = set()

# Parse ID from Audio Filename
# "media/messenger_quran_studies/1) Quran Study.mp3" -> 1
def get_id(name):
    m = re.search(r'messenger_quran_studies/(\d+)\)', name)
    if m:
        return int(m.group(1))
    return -1

audio.sort(key=lambda x: get_id(x['Name']))

# Greedy Matching
for a in audio:
    size = int(a['Value'])
    est_duration = size / BYTES_PER_SEC
    a_id = get_id(a['Name'])
    
    best_t = None
    min_diff = float('inf')
    
    for t in transcripts:
        if t['Name'] in used_transcripts:
            continue
            
        dur = float(t['Value'])
        diff = abs(est_duration - dur)
        
        if diff < min_diff:
            min_diff = diff
            best_t = t
            
    # Check if match is reasonable (e.g. within 60 seconds)
    # The variance can be high due to silence trimming or different encoding.
    # 5% tolerance
    if best_t and min_diff < (0.05 * est_duration + 30): # 5% + 30s buffer
        matches.append({
            'ID': a_id,
            'Audio': a['Name'],
            'Transcript': best_t['Name'],
            'Size': size,
            'Duration': float(best_t['Value']),
            'Diff': min_diff,
            'Ratio': size / float(best_t['Value'])
        })
        used_transcripts.add(best_t['Name'])
    else:
        print(f"NO MATCH FOR #{a_id} (Est: {est_duration:.1f}s) - Best Diff: {min_diff:.1f}s")

print("\n--- PROPOSED MATCHES ---")
final_map = {}
for m in matches:
    print(f"#{m['ID']} -> {m['Transcript']} (Diff: {m['Diff']:.1f}s, Ratio: {m['Ratio']:.0f})")
    final_map[m['ID']] = m['Transcript']

# Generate python dict for copy-paste
print("\n--- PYTHON DICT ---")
print("DURATION_OVERRIDES = {")
for id, t_name in final_map.items():
    print(f"    {id}: \"{t_name}\",")
print("}")
