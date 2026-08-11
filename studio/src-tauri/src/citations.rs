use std::collections::HashMap;
use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Citation {
    pub id: String,
    pub citation_type: String,
    pub author: Option<String>,
    pub title: String,
    pub year: Option<u32>,
    pub publisher: Option<String>,
}

pub fn read_citations(archive_root: &str) -> Result<Vec<Citation>, String> {
    let path = Path::new(archive_root).join(".studio").join("citations.yaml");
    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read citations: {}", e))?;

    let map: HashMap<String, Citation> = serde_yaml::from_str(&content)
        .unwrap_or_default();

    let mut result: Vec<Citation> = map.into_values().collect();
    result.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(result)
}

pub fn write_citation(archive_root: &str, citation: Citation) -> Result<(), String> {
    let studio_dir = Path::new(archive_root).join(".studio");
    fs::create_dir_all(&studio_dir)
        .map_err(|e| format!("Failed to create .studio dir: {}", e))?;

    let mut citations = read_citations(archive_root)?;
    citations.retain(|c| c.id != citation.id);
    citations.push(citation);

    let map: HashMap<String, Citation> = citations
        .into_iter()
        .map(|c| (c.id.clone(), c))
        .collect();

    let yaml = serde_yaml::to_string(&map)
        .map_err(|e| format!("Failed to serialize citations: {}", e))?;

    let path = studio_dir.join("citations.yaml");
    fs::write(path, yaml)
        .map_err(|e| format!("Failed to write citations file: {}", e))?;

    Ok(())
}
