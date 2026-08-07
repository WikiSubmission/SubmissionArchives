use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;

#[derive(Clone, Serialize)]
pub struct Entry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
}

fn canonical(path: &str) -> Result<PathBuf, String> {
    fs::canonicalize(path).map_err(|e| format!("Cannot access '{}': {}", path, e))
}

/// Lists the immediate children of `path`: subdirectories and `.md` files only,
/// directories first, both sorted alphabetically.
pub fn list_directory(path: &str) -> Result<Vec<Entry>, String> {
    let dir = canonical(path)?;
    if !dir.is_dir() {
        return Err(format!("'{}' is not a directory", path));
    }

    let mut dirs = Vec::new();
    let mut files = Vec::new();

    for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let entry_path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        if name.starts_with('.') {
            continue;
        }

        let is_dir = entry_path.is_dir();
        if !is_dir && entry_path.extension().and_then(|e| e.to_str()) != Some("md") {
            continue;
        }

        let item = Entry {
            name,
            path: entry_path.to_string_lossy().to_string(),
            is_dir,
        };

        if is_dir {
            dirs.push(item);
        } else {
            files.push(item);
        }
    }

    dirs.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    dirs.extend(files);
    Ok(dirs)
}

pub fn read_note(path: &str) -> Result<String, String> {
    let file = canonical(path)?;
    if !file.is_file() {
        return Err(format!("'{}' is not a file", path));
    }
    fs::read_to_string(&file).map_err(|e| format!("Cannot read '{}': {}", path, e))
}

pub fn write_note(path: &str, content: &str) -> Result<(), String> {
    let target = Path::new(path);
    if let Some(parent) = target.parent() {
        canonical(&parent.to_string_lossy())?;
    }
    fs::write(target, content).map_err(|e| format!("Cannot write '{}': {}", path, e))
}

pub fn create_note(dir: &str, name: &str) -> Result<String, String> {
    let dir_path = canonical(dir)?;
    if !dir_path.is_dir() {
        return Err(format!("'{}' is not a directory", dir));
    }

    let file_name = if name.ends_with(".md") {
        name.to_string()
    } else {
        format!("{}.md", name)
    };

    let target = dir_path.join(&file_name);
    if target.exists() {
        return Err(format!("'{}' already exists", file_name));
    }

    fs::write(&target, "").map_err(|e| format!("Cannot create '{}': {}", file_name, e))?;
    Ok(target.to_string_lossy().to_string())
}

fn find_note_recursive(dir: &Path, target_stem: &str) -> Option<PathBuf> {
    let entries = fs::read_dir(dir).ok()?;
    let mut subdirs = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }

        if path.is_dir() {
            subdirs.push(path);
        } else if path.extension().and_then(|e| e.to_str()) == Some("md") {
            if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                if stem.eq_ignore_ascii_case(target_stem) {
                    return Some(path);
                }
            }
        }
    }

    for subdir in subdirs {
        if let Some(found) = find_note_recursive(&subdir, target_stem) {
            return Some(found);
        }
    }

    None
}

/// Resolves a `[[Page Name]]` wiki-link to a note path within the archive,
/// searching recursively. Creates the note at the archive root if it doesn't exist.
pub fn resolve_wiki_link(archive_root: &str, page_name: &str) -> Result<String, String> {
    let root = canonical(archive_root)?;

    if let Some(found) = find_note_recursive(&root, page_name) {
        return Ok(found.to_string_lossy().to_string());
    }

    let target = root.join(format!("{}.md", page_name));
    fs::write(&target, format!("# {}\n", page_name))
        .map_err(|e| format!("Cannot create '{}': {}", page_name, e))?;
    Ok(target.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("studio_test_{}", name));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn lists_dirs_and_md_files_only() {
        let dir = temp_dir("list");
        fs::write(dir.join("note.md"), "hello").unwrap();
        fs::write(dir.join("ignore.txt"), "hello").unwrap();
        fs::create_dir(dir.join("subfolder")).unwrap();
        fs::write(dir.join(".hidden.md"), "hello").unwrap();

        let entries = list_directory(dir.to_str().unwrap()).unwrap();
        let names: Vec<&str> = entries.iter().map(|e| e.name.as_str()).collect();

        assert_eq!(names, vec!["subfolder", "note.md"]);
    }

    #[test]
    fn read_write_roundtrip() {
        let dir = temp_dir("rw");
        let file = dir.join("note.md");
        fs::write(&file, "initial").unwrap();

        write_note(file.to_str().unwrap(), "# Hello\n\nWorld").unwrap();
        let content = read_note(file.to_str().unwrap()).unwrap();
        assert_eq!(content, "# Hello\n\nWorld");
    }

    #[test]
    fn create_note_rejects_duplicate() {
        let dir = temp_dir("create");
        let path = create_note(dir.to_str().unwrap(), "New Note").unwrap();
        assert!(path.ends_with("New Note.md"));
        assert!(create_note(dir.to_str().unwrap(), "New Note").is_err());
    }

    #[test]
    fn resolve_wiki_link_finds_nested_note() {
        let dir = temp_dir("wiki_find");
        let sub = dir.join("nested");
        fs::create_dir(&sub).unwrap();
        fs::write(sub.join("Target Page.md"), "# Target Page").unwrap();

        let found = resolve_wiki_link(dir.to_str().unwrap(), "target page").unwrap();
        assert!(found.ends_with("Target Page.md"));
    }

    #[test]
    fn resolve_wiki_link_creates_when_missing() {
        let dir = temp_dir("wiki_create");
        let created = resolve_wiki_link(dir.to_str().unwrap(), "Brand New Page").unwrap();
        assert!(created.ends_with("Brand New Page.md"));
        assert_eq!(read_note(&created).unwrap(), "# Brand New Page\n");
    }
}
