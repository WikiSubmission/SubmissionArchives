use std::sync::OnceLock;

use serde::Serialize;

const QURAN_CSV: &str = include_str!("../assets/quran.csv");

#[derive(Clone, Serialize)]
pub struct Verse {
    pub chapter: u32,
    pub verse: u32,
    pub arabic: String,
    pub english: String,
}

static VERSES: OnceLock<Vec<Verse>> = OnceLock::new();

fn verses() -> &'static Vec<Verse> {
    VERSES.get_or_init(|| {
        let mut reader = csv::Reader::from_reader(QURAN_CSV.as_bytes());
        reader
            .records()
            .filter_map(|record| record.ok())
            .filter_map(|record| {
                Some(Verse {
                    chapter: record.get(0)?.parse().ok()?,
                    verse: record.get(1)?.parse().ok()?,
                    arabic: record.get(2)?.to_string(),
                    english: record.get(3)?.to_string(),
                })
            })
            .collect()
    })
}

fn parse_range(spec: &str) -> Result<(u32, u32), String> {
    let spec = spec.trim();
    if let Some((start, end)) = spec.split_once('-') {
        let start: u32 = start
            .trim()
            .parse()
            .map_err(|_| format!("Invalid verse number: {}", spec))?;
        let end: u32 = end
            .trim()
            .parse()
            .map_err(|_| format!("Invalid verse number: {}", spec))?;
        Ok((start, end))
    } else {
        let verse: u32 = spec
            .parse()
            .map_err(|_| format!("Invalid verse number: {}", spec))?;
        Ok((verse, verse))
    }
}

/// Parses a reference string such as "1:1-7, 2:255" and returns the matching verses.
pub fn search_verses(query: &str) -> Result<Vec<Verse>, String> {
    let all = verses();
    let mut results = Vec::new();

    for part in query.split(',') {
        let part = part.trim();
        if part.is_empty() {
            continue;
        }

        let (chapter_str, verse_spec) = part
            .split_once(':')
            .ok_or_else(|| format!("Invalid reference '{}'. Expected format chapter:verse", part))?;

        let chapter: u32 = chapter_str
            .trim()
            .parse()
            .map_err(|_| format!("Invalid chapter number in '{}'", part))?;
        let (start, end) = parse_range(verse_spec)?;

        let matches: Vec<Verse> = all
            .iter()
            .filter(|v| v.chapter == chapter && v.verse >= start && v.verse <= end)
            .cloned()
            .collect();

        if matches.is_empty() {
            return Err(format!("No verses found for '{}'", part));
        }

        results.extend(matches);
    }

    if results.is_empty() {
        return Err("No reference provided".to_string());
    }

    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn single_verse() {
        let results = search_verses("1:1").unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].chapter, 1);
        assert_eq!(results[0].verse, 1);
        assert!(results[0].english.contains("GOD"));
    }

    #[test]
    fn verse_range() {
        let results = search_verses("1:1-7").unwrap();
        assert_eq!(results.len(), 7);
        assert_eq!(results.first().unwrap().verse, 1);
        assert_eq!(results.last().unwrap().verse, 7);
    }

    #[test]
    fn multiple_refs() {
        let results = search_verses("1:1, 2:255").unwrap();
        assert_eq!(results.len(), 2);
        assert_eq!(results[0].chapter, 1);
        assert_eq!(results[1].chapter, 2);
        assert_eq!(results[1].verse, 255);
    }

    #[test]
    fn invalid_chapter_errors() {
        assert!(search_verses("999:1").is_err());
    }

    #[test]
    fn garbage_input_errors() {
        assert!(search_verses("not a ref").is_err());
    }
}
