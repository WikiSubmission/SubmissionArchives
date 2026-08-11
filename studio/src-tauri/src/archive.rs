use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize)]
pub struct Entry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct TrashEntry {
    pub id: String,
    pub name: String,
    pub original_path: String,
    pub trashed_at: u64,
}

pub(crate) fn canonical(path: &str) -> Result<PathBuf, String> {
    fs::canonicalize(path).map_err(|e| format!("Cannot access '{}': {}", path, e))
}

/// Lists the immediate children of `path`: subdirectories and files,
/// directories first, both sorted alphabetically. Dotfiles/dotfolders
/// (e.g. `.studio/`) are hidden, but otherwise every file type is shown —
/// the archive is a general file browser, not markdown-only.
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
        let _ = canonical(&parent.to_string_lossy());
    }
    let temp_path = target.with_extension("tmp");
    fs::write(&temp_path, content)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    if let Ok(file) = fs::File::open(&temp_path) {
        let _ = file.sync_all();
    }

    fs::rename(&temp_path, target)
        .map_err(|e| format!("Failed to atomically update '{}': {}", path, e))?;

    Ok(())
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

/// Duplicates a note alongside itself as "Name (copy).md", "Name (copy 2).md", etc.
pub fn duplicate_note(path: &str) -> Result<String, String> {
    let file = canonical(path)?;
    if !file.is_file() {
        return Err(format!("'{}' is not a file", path));
    }

    let parent = file
        .parent()
        .ok_or_else(|| "File has no parent directory".to_string())?
        .to_path_buf();
    let stem = file
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("note")
        .to_string();
    let ext = file
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| format!(".{}", e))
        .unwrap_or_default();

    let mut n = 1;
    let target = loop {
        let suffix = if n == 1 {
            " (copy)".to_string()
        } else {
            format!(" (copy {})", n)
        };
        let candidate = parent.join(format!("{}{}{}", stem, suffix, ext));
        if !candidate.exists() {
            break candidate;
        }
        n += 1;
    };

    fs::copy(&file, &target).map_err(|e| format!("Cannot duplicate '{}': {}", path, e))?;
    Ok(target.to_string_lossy().to_string())
}

/// Moves a note into a different folder, rejecting the move if a file with
/// the same name already exists there.
pub fn move_note(path: &str, target_dir: &str) -> Result<String, String> {
    let file = canonical(path)?;
    if !file.is_file() {
        return Err(format!("'{}' is not a file", path));
    }

    let dir = canonical(target_dir)?;
    if !dir.is_dir() {
        return Err(format!("'{}' is not a directory", target_dir));
    }

    let name = file
        .file_name()
        .ok_or_else(|| "File has no name".to_string())?;
    let target = dir.join(name);
    if target.exists() {
        return Err(format!(
            "'{}' already exists in the target folder",
            name.to_string_lossy()
        ));
    }

    fs::rename(&file, &target).map_err(|e| format!("Cannot move '{}': {}", path, e))?;
    Ok(target.to_string_lossy().to_string())
}

fn trash_dir(root: &Path) -> PathBuf {
    root.join(".studio").join("trash")
}

fn now_epoch_secs() -> Result<u64, String> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .map_err(|e| e.to_string())
}

/// Moves a note into `<archive>/.studio/trash/<entry-id>/`, recording its
/// original relative path in a sidecar `meta.json` so it can find its way
/// back on restore. This is a move, not a delete — nothing is destroyed
/// until `permanently_delete_trash_entry` is called explicitly.
pub fn trash_note(archive_root: &str, path: &str) -> Result<(), String> {
    let root = canonical(archive_root)?;
    let file = canonical(path)?;
    if !file.is_file() {
        return Err(format!("'{}' is not a file", path));
    }

    let relative = file
        .strip_prefix(&root)
        .map_err(|_| "File is not inside the archive".to_string())?
        .to_string_lossy()
        .to_string();
    let name = file
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("file")
        .to_string();

    let trash_root = trash_dir(&root);
    fs::create_dir_all(&trash_root).map_err(|e| e.to_string())?;

    let epoch = now_epoch_secs()?;
    let mut suffix = 0;
    let entry_dir = loop {
        let id = if suffix == 0 {
            format!("{}-{}", epoch, name)
        } else {
            format!("{}-{}-{}", epoch, name, suffix)
        };
        let candidate = trash_root.join(&id);
        if !candidate.exists() {
            break candidate;
        }
        suffix += 1;
    };
    let entry_id = entry_dir
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("entry")
        .to_string();

    fs::create_dir_all(&entry_dir).map_err(|e| e.to_string())?;
    fs::rename(&file, entry_dir.join(&name))
        .map_err(|e| format!("Cannot move '{}' to trash: {}", path, e))?;

    let meta = TrashEntry {
        id: entry_id,
        name,
        original_path: relative,
        trashed_at: epoch,
    };
    let meta_json = serde_json::to_string_pretty(&meta).map_err(|e| e.to_string())?;
    fs::write(entry_dir.join("meta.json"), meta_json).map_err(|e| e.to_string())?;

    Ok(())
}

