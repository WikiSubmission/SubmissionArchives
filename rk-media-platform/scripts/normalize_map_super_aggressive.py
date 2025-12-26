
import re

def normalize(s):
    s = s.lower()
    # Replace Big Solidus with Slash
    s = s.replace('⧸', '/')
    # Replace NBSP with space
    s = s.replace('\u00A0', ' ')
    
    # Normalize Quotes
    s = re.sub(r"['’‘]", "'", s)
    s = re.sub(r'["“”]', '"', s)
    
    # Normalize Dashes
    s = re.sub(r"[-–—]", "-", s)
    
    # Collapse spaces
    s = re.sub(r'\s+', ' ', s)
    
    return s.strip()

current_file_path = "src/lib/studyTitles.ts"
with open(current_file_path, 'r', encoding='utf-8') as f:
    content = f.read()

output_lines = ["export const STUDY_TITLES: Record<string, string> = {"]
lines = content.split('\n')
for line in lines:
    match = re.match(r"^\s*'(.+)':\s*`(.+)`,?", line)
    if match:
        key = match.group(1)
        val = match.group(2)
        
        # Normalize Key (Super Aggressive)
        # Note: We must re-escape the single quote for the TS file output if it exists
        norm_key = normalize(key)
        
        # Escape single quotes for JS string literal
        escaped_key = norm_key.replace("'", "\\'")
        
        output_lines.append(f"    '{escaped_key}': `{val}`,")

output_lines.append("};")

with open('src/lib/studyTitles.ts', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_lines) + '\n')
