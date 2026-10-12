use std::fs;
use std::path::Path;
use std::sync::{Mutex, OnceLock};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

use regex::Regex;
use serde::Serialize;

#[derive(Clone, Serialize)]
pub struct NoteRecord {
    pub path: String,
    pub name: String,
    pub content: String,
    pub tags: Vec<String>,
    pub links: Vec<String>,
    #[serde(rename = "modifiedMs")]
    pub modified_ms: u64,
}

fn tag_pattern() -> &'static Regex {
    static PATTERN: OnceLock<Regex> = OnceLock::new();
    PATTERN.get_or_init(|| Regex::new(r"(?:^|\s)#([A-Za-z][\w/-]*)").unwrap())
}

fn link_pattern() -> &'static Regex {
    static PATTERN: OnceLock<Regex> = OnceLock::new();
    PATTERN.get_or_init(|| Regex::new(r"\[\[([^\[\]]+)\]\]").unwrap())
}

fn extract_tags(content: &str) -> Vec<String> {
    let mut tags: Vec<String> = tag_pattern()
        .captures_iter(content)
        .map(|c| c[1].to_string())
        .collect();
    tags.sort();
    tags.dedup();
    tags
}

fn extract_links(content: &str) -> Vec<String> {
    let mut links: Vec<String> = link_pattern()
        .captures_iter(content)
        .map(|c| c[1].trim().to_string())
        .collect();
    links.sort();
    links.dedup();
    links
}

type CachedNote = (SystemTime, u64, NoteRecord);
fn walk(dir: &Path, out: &mut Vec<NoteRecord>, cache: &HashMap<String, CachedNote>, next: &mut HashMap<String, CachedNote>) -> Result<(), String> {
    let mut entries: Vec<_> = fs::read_dir(dir)
        .map_err(|e| format!("Cannot read '{}': {}", dir.display(), e))?
        .filter_map(|e| e.ok())
        .collect();
    entries.sort_by_key(|e| e.file_name());

    for entry in entries {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') || entry.file_type().map_err(|e| e.to_string())?.is_symlink() {
            continue;
        }

        if path.is_dir() {
            walk(&path, out, cache, next)?;
        } else if path.extension().and_then(|e| e.to_str()) == Some("md") {
            let key = path.to_string_lossy().to_string();
            let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
            let modified = metadata.modified().map_err(|e| e.to_string())?;
            if let Some((mtime, len, note)) = cache.get(&key) {
                if *mtime == modified && *len == metadata.len() {
                    out.push(note.clone()); next.insert(key, (*mtime, *len, note.clone())); continue;
                }
            }
            let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            let stem = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or(&name)
                .to_string();

            let note = NoteRecord {
                path: path.to_string_lossy().to_string(),
                name: stem,
                tags: extract_tags(&content),
                links: extract_links(&content),
                content,
                modified_ms: modified.duration_since(UNIX_EPOCH).unwrap_or_default().as_millis() as u64,
            };
            next.insert(key, (modified, metadata.len(), note.clone()));
            out.push(note);
        }
    }

    Ok(())
}

/// Recursively scans the archive for every note, extracting `#tags` and
/// `[[links]]` along the way so callers (backlinks, tags pane, search,
/// quick switcher, graph view) can all work off one pass over the vault.
pub fn scan_archive(root: &str) -> Result<Vec<NoteRecord>, String> {
    let root_path = fs::canonicalize(root).map_err(|e| format!("Cannot access '{}': {}", root, e))?;
    static CACHE: OnceLock<Mutex<HashMap<String, CachedNote>>> = OnceLock::new();
    let mut cache = CACHE.get_or_init(|| Mutex::new(HashMap::new())).lock().map_err(|e| e.to_string())?;
    let mut notes = Vec::new();
    let mut next = HashMap::new();
    walk(&root_path, &mut notes, &cache, &mut next)?;
    *cache = next;
    Ok(notes)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("studio_notes_test_{}", name));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn cache_detects_edits_creates_renames_and_deletes() {
        let dir = temp_dir("cache");
        fs::write(dir.join("a.md"), "old").unwrap();
        let first = scan_archive(dir.to_str().unwrap()).unwrap();
        let start = std::time::Instant::now();
        let warm = scan_archive(dir.to_str().unwrap()).unwrap();
        eprintln!("warm metadata scan {:?}", start.elapsed());
        assert_eq!(first[0].content, warm[0].content);
        fs::write(dir.join("a.md"), "new longer content").unwrap();
        assert_eq!(scan_archive(dir.to_str().unwrap()).unwrap()[0].content, "new longer content");
        fs::rename(dir.join("a.md"), dir.join("b.md")).unwrap();
        assert_eq!(scan_archive(dir.to_str().unwrap()).unwrap()[0].name, "b");
        fs::create_dir(dir.join(".private")).unwrap();
        fs::write(dir.join(".private/secret.md"), "hidden").unwrap();
        fs::remove_file(dir.join("b.md")).unwrap();
        assert!(scan_archive(dir.to_str().unwrap()).unwrap().is_empty());
    }

    #[test]
    fn extracts_tags_and_ignores_headings() {
        let content = "# Heading\nSome #fiqh notes on #hadith/grading today.\n## Not a tag";
        let tags = extract_tags(content);
        assert_eq!(tags, vec!["fiqh".to_string(), "hadith/grading".to_string()]);
    }

    #[test]
    fn extracts_links() {
        let content = "See [[Tafsir Notes]] and [[Hadith Grading]] and [[Tafsir Notes]] again.";
        let links = extract_links(content);
        assert_eq!(links, vec!["Hadith Grading".to_string(), "Tafsir Notes".to_string()]);
    }

    #[test]
    fn scan_archive_walks_nested_notes() {
        let dir = temp_dir("scan");
        fs::write(dir.join("a.md"), "Links to [[B]] and tagged #fiqh").unwrap();
        let sub = dir.join("sub");
        fs::create_dir(&sub).unwrap();
        fs::write(sub.join("b.md"), "No links here").unwrap();
        fs::write(dir.join("ignore.txt"), "not a note").unwrap();

        let notes = scan_archive(dir.to_str().unwrap()).unwrap();
        let names: Vec<&str> = notes.iter().map(|n| n.name.as_str()).collect();

        assert_eq!(names, vec!["a", "b"]);
        assert_eq!(notes[0].links, vec!["B".to_string()]);
        assert_eq!(notes[0].tags, vec!["fiqh".to_string()]);
    }
}
