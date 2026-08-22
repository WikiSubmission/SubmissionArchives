use serde::Serialize;
use std::collections::HashSet;
use crate::notes;

#[derive(Debug, Clone, Serialize)]
pub struct BrokenLink {
    pub note_path: String,
    pub target: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct HealthReport {
    pub broken_links: Vec<BrokenLink>,
    pub empty_notes: Vec<String>,
    pub total_notes: usize,
}

pub fn check_vault_health(archive_root: &str) -> Result<HealthReport, String> {
    let records = notes::scan_archive(archive_root)?;
    let total_notes = records.len();

    let all_names: HashSet<String> = records
        .iter()
        .map(|r| r.name.to_lowercase())
        .collect();

    let mut broken_links = Vec::new();
    let mut empty_notes = Vec::new();

    for record in &records {
        if record.content.trim().is_empty() {
            empty_notes.push(record.path.clone());
        }

        for link in &record.links {
            let target_name = format!("{}.md", link.to_lowercase());
            if !all_names.contains(&target_name) && !all_names.contains(&link.to_lowercase()) {
                broken_links.push(BrokenLink {
                    note_path: record.path.clone(),
                    target: link.clone(),
                });
            }
        }
    }

    Ok(HealthReport {
        broken_links,
        empty_notes,
        total_notes,
    })
}
