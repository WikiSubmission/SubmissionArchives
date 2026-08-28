import os
import sys
import shutil
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

transcripts_base = Path("transcripts/fbi")
public_fbi = Path("public/data/fbi")
public_fbi.mkdir(parents=True, exist_ok=True)

parts = ["part_1", "part_2", "part_3", "part_4"]
part_titles = {
    "part_1": "Part 1: Early Background, INS Records, & 1985 Interview (rashadkhalifa-fbi1.pdf)",
    "part_2": "Part 2: 1990 Assassination Investigation & Al-Fuqra Surveillance (rashadkhalifa-fbi2.pdf)",
    "part_3": "Part 3: Federal Intelligence, Court Records & Investigation (rashadkhalifa-fbi3.pdf)",
    "part_4": "Part 4: Declassified Memoranda & Field Reports (rashadkhalifa-fbi4.pdf)"
}

master_index = []
all_part_mds = {}

print("Step 1: Compiling consolidated markdown dossiers...")

for part in parts:
    pages_dir = transcripts_base / part / "pages"
    if not pages_dir.exists():
        continue
        
    page_files = sorted(pages_dir.glob("page_*.md"))
    print(f"  - {part}: Found {len(page_files)} transcribed pages")
    
    lines = [
        f"# FBI FOIA Declassified Dossier: {part_titles.get(part, part)}",
        f"\n**Source PDF:** `data/sources/fbi/rashadkhalifa-{part.replace('_', '')}.pdf`  ",
        f"**Transcribed Pages:** {len(page_files)}  \n",
        "---\n"
    ]
    
    for pf in page_files:
        content = pf.read_text(encoding="utf-8").strip()
        p_num = pf.stem.replace("page_", "")
        
        # Extract YAML header if present
        meta = {
            "part": part,
            "page_num": int(p_num) if p_num.isdigit() else p_num,
            "filename": pf.name,
            "summary": "",
            "date": "Unknown",
            "origin": "FBI",
            "doc_type": "Record"
        }
        
        if content.startswith("---"):
            parts_split = content.split("---", 2)
            if len(parts_split) >= 3:
                yaml_block = parts_split[1]
                body = parts_split[2].strip()
                for yline in yaml_block.splitlines():
                    if ":" in yline:
                        k, v = yline.split(":", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k in ["date", "origin", "recipient", "classification", "doc_type", "subject"]:
                            meta[k] = v
                content = body
                
        meta["preview"] = content[:250].replace("\n", " ").strip()
        master_index.append(meta)
        
        lines.append(f"\n\n## PAGE {int(p_num) if p_num.isdigit() else p_num}")
        lines.append(f"**Date:** {meta.get('date', 'Unknown')} | **Origin:** {meta.get('origin', 'FBI')} | **Type:** {meta.get('doc_type', 'Record')}")
        if meta.get("subject"):
            lines.append(f"**Subject:** {meta.get('subject')}")
        lines.append("\n" + content + "\n\n---")
        
    combined_md = "\n".join(lines)
    all_part_mds[part] = combined_md
    
    # Save individual part consolidated file in public/data/fbi and transcripts/fbi
    (public_fbi / f"fbi_dossier_{part}.md").write_text(combined_md, encoding="utf-8")
    (transcripts_base / f"fbi_dossier_{part}.md").write_text(combined_md, encoding="utf-8")
    print(f"    -> Saved public/data/fbi/fbi_dossier_{part}.md ({len(combined_md):,} characters)")

# Create Master Combined Dossier of all parts
print("\nStep 2: Creating Complete Master FBI Dossier...")
complete_lines = [
    "# FBI FOIA Declassified Dossier: Complete Master Archive",
    "## Subject: Dr. Rashad Abdel Khalifa (1935–1990)",
    "**Source Materials:** Official FBI FOIA Release Documents (Parts 1–4)  ",
    f"**Total Transcribed Records:** {len(master_index)} pages  \n",
    "---\n"
]

for part in parts:
    if part in all_part_mds:
        complete_lines.append(f"\n\n# {part_titles.get(part, part)}\n")
        complete_lines.append(all_part_mds[part])
        complete_lines.append("\n\n" + "="*80 + "\n")

complete_master_md = "\n".join(complete_lines)
(public_fbi / "fbi_dossier_complete.md").write_text(complete_master_md, encoding="utf-8")
(transcripts_base / "fbi_dossier_complete.md").write_text(complete_master_md, encoding="utf-8")
print(f"    -> Saved public/data/fbi/fbi_dossier_complete.md ({len(complete_master_md):,} characters)")

# Save Master Index
(public_fbi / "fbi_master_index.json").write_text(json.dumps(master_index, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"    -> Saved public/data/fbi/fbi_master_index.json ({len(master_index)} entries)")

# Clean up individual page files and image files
print("\nStep 3: Deleting individual PNG/JPG image files and page markdown files...")
deleted_images = 0
deleted_pages = 0

for part in parts:
    part_dir = transcripts_base / part
    if not part_dir.exists():
        continue
        
    img_dir = part_dir / "images"
    if img_dir.exists():
        for f in img_dir.glob("*.*"):
            f.unlink()
            deleted_images += 1
        shutil.rmtree(img_dir, ignore_errors=True)
        
    pages_dir = part_dir / "pages"
    if pages_dir.exists():
        for f in pages_dir.glob("*.md"):
            f.unlink()
            deleted_pages += 1
        shutil.rmtree(pages_dir, ignore_errors=True)
        
    # Remove empty part_dir if empty
    try:
        if not any(part_dir.iterdir()):
            part_dir.rmdir()
    except Exception:
        pass

# Also clean any other png/jpg transcript scratch files in public/data or data/sources
for img_f in Path("data/sources/fbi").glob("*.jpg"):
    img_f.unlink()
    deleted_images += 1
for img_f in Path("data/sources/fbi").glob("*.png"):
    img_f.unlink()
    deleted_images += 1

print(f"\nCleanup Complete!")
print(f"  - Deleted {deleted_images} image files.")
print(f"  - Deleted {deleted_pages} individual page files.")
print(f"  - Consolidated archive preserved in:")
print(f"      • public/data/fbi/fbi_dossier_complete.md")
print(f"      • public/data/fbi/fbi_dossier_part_1.md")
print(f"      • public/data/fbi/fbi_dossier_part_2.md")
print(f"      • public/data/fbi/fbi_dossier_part_3.md")
print(f"      • public/data/fbi/fbi_dossier_part_4.md")
print(f"      • public/data/fbi/fbi_master_index.json")
