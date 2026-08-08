use std::fs;
use std::path::Path;
use std::sync::OnceLock;

use regex::Regex;
use serde::Serialize;

#[derive(Clone, Serialize)]
pub struct NoteRecord {
    pub path: String,
    pub name: String,
    pub content: String,
    pub tags: Vec<String>,
    pub links: Vec<String>,
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

fn walk(dir: &Path, out: &mut Vec<NoteRecord>) -> Result<(), String> {
    let mut entries: Vec<_> = fs::read_dir(dir)
        .map_err(|e| format!("Cannot read '{}': {}", dir.display(), e))?
        .filter_map(|e| e.ok())
        .collect();
    entries.sort_by_key(|e| e.file_name());

    for entry in entries {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }

        if path.is_dir() {
            walk(&path, out)?;
        } else if path.extension().and_then(|e| e.to_str()) == Some("md") {
            let content = fs::read_to_string(&path).unwrap_or_default();
            let stem = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or(&name)
                .to_string();

            out.push(NoteRecord {
                path: path.to_string_lossy().to_string(),
                name: stem,
                tags: extract_tags(&content),
                links: extract_links(&content),
                content,
            });
        }
    }

    Ok(())
}

/// Recursively scans the archive for every note, extracting `#tags` and
/// `[[links]]` along the way so callers (backlinks, tags pane, search,
/// quick switcher, graph view) can all work off one pass over the vault.
pub fn scan_archive(root: &str) -> Result<Vec<NoteRecord>, String> {
    let root_path = fs::canonicalize(root).map_err(|e| format!("Cannot access '{}': {}", root, e))?;
    let mut notes = Vec::new();
    walk(&root_path, &mut notes)?;
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
