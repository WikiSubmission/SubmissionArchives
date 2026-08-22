use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use regex::Regex;
use serde_json::json;

use crate::archive::canonical;

fn unique_target(dir: &Path, file_name: &str) -> PathBuf {
    let path = Path::new(file_name);
    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("file")
        .to_string();
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| format!(".{}", e))
        .unwrap_or_default();

    let mut candidate = dir.join(file_name);
    let mut n = 1;
    while candidate.exists() {
        candidate = dir.join(format!("{} ({}){}", stem, n, ext));
        n += 1;
    }
    candidate
}

/// Strips Notion 32-character hexadecimal UUID suffixes, e.g.
/// "Tafsir Notes 3a7f8e9b0c1d2e3f4a5b6c7d8e9f0a1b" -> "Tafsir Notes"
pub fn clean_notion_name(raw_name: &str) -> String {
    let re = Regex::new(r"[\s_]+[0-9a-fA-F]{32}").unwrap();
    let cleaned = re.replace_all(raw_name, "");
    cleaned.trim().to_string()
}

/// Normalizes incoming file names:
/// - Strips Notion UUIDs
/// - `.txt` -> `.md`
/// - `.docx` -> `.md` (when converted)
fn normalized_name(name: &str) -> String {
    let cleaned = clean_notion_name(name);
    for txt_suffix in [".txt", ".TXT", ".Txt"] {
        if let Some(stem) = cleaned.strip_suffix(txt_suffix) {
            return format!("{}.md", stem);
        }
    }
    cleaned
}

