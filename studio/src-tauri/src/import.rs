use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};

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

/// `.txt` becomes `.md` (Studio's native note format); everything else keeps
/// its own extension, since the archive is a general file browser.
fn normalized_name(name: &str) -> String {
    for txt_suffix in [".txt", ".TXT", ".Txt"] {
        if let Some(stem) = name.strip_suffix(txt_suffix) {
            return format!("{}.md", stem);
        }
    }
    name.to_string()
}

/// Copies one or more arbitrary files into the archive root.
pub fn import_files(archive_root: &str, source_paths: Vec<String>) -> Result<Vec<String>, String> {
    let root = canonical(archive_root)?;
    let mut imported = Vec::new();

    for source in source_paths {
        let source_path = canonical(&source)?;
        if !source_path.is_file() {
            return Err(format!("'{}' is not a file", source));
        }
        let name = source_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("file")
            .to_string();
        let target = unique_target(&root, &normalized_name(&name));
        fs::copy(&source_path, &target).map_err(|e| format!("Cannot import '{}': {}", source, e))?;
        imported.push(target.to_string_lossy().to_string());
    }

    Ok(imported)
}

/// Extracts a ZIP into the archive root. Directory structure inside the ZIP
/// is preserved; each file is renamed the same way `import_files` would.
/// Entries with unsafe paths (e.g. `../../etc/passwd`) are skipped rather
/// than failing the whole import.
pub fn import_zip(archive_root: &str, zip_path: &str) -> Result<Vec<String>, String> {
    let root = canonical(archive_root)?;
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
        let target_dir = root.join(relative_dir);
        fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

        let target = unique_target(&target_dir, &normalized_name(&file_name));
        let mut buffer = Vec::new();
        entry.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
        fs::write(&target, buffer).map_err(|e| e.to_string())?;
        imported.push(target.to_string_lossy().to_string());
    }

    Ok(imported)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("studio_import_test_{}", name));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn import_files_copies_and_renames_txt_to_md() {
        let archive = temp_dir("files_archive");
        let source_dir = temp_dir("files_source");
        let txt = source_dir.join("notes.txt");
        let md = source_dir.join("already.md");
        fs::write(&txt, "plain text").unwrap();
        fs::write(&md, "# already markdown").unwrap();

        let imported = import_files(
            archive.to_str().unwrap(),
            vec![
                txt.to_str().unwrap().to_string(),
                md.to_str().unwrap().to_string(),
            ],
        )
        .unwrap();

        assert!(imported[0].ends_with("notes.md"));
        assert!(imported[1].ends_with("already.md"));
        assert_eq!(fs::read_to_string(&imported[0]).unwrap(), "plain text");
    }

    #[test]
    fn import_files_avoids_name_collision() {
        let archive = temp_dir("files_collision");
        fs::write(archive.join("notes.md"), "existing").unwrap();

        let source_dir = temp_dir("files_collision_source");
        let txt = source_dir.join("notes.txt");
        fs::write(&txt, "incoming").unwrap();

        let imported = import_files(archive.to_str().unwrap(), vec![txt.to_str().unwrap().to_string()]).unwrap();
        assert!(imported[0].ends_with("notes (1).md"));
        assert_eq!(fs::read_to_string(archive.join("notes.md")).unwrap(), "existing");
    }

    #[test]
    fn import_zip_extracts_nested_structure() {
        let archive = temp_dir("zip_archive");
        let zip_path = temp_dir("zip_source").join("bundle.zip");

        let file = fs::File::create(&zip_path).unwrap();
        let mut writer = zip::ZipWriter::new(file);
        let options: zip::write::FileOptions<'_, ()> =
            zip::write::FileOptions::default().compression_method(zip::CompressionMethod::Deflated);

        writer.start_file("root.md", options).unwrap();
        writer.write_all(b"# root").unwrap();
        writer.start_file("nested/child.txt", options).unwrap();
        writer.write_all(b"child content").unwrap();
        writer.finish().unwrap();

        let imported = import_zip(archive.to_str().unwrap(), zip_path.to_str().unwrap()).unwrap();
        assert_eq!(imported.len(), 2);
        assert!(archive.join("root.md").exists());
        assert!(archive.join("nested").join("child.md").exists());
        assert_eq!(
            fs::read_to_string(archive.join("nested").join("child.md")).unwrap(),
            "child content"
        );
    }
}