/// Lists trashed notes, most recently trashed first.
pub fn list_trash(archive_root: &str) -> Result<Vec<TrashEntry>, String> {
    let root = canonical(archive_root)?;
    let trash_root = trash_dir(&root);
    if !trash_root.is_dir() {
        return Ok(Vec::new());
    }

    let mut entries = Vec::new();
    for entry in fs::read_dir(&trash_root).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if let Ok(raw) = fs::read_to_string(entry.path().join("meta.json")) {
            if let Ok(meta) = serde_json::from_str::<TrashEntry>(&raw) {
                entries.push(meta);
            }
        }
    }
    entries.sort_by(|a, b| b.trashed_at.cmp(&a.trashed_at));
    Ok(entries)
}

/// Restores a trashed note to its original relative path. If that spot is
/// occupied again, restores alongside it as "Name (restored N).md" instead
/// of overwriting whatever's there now.
pub fn restore_note(archive_root: &str, entry_id: &str) -> Result<String, String> {
    let root = canonical(archive_root)?;
    let entry_dir = trash_dir(&root).join(entry_id);
    let meta_raw = fs::read_to_string(entry_dir.join("meta.json"))
        .map_err(|e| format!("Cannot read trash entry '{}': {}", entry_id, e))?;
    let meta: TrashEntry = serde_json::from_str(&meta_raw).map_err(|e| e.to_string())?;

    let source = entry_dir.join(&meta.name);
    let mut target = root.join(&meta.original_path);
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    if target.exists() {
        let parent = target
            .parent()
            .map(|p| p.to_path_buf())
            .unwrap_or_else(|| root.clone());
        let stem = target
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("restored")
            .to_string();
        let ext = target
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| format!(".{}", e))
            .unwrap_or_default();

        let mut n = 1;
        target = loop {
            let candidate = parent.join(format!("{} (restored {}){}", stem, n, ext));
            if !candidate.exists() {
                break candidate;
            }
            n += 1;
        };
    }

    fs::rename(&source, &target).map_err(|e| format!("Cannot restore '{}': {}", entry_id, e))?;
    fs::remove_dir_all(&entry_dir).ok();
    Ok(target.to_string_lossy().to_string())
}

/// Permanently deletes a trashed note. There is no undo past this point.
pub fn permanently_delete_trash_entry(archive_root: &str, entry_id: &str) -> Result<(), String> {
    let root = canonical(archive_root)?;
    let entry_dir = trash_dir(&root).join(entry_id);
    fs::remove_dir_all(&entry_dir)
        .map_err(|e| format!("Cannot delete trash entry '{}': {}", entry_id, e))
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

/// Reads the user's optional custom theme at `<archive_root>/.studio/theme.css`.
/// Returns `None` if the archive doesn't have one — this is an opt-in
/// customization, not an error condition.
pub fn read_theme_css(archive_root: &str) -> Option<String> {
    let root = canonical(archive_root).ok()?;
    fs::read_to_string(root.join(".studio").join("theme.css")).ok()
}

/// Reads the user's settings at `<archive_root>/.studio/settings.json` as a
/// raw JSON string — the frontend owns the schema and defaults, Rust just
/// persists whatever it's given.
pub fn read_settings(archive_root: &str) -> Option<String> {
    let root = canonical(archive_root).ok()?;
    fs::read_to_string(root.join(".studio").join("settings.json")).ok()
}

pub fn write_settings(archive_root: &str, json: &str) -> Result<(), String> {
    let root = canonical(archive_root)?;
    let studio_dir = root.join(".studio");
    fs::create_dir_all(&studio_dir).map_err(|e| e.to_string())?;
    fs::write(studio_dir.join("settings.json"), json).map_err(|e| e.to_string())
}

/// Copies a PDF into `<archive>/.studio/attachments/` for a note to reference.
/// Data plumbing for a future side-by-side PDF view — returns the absolute
/// path to the copy so a note's frontmatter can point at it.
pub fn attach_pdf_to_note(archive_root: &str, pdf_source_path: &str) -> Result<String, String> {
    let root = canonical(archive_root)?;
    let source = canonical(pdf_source_path)?;
    if !source.is_file() {
        return Err(format!("'{}' is not a file", pdf_source_path));
    }

    let attachments_dir = root.join(".studio").join("attachments");
    fs::create_dir_all(&attachments_dir).map_err(|e| e.to_string())?;

    let name = source
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("attachment.pdf")
        .to_string();
    let stem = source
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("attachment")
        .to_string();
    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| format!(".{}", e))
        .unwrap_or_default();

    let mut target = attachments_dir.join(&name);
    let mut n = 1;
    while target.exists() {
        target = attachments_dir.join(format!("{} ({}){}", stem, n, ext));
        n += 1;
    }

    fs::copy(&source, &target).map_err(|e| format!("Cannot attach '{}': {}", pdf_source_path, e))?;
    Ok(target.to_string_lossy().to_string())
}

