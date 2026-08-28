import os
import sys
import json
import re
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

transcripts_base = Path("transcripts/fbi")
out_dir = Path("public/data/fbi")
out_dir.mkdir(parents=True, exist_ok=True)

def parse_page_frontmatter(content):
    meta = {}
    body = content
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            raw_yaml = parts[1].strip()
            body = parts[2].strip()
            for line in raw_yaml.splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    if v.startswith("[") and v.endswith("]"):
                        # simple list parse
                        items = [x.strip().strip('"').strip("'") for x in v[1:-1].split(",") if x.strip()]
                        meta[k] = items
                    else:
                        meta[k] = v
    return meta, body

def compile_all():
    master_index = []
    
    for part_dir in sorted(transcripts_base.glob("part_*")):
        part_name = part_dir.name
        pages_dir = part_dir / "pages"
        if not pages_dir.exists():
            continue
            
        part_pages = []
        combined_md = [f"# FBI FOIA Dossier — Dr. Rashad Khalifa ({part_name.replace('_', ' ').title()})\n\n"]
        
        for page_file in sorted(pages_dir.glob("page_*.md")):
            content = page_file.read_text(encoding="utf-8")
            meta, body = parse_page_frontmatter(content)
            page_num_str = page_file.stem.replace("page_", "")
            page_num = int(page_num_str)
            
            entry = {
                "part": part_name,
                "page": page_num,
                "file": page_file.name,
                "metadata": meta,
                "text_snippet": body[:300].replace("\n", " "),
                "full_text": body
            }
            part_pages.append(entry)
            master_index.append(entry)
            
            combined_md.append(f"## Page {page_num}\n")
            if meta:
                combined_md.append(f"**Date:** {meta.get('date', 'N/A')} | **Type:** {meta.get('doc_type', 'N/A')} | **Origin:** {meta.get('origin', 'N/A')} | **Classification:** {meta.get('classification', 'N/A')}\n")
                if meta.get("subject"):
                    combined_md.append(f"**Subject:** {meta.get('subject')}\n")
                combined_md.append("\n")
            combined_md.append(body)
            combined_md.append("\n\n---\n\n")
            
        part_md_file = out_dir / f"fbi_dossier_{part_name}.md"
        part_md_file.write_text("".join(combined_md), encoding="utf-8")
        print(f"Compiled {part_name}: {len(part_pages)} pages -> {part_md_file}")

    master_json_file = out_dir / "fbi_master_index.json"
    master_json_file.write_text(json.dumps(master_index, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Master index saved with {len(master_index)} entries to {master_json_file}")

if __name__ == "__main__":
    compile_all()
