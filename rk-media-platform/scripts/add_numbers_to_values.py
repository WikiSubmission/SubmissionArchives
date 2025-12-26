
import re

current_file_path = "src/lib/studyTitles.ts"
with open(current_file_path, 'r', encoding='utf-8') as f:
    content = f.read()

output_lines = ["export const STUDY_TITLES: Record<string, string> = {"]
lines = content.split('\n')
for line in lines:
    # Match key and value
    # Key might start with '1)' or just '1'
    # The normalization script preserved the key content but lowercased it.
    # The key starts with `[number])`.
    
    match = re.search(r"^\s*'(\d+)\) .+?':\s*`(.+)`,?", line)
    if match:
        number = match.group(1)
        val = match.group(2)
        
        # Check if value already has number (idempotency)
        if not val.startswith(f"{number})"):
             val = f"{number}) {val}"
        
        # Reconstruct line using the ORIGINAL key from the file (we just want to change value)
        # But split logic is fragile.
        # Let's use simple string replacement on the line if possible, or reconstruct.
        # Reconstructing is safer if we have the full key.
        # Wait, I don't have the full key in `match` group 0 cleanly?
        
        # Better approach: Replace the value part in the line.
        # line looks like: 'key': `val`,
        
        # Split by `: `
        parts = line.split("': `")
        if len(parts) == 2:
            key_part = parts[0] + "'" # 'key'
            val_part = parts[1] # val`,
            
            # remove trailing `,` and backtick
            clean_val = val_part.rstrip(',').rstrip('`')
            
            if not clean_val.startswith(f"{number})"):
                new_val = f"{number}) {clean_val}"
                new_line = f"{key_part}: `{new_val}`,"
                output_lines.append(new_line)
            else:
                output_lines.append(line)
        else:
            output_lines.append(line)
            
    else:
        # If line is header/footer or didn't match regex
        if ":" in line and "STUDY_TITLES" not in line: 
             # Could be a line that didn't match regex? (e.g. key doesn't start with number?)
             # Log it?
             output_lines.append(line)
        elif line.strip():
             output_lines.append(line)

output_lines.append("};")

# Write back
with open(current_file_path, 'w', encoding='utf-8') as f:
    # Filter duplicate last line `};` catch
    final_content = '\n'.join(output_lines).replace("};};", "};")
    # Actually, my loop appends "};" at end, but I also append lines.
    # The input `lines` contains `};` at the end?
    # Yes. I should exclude the last line of input?
    # I'll just write `output_lines` but remove the last element if it is `};` before appending my own.
    pass

# Simplified write:
with open(current_file_path, 'w', encoding='utf-8') as f:
    # Logic above is slightly flawed regarding structure preservation.
    # Let's rewrite strictly:
    pass

# Retry Logic
final_lines = []
for line in content.splitlines():
    if "export const" in line:
        final_lines.append(line)
        continue
    if line.strip() == "};":
        continue
    if not line.strip():
        continue
        
    # Process entry
    # Key extraction: '1) ...'
    m = re.search(r"^\s*'(\d+)\)", line)
    if m:
        num = m.group(1)
        # Partition line by `: `
        if "': `" in line:
            pre, post = line.split("': `", 1)
            val = post.rsplit("`,", 1)[0]
            if not val.startswith(f"{num})"):
                val = f"{num}) {val}"
            final_lines.append(f"{pre}': `{val}`,")
        else:
            final_lines.append(line)
    else:
         final_lines.append(line)

final_lines.append("};")

with open(current_file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(final_lines) + '\n')