/// Extracts text and basic formatting from a .docx file's word/document.xml
pub fn convert_docx_bytes_to_markdown(docx_bytes: &[u8]) -> Result<(String, Vec<(String, Vec<u8>)>), String> {
    let cursor = std::io::Cursor::new(docx_bytes);
    let mut archive = zip::ZipArchive::new(cursor).map_err(|e| format!("Invalid DOCX archive: {}", e))?;

    let mut document_xml = String::new();
    if let Ok(mut doc_entry) = archive.by_name("word/document.xml") {
        doc_entry.read_to_string(&mut document_xml).map_err(|e| e.to_string())?;
    } else {
        return Err("Could not find word/document.xml inside DOCX".to_string());
    }

    // Extract embedded media images if present
    let mut images = Vec::new();
    for i in 0..archive.len() {
        if let Ok(mut entry) = archive.by_index(i) {
            let name = entry.name().to_string();
            if name.starts_with("word/media/") {
                let img_name = name.strip_prefix("word/media/").unwrap_or("image.png").to_string();
                let mut buf = Vec::new();
                if entry.read_to_end(&mut buf).is_ok() {
                    images.push((img_name, buf));
                }
            }
        }
    }

    // Parse XML paragraph and run nodes into Markdown
    let mut markdown = String::new();
    
    // Split by paragraphs <w:p ...>
    let p_regex = Regex::new(r"<w:p\b[^>]*>(.*?)</w:p>").unwrap();
    let text_regex = Regex::new(r"<w:t\b[^>]*>(.*?)</w:t>").unwrap();
    let heading_regex = Regex::new(r#"<w:pStyle\b[^>]*w:val="Heading(\d)""#).unwrap();
    let bold_regex = Regex::new(r"<w:b\b[^/>]*(?:/>|>[^<]*</w:b>)").unwrap();
    let italic_regex = Regex::new(r"<w:i\b[^/>]*(?:/>|>[^<]*</w:i>)").unwrap();
    let r_regex = Regex::new(r"<w:r\b[^>]*>(.*?)</w:r>").unwrap();

    for p_cap in p_regex.captures_iter(&document_xml) {
        let p_content = &p_cap[1];
        
        let heading_level = heading_regex
            .captures(p_content)
            .and_then(|c| c[1].parse::<usize>().ok());

        let mut p_text = String::new();

        for r_cap in r_regex.captures_iter(p_content) {
            let r_content = &r_cap[1];
            let is_bold = bold_regex.is_match(r_content);
            let is_italic = italic_regex.is_match(r_content);

            let mut r_text = String::new();
            for t_cap in text_regex.captures_iter(r_content) {
                let raw_text = &t_cap[1];
                let decoded = raw_text
                    .replace("&lt;", "<")
                    .replace("&gt;", ">")
                    .replace("&amp;", "&")
                    .replace("&quot;", "\"")
                    .replace("&apos;", "'");
                r_text.push_str(&decoded);
            }

            if !r_text.is_empty() {
                if is_bold && is_italic {
                    p_text.push_str(&format!("***{}***", r_text));
                } else if is_bold {
                    p_text.push_str(&format!("**{}**", r_text));
                } else if is_italic {
                    p_text.push_str(&format!("*{}*", r_text));
                } else {
                    p_text.push_str(&r_text);
                }
            }
        }

        let p_text_trimmed = p_text.trim();
        if !p_text_trimmed.is_empty() {
            if let Some(level) = heading_level {
                let hashes = "#".repeat(level.clamp(1, 6));
                markdown.push_str(&format!("{} {}\n\n", hashes, p_text_trimmed));
            } else {
                markdown.push_str(&format!("{}\n\n", p_text_trimmed));
            }
        }
    }

    Ok((markdown.trim().to_string(), images))
}

/// Copies one or more files into the archive. Converts .docx into .md.
pub fn import_files(archive_root: &str, source_paths: Vec<String>) -> Result<Vec<String>, String> {
    let root = canonical(archive_root)?;
    let attachments_dir = root.join(".studio").join("attachments");
    fs::create_dir_all(&attachments_dir).map_err(|e| e.to_string())?;

    let mut imported = Vec::new();

    for source in source_paths {
        let source_path = canonical(&source)?;
        if !source_path.is_file() {
            return Err(format!("'{}' is not a file", source));
        }
        let raw_name = source_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("file")
            .to_string();

        let ext = source_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        if ext == "docx" {
            let docx_bytes = fs::read(&source_path).map_err(|e| format!("Cannot read DOCX: {}", e))?;
            let (markdown, images) = convert_docx_bytes_to_markdown(&docx_bytes)?;
            
            for (img_name, img_bytes) in images {
                let img_target = unique_target(&attachments_dir, &img_name);
                let _ = fs::write(img_target, img_bytes);
            }

            let stem = Path::new(&raw_name)
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("document");
            let target = unique_target(&root, &format!("{}.md", stem));
            fs::write(&target, markdown).map_err(|e| format!("Cannot write converted markdown: {}", e))?;
            imported.push(target.to_string_lossy().to_string());
        } else if ext == "sanote" {
            let note_path = import_sanote(archive_root, &source)?;
            imported.push(note_path);
        } else {
            let target = unique_target(&root, &normalized_name(&raw_name));
            fs::copy(&source_path, &target).map_err(|e| format!("Cannot import '{}': {}", source, e))?;
            imported.push(target.to_string_lossy().to_string());
        }
    }

    Ok(imported)
}

/// Extracts a ZIP into the archive root, preserving folder structure and cleaning Notion UUIDs.
pub fn import_zip(archive_root: &str, zip_path: &str) -> Result<Vec<String>, String> {
    let root = canonical(archive_root)?;
    let attachments_dir = root.join(".studio").join("attachments");
    fs::create_dir_all(&attachments_dir).map_err(|e| e.to_string())?;

    let zip_file =
        fs::File::open(canonical(zip_path)?).map_err(|e| format!("Cannot open ZIP: {}", e))?;
    let mut archive = zip::ZipArchive::new(zip_file).map_err(|e| format!("Invalid ZIP: {}", e))?;

    let mut imported = Vec::new();
    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        if entry.is_dir() {
            continue;
        }

        let Some(enclosed) = entry.enclosed_name() else {
            continue;
        };

        let file_name = enclosed
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("file")
            .to_string();

        let relative_dir = enclosed.parent().unwrap_or_else(|| Path::new(""));
        let cleaned_dir_str = clean_notion_name(&relative_dir.to_string_lossy());
        let target_dir = root.join(&cleaned_dir_str);
        fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

        let mut buffer = Vec::new();
        entry.read_to_end(&mut buffer).map_err(|e| e.to_string())?;

        if file_name.to_lowercase().ends_with(".docx") {
            if let Ok((markdown, images)) = convert_docx_bytes_to_markdown(&buffer) {
                for (img_name, img_bytes) in images {
                    let img_target = unique_target(&attachments_dir, &img_name);
                    let _ = fs::write(img_target, img_bytes);
                }
                let stem = Path::new(&file_name)
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("document");
                let target = unique_target(&target_dir, &format!("{}.md", clean_notion_name(stem)));
                let _ = fs::write(&target, markdown);
                imported.push(target.to_string_lossy().to_string());
                continue;
            }
        }

        let target = unique_target(&target_dir, &normalized_name(&file_name));
        fs::write(&target, buffer).map_err(|e| e.to_string())?;
        imported.push(target.to_string_lossy().to_string());
    }

    Ok(imported)
}

