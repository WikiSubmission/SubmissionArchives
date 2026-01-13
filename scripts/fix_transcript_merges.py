import os
import json
import re

directory = r"c:\Users\Jonathan\OneDrive\Desktop\RK-Media\rk-media-platform\reprocess_ready"

# Regex to find speaker labels
pattern = re.compile(r'(?<!\w)((?:Dr\.|Mr\.|Mrs\.|Ms\.)\s+[A-Z][a-z]+|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|A [Mm]an|A [Ww]oman|Audience|Speaker):\s')

def get_effective_length(text, matches):
    # Calculate length of text excluding the matches (labels)
    # matches is list of match objects
    total_len = len(text)
    match_len = sum(len(m.group(0)) for m in matches)
    return total_len - match_len

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return False

    if not isinstance(data, list):
        return False

    new_data = []
    modified_file = False
    
    for segment in data:
        content = segment.get('content', '')
        start_time = segment.get('start_time', 0.0)
        end_time = segment.get('end_time', 0.0)
        total_duration = end_time - start_time
        original_speaker = segment.get('speaker', 'Unknown')
        
        matches = list(pattern.finditer(content))
        
        if not matches:
            new_data.append(segment)
            continue
            
        # Check if we only have a start match (Prefix only)
        if len(matches) == 1 and matches[0].start() == 0:
            # Just remove the prefix
            prefix = matches[0].group(0)
            new_content = content[len(prefix):]
            segment['content'] = new_content
            # optionally update speaker if generic?
            # But let's trust the existing speaker field or user input.
            # If the text says "Dr. Khalifa: " and speaker field says "Dr. Khalifa", it's fine.
            # If text says "David: " and speaker says "Dr. Khalifa", maybe we should update speaker?
            # User request specifically asked about merged bubbles.
            # I'll update speaker to match the label if it was explicit.
            extracted_name = matches[0].group(1)
            # Normalize common variations?
            segment['speaker'] = extracted_name
            new_data.append(segment)
            modified_file = True
            continue

        # Complex case: Splitting needed
        # We need to slice the content based on matches
        # Segments: [Start -> Match1], [Match1 -> Match2], [Match2 -> End]
        
        # Cursor for current position in content
        cursor = 0
        
        # Calculate effective length for timing distribution
        eff_len = get_effective_length(content, matches)
        if eff_len == 0: eff_len = 1 # Avoid div by zero
        
        # Iterate through matches
        # The first "segment" is from 0 to Match1.start() (Uses Original Speaker)
        # The next is Match1.end() to Match2.start() (Uses Match1 Name)
        # ...
        
        # But wait, if Match1 is at index 0, the first segment is empty/skipped
        
        current_speaker = original_speaker
        current_seg_start_time = start_time
        
        # We process the text in chunks
        # Chunk 0: Text before first match (if any)
        # Match 1
        # Chunk 1: Text after Match 1, before Match 2
        # ...
        
        last_match_end = 0
        
        # If the first match is NOT at 0, we have an initial chunk for the original speaker
        if matches[0].start() > 0:
            # Chunk for original speaker
            text_chunk = content[0:matches[0].start()]
            chunk_len = len(text_chunk)
            
            # Calculate duration
            chunk_duration = total_duration * (chunk_len / eff_len)
            chunk_end_time = current_seg_start_time + chunk_duration
            
            new_seg = segment.copy()
            new_seg['content'] = text_chunk
            new_seg['end_time'] = chunk_end_time
            # Ensure index or IDs are handled? IDs usually unique int. I might just increment or ignore ID.
            # If I duplicate ID, it might break React keys if used.
            # I'll generate new random ID or suffix?
            # The files use integer IDs. I'll just leave them duplicated or remove ID field if possible.
            # Better to append random suffix to ID if string, or just let backend handle it.
            # existing IDs are ints. I'll make them strings or unique ints if I can track max ID.
            # For now I will just copy and hope ID isn't strict unique key for the file locally (React usually warns).
            new_seg['id'] = str(new_seg['id']) + f"_part_0" 
            
            new_data.append(new_seg)
            
            current_seg_start_time = chunk_end_time
            last_match_end = matches[0].start() # The match effectively claims no time in my logic so we don't advance time for it.
            # Wait, the match text is removed, so it consumes no time in output, consistent with eff_len.
        
        for i, m in enumerate(matches):
            # The text associated with this match starts after this match and goes to next match or end
            next_start = matches[i+1].start() if i + 1 < len(matches) else len(content)
            
            match_text = m.group(0) # "David: "
            speaker_name = m.group(1) # "David"
            
            # Text content for this speaker
            text_chunk = content[m.end():next_start]
            
            # If chunk is empty (e.g. "David: Mark: Hello"), David said nothing?
            # If empty, we might skip creating a segment, or create empty one?
            # Usually implies mistake or just lost text.
            if not text_chunk.strip():
                # Skip updating time?
                # Just update valid start for next
                last_match_end = m.end()
                continue
            
            chunk_len = len(text_chunk)
            chunk_duration = total_duration * (chunk_len / eff_len)
            chunk_end_time = current_seg_start_time + chunk_duration
            
            new_seg = segment.copy()
            new_seg['content'] = text_chunk
            new_seg['speaker'] = speaker_name
            new_seg['start_time'] = current_seg_start_time
            new_seg['end_time'] = chunk_end_time
            new_seg['id'] = str(segment['id']) + f"_part_{i+1}"
            
            new_data.append(new_seg)
            
            current_seg_start_time = chunk_end_time
            last_match_end = next_start
        
        modified_file = True

    if modified_file:
        # Sort by start_time just in case
        new_data.sort(key=lambda x: x.get('start_time', 0))
        # Re-index segment_index
        for idx, seg in enumerate(new_data):
            seg['segment_index'] = idx
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(new_data, f, indent=2, ensure_ascii=False)
        print(f"Fixed {filepath}")
        return True
    return False

# Run
count = 0
for filename in os.listdir(directory):
    if filename.endswith(".json"):
        if process_file(os.path.join(directory, filename)):
            count += 1
print(f"Total files fixed: {count}")