fn icons_path(root: &Path) -> PathBuf {
    root.join(".studio").join("icons.json")
}

/// Custom folder icons, keyed by the folder's absolute path (simplest thing
/// that works — avoids reconciling relative-path separators between Rust and
/// the frontend; the tradeoff is icons don't survive moving the archive to a
/// different location on disk, which is an acceptable rare edge case).
pub fn read_folder_icons(archive_root: &str) -> HashMap<String, String> {
    let Ok(root) = canonical(archive_root) else {
        return HashMap::new();
    };
    let Ok(raw) = fs::read_to_string(icons_path(&root)) else {
        return HashMap::new();
    };
    serde_json::from_str(&raw).unwrap_or_default()
}

/// Sets a folder's custom icon, or clears it when `icon` is `None`/blank.
pub fn set_folder_icon(archive_root: &str, folder_path: &str, icon: Option<String>) -> Result<(), String> {
    let root = canonical(archive_root)?;
    let folder = canonical(folder_path)?;
    let key = folder.to_string_lossy().to_string();

    let mut icons = read_folder_icons(archive_root);
    match icon {
        Some(value) if !value.trim().is_empty() => {
            icons.insert(key, value.trim().to_string());
        }
        _ => {
            icons.remove(&key);
        }
    }

    let studio_dir = root.join(".studio");
    fs::create_dir_all(&studio_dir).map_err(|e| e.to_string())?;
    let json = serde_json::to_string_pretty(&icons).map_err(|e| e.to_string())?;
    fs::write(icons_path(&root), json).map_err(|e| e.to_string())
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
    fn lists_dirs_first_then_all_non_dot_files() {
        let dir = temp_dir("list");
        fs::write(dir.join("note.md"), "hello").unwrap();
        fs::write(dir.join("scan.pdf"), "hello").unwrap();
        fs::create_dir(dir.join("subfolder")).unwrap();
        fs::write(dir.join(".hidden.md"), "hello").unwrap();

        let entries = list_directory(dir.to_str().unwrap()).unwrap();
        let names: Vec<&str> = entries.iter().map(|e| e.name.as_str()).collect();

        assert_eq!(names, vec!["subfolder", "note.md", "scan.pdf"]);
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
    fn read_theme_css_returns_none_when_absent() {
        let dir = temp_dir("theme_absent");
        assert!(read_theme_css(dir.to_str().unwrap()).is_none());
    }

    #[test]
    fn read_theme_css_returns_contents_when_present() {
        let dir = temp_dir("theme_present");
        let studio_dir = dir.join(".studio");
        fs::create_dir(&studio_dir).unwrap();
        fs::write(studio_dir.join("theme.css"), ":root { --ed-accent: #ff0000; }").unwrap();

        assert_eq!(
            read_theme_css(dir.to_str().unwrap()).unwrap(),
            ":root { --ed-accent: #ff0000; }"
        );
    }

    #[test]
    fn duplicate_note_appends_copy_suffix() {
        let dir = temp_dir("dup");
        let original = dir.join("Note.md");
        fs::write(&original, "content").unwrap();

        let first = duplicate_note(original.to_str().unwrap()).unwrap();
        assert!(first.ends_with("Note (copy).md"));

        let second = duplicate_note(original.to_str().unwrap()).unwrap();
        assert!(second.ends_with("Note (copy 2).md"));
        assert_eq!(read_note(&second).unwrap(), "content");
    }

    #[test]
    fn move_note_relocates_and_rejects_name_collision() {
        let dir = temp_dir("move");
        let sub = dir.join("target");
        fs::create_dir(&sub).unwrap();
        let file = dir.join("note.md");
        fs::write(&file, "hello").unwrap();

        let moved = move_note(file.to_str().unwrap(), sub.to_str().unwrap()).unwrap();
        assert!(moved.ends_with("target/note.md") || moved.ends_with("target\\note.md"));
        assert!(!file.exists());

        fs::write(dir.join("note.md"), "new file").unwrap();
        let moved_path = PathBuf::from(&moved);
        let err = move_note(&moved, dir.to_str().unwrap());
        // Moving back should fail since "note.md" now exists at the destination again.
        assert!(err.is_err());
        assert!(moved_path.exists());
    }

    #[test]
    fn trash_and_restore_roundtrip() {
        let dir = temp_dir("trash_roundtrip");
        let sub = dir.join("nested");
        fs::create_dir(&sub).unwrap();
        let file = sub.join("note.md");
        fs::write(&file, "content").unwrap();

        trash_note(dir.to_str().unwrap(), file.to_str().unwrap()).unwrap();
        assert!(!file.exists());

        let entries = list_trash(dir.to_str().unwrap()).unwrap();
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].name, "note.md");
        assert!(entries[0].original_path.ends_with("note.md"));

        let restored = restore_note(dir.to_str().unwrap(), &entries[0].id).unwrap();
        assert!(PathBuf::from(&restored).exists());
        assert_eq!(read_note(&restored).unwrap(), "content");
        assert_eq!(list_trash(dir.to_str().unwrap()).unwrap().len(), 0);
    }

    #[test]
    fn restore_note_avoids_overwriting_occupied_spot() {
        let dir = temp_dir("trash_restore_conflict");
        let file = dir.join("note.md");
        fs::write(&file, "original").unwrap();

        trash_note(dir.to_str().unwrap(), file.to_str().unwrap()).unwrap();
        fs::write(&file, "someone recreated this").unwrap();

        let entries = list_trash(dir.to_str().unwrap()).unwrap();
        let restored = restore_note(dir.to_str().unwrap(), &entries[0].id).unwrap();

        assert!(restored.contains("restored"));
        assert_eq!(read_note(&restored).unwrap(), "original");
        assert_eq!(read_note(file.to_str().unwrap()).unwrap(), "someone recreated this");
    }

    #[test]
    fn permanently_delete_trash_entry_removes_it_for_good() {
        let dir = temp_dir("trash_permanent");
        let file = dir.join("note.md");
        fs::write(&file, "content").unwrap();

        trash_note(dir.to_str().unwrap(), file.to_str().unwrap()).unwrap();
        let entries = list_trash(dir.to_str().unwrap()).unwrap();

        permanently_delete_trash_entry(dir.to_str().unwrap(), &entries[0].id).unwrap();
        assert_eq!(list_trash(dir.to_str().unwrap()).unwrap().len(), 0);
    }

    #[test]
    fn settings_roundtrip() {
        let dir = temp_dir("settings");
        assert!(read_settings(dir.to_str().unwrap()).is_none());

        write_settings(dir.to_str().unwrap(), r#"{"quran":{"arabicSize":30}}"#).unwrap();
        assert_eq!(
            read_settings(dir.to_str().unwrap()).unwrap(),
            r#"{"quran":{"arabicSize":30}}"#
        );
    }

    #[test]
    fn attach_pdf_to_note_copies_into_attachments_and_dedupes() {
        let dir = temp_dir("attach_pdf");
        let source_dir = temp_dir("attach_pdf_source");
        let pdf = source_dir.join("book.pdf");
        fs::write(&pdf, "fake pdf bytes").unwrap();

        let first = attach_pdf_to_note(dir.to_str().unwrap(), pdf.to_str().unwrap()).unwrap();
        assert!(first.ends_with("book.pdf"));
        assert!(first.contains(".studio"));

        let second = attach_pdf_to_note(dir.to_str().unwrap(), pdf.to_str().unwrap()).unwrap();
        assert!(second.ends_with("book (1).pdf"));
    }

    #[test]
    fn folder_icon_roundtrip() {
        let dir = temp_dir("icons");
        let sub = dir.join("Fiqh");
        fs::create_dir(&sub).unwrap();

        assert!(read_folder_icons(dir.to_str().unwrap()).is_empty());

        set_folder_icon(dir.to_str().unwrap(), sub.to_str().unwrap(), Some("📖".to_string())).unwrap();
        let icons = read_folder_icons(dir.to_str().unwrap());
        assert_eq!(icons.len(), 1);
        assert_eq!(icons.values().next().unwrap(), "📖");

        set_folder_icon(dir.to_str().unwrap(), sub.to_str().unwrap(), None).unwrap();
        assert!(read_folder_icons(dir.to_str().unwrap()).is_empty());
    }

    #[test]
    fn resolve_wiki_link_creates_when_missing() {
        let dir = temp_dir("wiki_create");
        let created = resolve_wiki_link(dir.to_str().unwrap(), "Brand New Page").unwrap();
        assert!(created.ends_with("Brand New Page.md"));
        assert_eq!(read_note(&created).unwrap(), "# Brand New Page\n");
    }
}