/// Bundles an existing note and its attachments into a self-contained .sanote zip bundle
pub fn export_sanote(archive_root: &str, note_path: &str, destination_path: &str) -> Result<(), String> {
    let _root = canonical(archive_root)?;
    let note_file = canonical(note_path)?;
    let content = fs::read_to_string(&note_file).map_err(|e| format!("Cannot read note: {}", e))?;

    let file = fs::File::create(destination_path).map_err(|e| format!("Cannot create bundle: {}", e))?;
    let mut writer = zip::ZipWriter::new(file);
    let options: zip::write::FileOptions<'_, ()> =
        zip::write::FileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    // 1. Write note.md
    writer.start_file("note.md", options).map_err(|e| e.to_string())?;
    writer.write_all(content.as_bytes()).map_err(|e| e.to_string())?;

    // 2. Write metadata.json
    let meta = json!({
        "version": "1.0",
        "exportedAt": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis(),
        "sourceNote": note_path
    });
    writer.start_file("metadata.json", options).map_err(|e| e.to_string())?;
    writer.write_all(meta.to_string().as_bytes()).map_err(|e| e.to_string())?;

    writer.finish().map_err(|e| e.to_string())?;
    Ok(())
}

/// Extracts a .sanote package into the archive root as an editable note
pub fn import_sanote(archive_root: &str, sanote_path: &str) -> Result<String, String> {
    let root = canonical(archive_root)?;
    let attachments_dir = root.join(".studio").join("attachments");
    fs::create_dir_all(&attachments_dir).map_err(|e| e.to_string())?;

    let file = fs::File::open(canonical(sanote_path)?).map_err(|e| format!("Cannot open .sanote: {}", e))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("Invalid .sanote package: {}", e))?;

    let mut note_content = String::new();
    if let Ok(mut entry) = archive.by_name("note.md") {
        entry.read_to_string(&mut note_content).map_err(|e| e.to_string())?;
    } else {
        return Err("Missing note.md inside .sanote bundle".to_string());
    }

    let stem = Path::new(sanote_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("imported-note");

    let target_note = unique_target(&root, &format!("{}.md", stem));
    fs::write(&target_note, note_content).map_err(|e| format!("Cannot write note: {}", e))?;

    // Extract attachments if present
    for i in 0..archive.len() {
        if let Ok(mut entry) = archive.by_index(i) {
            let name = entry.name().to_string();
            if name.starts_with("attachments/") && !entry.is_dir() {
                let file_name = Path::new(&name)
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("file");
                let target_att = unique_target(&attachments_dir, file_name);
                let mut buf = Vec::new();
                if entry.read_to_end(&mut buf).is_ok() {
                    let _ = fs::write(target_att, buf);
                }
            }
        }
    }

    Ok(target_note.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("studio_import_test_{}", name));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn cleans_notion_uuid_from_titles() {
        let raw = "Surah Kahf Commentary 3a7f8e9b0c1d2e3f4a5b6c7d8e9f0a1b.md";
        let cleaned = normalized_name(raw);
        assert_eq!(cleaned, "Surah Kahf Commentary.md");
    }

    #[test]
    fn sanote_roundtrip() {
        let archive = temp_dir("sanote_archive");
        let note_path = archive.join("test-note.md");
        fs::write(&note_path, "# Sample Content for Package").unwrap();

        let export_bundle = archive.join("package.sanote");
        export_sanote(archive.to_str().unwrap(), note_path.to_str().unwrap(), export_bundle.to_str().unwrap()).unwrap();
        assert!(export_bundle.exists());

        let imported_path = import_sanote(archive.to_str().unwrap(), export_bundle.to_str().unwrap()).unwrap();
        assert!(Path::new(&imported_path).exists());
        assert_eq!(fs::read_to_string(imported_path).unwrap(), "# Sample Content for Package");
    }
}
