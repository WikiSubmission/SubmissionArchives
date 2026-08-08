use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::Serialize;

use crate::archive::canonical;

#[derive(Clone, Serialize)]
pub struct HistoryEntry {
    pub timestamp: u64,
    pub path: String,
}

const MIN_INTERVAL_SECS: u64 = 60;
const MAX_SNAPSHOTS: usize = 20;

fn now_epoch_secs() -> Result<u64, String> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .map_err(|e| e.to_string())
}

fn history_dir(archive_root: &Path, note_path: &Path) -> Result<PathBuf, String> {
    let relative = note_path
        .strip_prefix(archive_root)
        .map_err(|_| "Note is not inside the archive".to_string())?;
    Ok(archive_root.join(".studio").join("history").join(relative))
}

fn list_snapshots(dir: &Path) -> Vec<(u64, PathBuf)> {
    let Ok(read) = fs::read_dir(dir) else {
        return Vec::new();
    };
    let mut snapshots: Vec<(u64, PathBuf)> = read
        .filter_map(|e| e.ok())
        .filter_map(|e| {
            let path = e.path();
            let stem = path.file_stem()?.to_str()?;
            let epoch: u64 = stem.parse().ok()?;
            Some((epoch, path))
        })
        .collect();
    snapshots.sort_by_key(|(epoch, _)| *epoch);
    snapshots
}

/// Best-effort checkpoint, meant to be called right after a successful
/// `write_note`. Only snapshots if content actually changed since the last
/// snapshot AND enough time has passed — otherwise autosave's 500ms debounce
/// would create a snapshot on every keystroke pause instead of a meaningful
/// history point.
pub fn snapshot_note(archive_root: &str, note_path: &str, content: &str) -> Result<(), String> {
    let root = canonical(archive_root)?;
    let note = canonical(note_path)?;
    let dir = history_dir(&root, &note)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let mut snapshots = list_snapshots(&dir);
    let now = now_epoch_secs()?;

    if let Some((last_epoch, last_path)) = snapshots.last() {
        let unchanged = fs::read_to_string(last_path)
            .map(|c| c == content)
            .unwrap_or(false);
        if unchanged || now.saturating_sub(*last_epoch) < MIN_INTERVAL_SECS {
            return Ok(());
        }
    }

    let snapshot_path = dir.join(format!("{}.md", now));
    fs::write(&snapshot_path, content).map_err(|e| e.to_string())?;
    snapshots.push((now, snapshot_path));

    if snapshots.len() > MAX_SNAPSHOTS {
        for (_, path) in snapshots.iter().take(snapshots.len() - MAX_SNAPSHOTS) {
            let _ = fs::remove_file(path);
        }
    }

    Ok(())
}

/// Lists snapshots for a note, most recent first.
pub fn list_note_history(archive_root: &str, note_path: &str) -> Result<Vec<HistoryEntry>, String> {
    let root = canonical(archive_root)?;
    let note = canonical(note_path)?;
    let dir = history_dir(&root, &note)?;

    let mut snapshots = list_snapshots(&dir);
    snapshots.sort_by_key(|(epoch, _)| std::cmp::Reverse(*epoch));
    Ok(snapshots
        .into_iter()
        .map(|(timestamp, path)| HistoryEntry {
            timestamp,
            path: path.to_string_lossy().to_string(),
        })
        .collect())
}

/// Overwrites the live note with a snapshot's content.
pub fn restore_note_version(snapshot_path: &str, note_path: &str) -> Result<(), String> {
    let content = fs::read_to_string(canonical(snapshot_path)?).map_err(|e| e.to_string())?;
    fs::write(Path::new(note_path), content).map_err(|e| format!("Cannot restore '{}': {}", note_path, e))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("studio_history_test_{}", name));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn snapshot_note_creates_first_snapshot() {
        let dir = temp_dir("first");
        let note = dir.join("note.md");
        fs::write(&note, "v1").unwrap();

        snapshot_note(dir.to_str().unwrap(), note.to_str().unwrap(), "v1").unwrap();
        let history = list_note_history(dir.to_str().unwrap(), note.to_str().unwrap()).unwrap();
        assert_eq!(history.len(), 1);
    }

    #[test]
    fn snapshot_note_skips_when_content_unchanged() {
        let dir = temp_dir("unchanged");
        let note = dir.join("note.md");
        fs::write(&note, "v1").unwrap();

        snapshot_note(dir.to_str().unwrap(), note.to_str().unwrap(), "v1").unwrap();
        snapshot_note(dir.to_str().unwrap(), note.to_str().unwrap(), "v1").unwrap();

        let history = list_note_history(dir.to_str().unwrap(), note.to_str().unwrap()).unwrap();
        assert_eq!(history.len(), 1);
    }

    #[test]
    fn restore_note_version_overwrites_live_note() {
        let dir = temp_dir("restore");
        let note = dir.join("note.md");
        fs::write(&note, "v1").unwrap();
        snapshot_note(dir.to_str().unwrap(), note.to_str().unwrap(), "v1").unwrap();

        fs::write(&note, "v2 (unsaved history point)").unwrap();
        let history = list_note_history(dir.to_str().unwrap(), note.to_str().unwrap()).unwrap();

        restore_note_version(&history[0].path, note.to_str().unwrap()).unwrap();
        assert_eq!(fs::read_to_string(&note).unwrap(), "v1");
    }
}
