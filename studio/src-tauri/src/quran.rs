use std::sync::OnceLock;
use serde::Serialize;

const QURAN_CSV: &str = include_str!("../assets/quran.csv");

#[derive(Clone, Serialize, Debug, PartialEq, Eq)]
pub struct Verse {
    pub chapter: u32,
    pub verse: u32,
    pub arabic: String,
    pub english: String,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct SurahMeta {
    pub number: u32,
    pub name: &'static str,
    /// Kept only so the table below stays readable at a glance. The figure the
    /// range check actually uses comes from `total_verses`, which reads the
    /// generated chapter table: this column claimed 129 for chapter 9 where the
    /// data has 127, so `search_verses("9:128")` used to fail with an unhelpful
    /// "No verses found" instead of explaining the numbering.
    pub total_verses: u32,
}

/// The authoritative verse count, from `qurancode`'s generated chapter table.
/// Falls back to the literal above only if that table cannot be read, which
/// would mean the bundled assets are broken.
fn total_verses(meta: &SurahMeta) -> u32 {
    crate::qurancode::chapter_verse_count(meta.number).unwrap_or(meta.total_verses)
}

pub static SURAHS: &[SurahMeta] = &[
    SurahMeta { number: 1, name: "Al-Fatihah", total_verses: 7 },
    SurahMeta { number: 2, name: "Al-Baqarah", total_verses: 286 },
    SurahMeta { number: 3, name: "Ali 'Imran", total_verses: 200 },
    SurahMeta { number: 4, name: "An-Nisa", total_verses: 176 },
    SurahMeta { number: 5, name: "Al-Ma'idah", total_verses: 120 },
    SurahMeta { number: 6, name: "Al-An'am", total_verses: 165 },
    SurahMeta { number: 7, name: "Al-A'raf", total_verses: 206 },
    SurahMeta { number: 8, name: "Al-Anfal", total_verses: 75 },
    SurahMeta { number: 9, name: "At-Tawbah", total_verses: 129 },
    SurahMeta { number: 10, name: "Yunus", total_verses: 109 },
    SurahMeta { number: 11, name: "Hud", total_verses: 123 },
    SurahMeta { number: 12, name: "Yusuf", total_verses: 111 },
    SurahMeta { number: 13, name: "Ar-Ra'd", total_verses: 43 },
    SurahMeta { number: 14, name: "Ibrahim", total_verses: 52 },
    SurahMeta { number: 15, name: "Al-Hijr", total_verses: 99 },
    SurahMeta { number: 16, name: "An-Nahl", total_verses: 128 },
    SurahMeta { number: 17, name: "Al-Isra", total_verses: 111 },
    SurahMeta { number: 18, name: "Al-Kahf", total_verses: 110 },
    SurahMeta { number: 19, name: "Maryam", total_verses: 98 },
    SurahMeta { number: 20, name: "Ta-Ha", total_verses: 135 },
    SurahMeta { number: 21, name: "Al-Anbiya", total_verses: 112 },
    SurahMeta { number: 22, name: "Al-Hajj", total_verses: 78 },
    SurahMeta { number: 23, name: "Al-Mu'minun", total_verses: 118 },
    SurahMeta { number: 24, name: "An-Nur", total_verses: 64 },
    SurahMeta { number: 25, name: "Al-Furqan", total_verses: 77 },
    SurahMeta { number: 26, name: "Ash-Shu'ara", total_verses: 227 },
    SurahMeta { number: 27, name: "An-Naml", total_verses: 93 },
    SurahMeta { number: 28, name: "Al-Qasas", total_verses: 88 },
    SurahMeta { number: 29, name: "Al-'Ankabut", total_verses: 69 },
    SurahMeta { number: 30, name: "Ar-Rum", total_verses: 60 },
    SurahMeta { number: 31, name: "Luqman", total_verses: 34 },
    SurahMeta { number: 32, name: "As-Sajdah", total_verses: 30 },
    SurahMeta { number: 33, name: "Al-Ahzab", total_verses: 73 },
    SurahMeta { number: 34, name: "Saba", total_verses: 54 },
    SurahMeta { number: 35, name: "Fatir", total_verses: 45 },
    SurahMeta { number: 36, name: "Ya-Sin", total_verses: 83 },
    SurahMeta { number: 37, name: "As-Saffat", total_verses: 182 },
    SurahMeta { number: 38, name: "Sad", total_verses: 88 },
    SurahMeta { number: 39, name: "Az-Zumar", total_verses: 75 },
    SurahMeta { number: 40, name: "Ghafir", total_verses: 85 },
    SurahMeta { number: 41, name: "Fussilat", total_verses: 54 },
    SurahMeta { number: 42, name: "Ash-Shura", total_verses: 53 },
    SurahMeta { number: 43, name: "Az-Zukhruf", total_verses: 89 },
    SurahMeta { number: 44, name: "Ad-Dukhan", total_verses: 59 },
    SurahMeta { number: 45, name: "Al-Jathiyah", total_verses: 37 },
    SurahMeta { number: 46, name: "Al-Ahqaf", total_verses: 35 },
    SurahMeta { number: 47, name: "Muhammad", total_verses: 38 },
    SurahMeta { number: 48, name: "Al-Fath", total_verses: 29 },
    SurahMeta { number: 49, name: "Al-Hujurat", total_verses: 18 },
    SurahMeta { number: 50, name: "Qaf", total_verses: 45 },
    SurahMeta { number: 51, name: "Adh-Dhariyat", total_verses: 60 },
    SurahMeta { number: 52, name: "At-Tur", total_verses: 49 },
    SurahMeta { number: 53, name: "An-Najm", total_verses: 62 },
    SurahMeta { number: 54, name: "Al-Qamar", total_verses: 55 },
    SurahMeta { number: 55, name: "Ar-Rahman", total_verses: 78 },
    SurahMeta { number: 56, name: "Al-Waqi'ah", total_verses: 96 },
    SurahMeta { number: 57, name: "Al-Hadid", total_verses: 29 },
    SurahMeta { number: 58, name: "Al-Mujadila", total_verses: 22 },
    SurahMeta { number: 59, name: "Al-Hashr", total_verses: 24 },
    SurahMeta { number: 60, name: "Al-Mumtahanah", total_verses: 13 },
    SurahMeta { number: 61, name: "As-Saff", total_verses: 14 },
    SurahMeta { number: 62, name: "Al-Jumu'ah", total_verses: 11 },
    SurahMeta { number: 63, name: "Al-Munafiqun", total_verses: 11 },
    SurahMeta { number: 64, name: "At-Taghabun", total_verses: 18 },
    SurahMeta { number: 65, name: "At-Talaq", total_verses: 12 },
    SurahMeta { number: 66, name: "At-Tahrim", total_verses: 12 },
    SurahMeta { number: 67, name: "Al-Mulk", total_verses: 30 },
    SurahMeta { number: 68, name: "Al-Qalam", total_verses: 52 },
    SurahMeta { number: 69, name: "Al-Haqqah", total_verses: 52 },
    SurahMeta { number: 70, name: "Al-Ma'arij", total_verses: 44 },
    SurahMeta { number: 71, name: "Nuh", total_verses: 28 },
    SurahMeta { number: 72, name: "Al-Jinn", total_verses: 28 },
    SurahMeta { number: 73, name: "Al-Muzzammil", total_verses: 20 },
    SurahMeta { number: 74, name: "Al-Muddaththir", total_verses: 56 },
    SurahMeta { number: 75, name: "Al-Qiyamah", total_verses: 40 },
    SurahMeta { number: 76, name: "Al-Insan", total_verses: 31 },
    SurahMeta { number: 77, name: "Al-Mursalat", total_verses: 50 },
    SurahMeta { number: 78, name: "An-Naba", total_verses: 40 },
    SurahMeta { number: 79, name: "An-Nazi'at", total_verses: 46 },
    SurahMeta { number: 80, name: "'Abasa", total_verses: 42 },
    SurahMeta { number: 81, name: "At-Takwir", total_verses: 29 },
    SurahMeta { number: 82, name: "Al-Infitar", total_verses: 19 },
    SurahMeta { number: 83, name: "Al-Mutaffifin", total_verses: 36 },
    SurahMeta { number: 84, name: "Al-Inshiqaq", total_verses: 25 },
    SurahMeta { number: 85, name: "Al-Buruj", total_verses: 22 },
    SurahMeta { number: 86, name: "At-Tariq", total_verses: 17 },
    SurahMeta { number: 87, name: "Al-A'la", total_verses: 19 },
    SurahMeta { number: 88, name: "Al-Ghashiyah", total_verses: 26 },
    SurahMeta { number: 89, name: "Al-Fajr", total_verses: 30 },
    SurahMeta { number: 90, name: "Al-Balad", total_verses: 20 },
    SurahMeta { number: 91, name: "Ash-Shams", total_verses: 15 },
    SurahMeta { number: 92, name: "Al-Layl", total_verses: 21 },
    SurahMeta { number: 93, name: "Ad-Duha", total_verses: 11 },
    SurahMeta { number: 94, name: "Ash-Sharh", total_verses: 8 },
    SurahMeta { number: 95, name: "At-Tin", total_verses: 8 },
    SurahMeta { number: 96, name: "Al-'Alaq", total_verses: 19 },
    SurahMeta { number: 97, name: "Al-Qadr", total_verses: 5 },
    SurahMeta { number: 98, name: "Al-Bayyinah", total_verses: 8 },
    SurahMeta { number: 99, name: "Az-Zalzalah", total_verses: 8 },
    SurahMeta { number: 100, name: "Al-'Adiyat", total_verses: 11 },
    SurahMeta { number: 101, name: "Al-Qari'ah", total_verses: 11 },
    SurahMeta { number: 102, name: "At-Takathur", total_verses: 8 },
    SurahMeta { number: 103, name: "Al-'Asr", total_verses: 3 },
    SurahMeta { number: 104, name: "Al-Humazah", total_verses: 9 },
    SurahMeta { number: 105, name: "Al-Fil", total_verses: 5 },
    SurahMeta { number: 106, name: "Quraysh", total_verses: 4 },
    SurahMeta { number: 107, name: "Al-Ma'un", total_verses: 7 },
    SurahMeta { number: 108, name: "Al-Kawthar", total_verses: 3 },
    SurahMeta { number: 109, name: "Al-Kafirun", total_verses: 6 },
    SurahMeta { number: 110, name: "An-Nasr", total_verses: 3 },
    SurahMeta { number: 111, name: "Al-Masad", total_verses: 5 },
    SurahMeta { number: 112, name: "Al-Ikhlas", total_verses: 4 },
    SurahMeta { number: 113, name: "Al-Falaq", total_verses: 5 },
    SurahMeta { number: 114, name: "An-Nas", total_verses: 6 },
];

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

fn strip_common_prefixes(s: &str) -> &str {
    let mut curr = s.trim();
    for _ in 0..3 {
        let lower = curr.to_lowercase();
        let mut matched = false;
        for prefix in &[
            "qur'an", "qur'ān", "quran", "qurān", "surah", "sūrah", "surat", "sūrat", "chapter", "ayah", "āyah",
            "al-", "an-", "ar-", "as-", "at-", "az-", "ash-", "adh-", "ali "
        ] {
            if lower.starts_with(prefix) {
                curr = curr[prefix.len()..].trim_start_matches(|c: char| c == ':' || c == '-' || c.is_whitespace());
                matched = true;
                break;
            }
        }
        if !matched {
            break;
        }
    }
    curr
}

fn normalize_name(s: &str) -> String {
    let stripped = strip_common_prefixes(s).to_lowercase();
    stripped
        .chars()
        .map(|c| match c {
            'ā' | 'á' | 'à' | 'â' | 'ã' | 'ä' => 'a',
            'ī' | 'í' | 'ì' | 'î' | 'ï' => 'i',
            'ū' | 'ú' | 'ù' | 'û' | 'ü' => 'u',
            'ḥ' => 'h',
            'ṣ' => 's',
            'ḍ' => 'd',
            'ṭ' => 't',
            'ẓ' => 'z',
            'ḏ' => 'd',
            'ġ' => 'g',
            'ḫ' => 'k',
            'ṯ' => 't',
            '’' | '‘' | 'ʿ' | 'ʾ' | '\'' | '`' | '-' | ' ' | ':' => '\0',
            other => other,
        })
        .filter(|&c| c != '\0')
        .collect()
}

fn resolve_chapter(input: &str) -> Result<&'static SurahMeta, String> {
    let input_trimmed = strip_common_prefixes(input).trim();
    if let Ok(num) = input_trimmed.parse::<u32>() {
        if let Some(meta) = SURAHS.iter().find(|s| s.number == num) {
            return Ok(meta);
        }
        return Err(format!("Chapter {} does not exist (Quran has 114 chapters)", num));
    }

    let norm_input = normalize_name(input_trimmed);
    if norm_input.is_empty() {
        return Err("Empty chapter reference".to_string());
    }

    for meta in SURAHS {
        let norm_meta = normalize_name(meta.name);
        if norm_meta == norm_input || norm_meta.starts_with(&norm_input) {
            return Ok(meta);
        }
    }

    Err(format!("Could not recognize Surah '{}'", input.trim()))
}

fn parse_range(spec: &str, max_verses: u32) -> Result<(u32, u32), String> {
    let spec = spec.trim();
    if spec.is_empty() {
        return Ok((1, max_verses));
    }

    let (start, end) = if let Some((start_str, end_str)) = spec.split_once('-') {
        let start: u32 = start_str
            .trim()
            .parse()
            .map_err(|_| format!("Invalid starting verse in range '{}'", spec))?;
        let end: u32 = end_str
            .trim()
            .parse()
            .map_err(|_| format!("Invalid ending verse in range '{}'", spec))?;
        (start, end)
    } else {
        let verse: u32 = spec
            .parse()
            .map_err(|_| format!("Invalid verse number '{}'", spec))?;
        (verse, verse)
    };

    if start == 0 {
        return Err("Verse numbering begins at 1".to_string());
    }
    if start > end {
        return Err(format!("Range start ({}) cannot exceed end ({})", start, end));
    }
    if end > max_verses {
        return Err(format!(
            "Verse {} exceeds total verses in Surah ({})",
            end, max_verses
        ));
    }

    Ok((start, end))
}

/// Parses queries such as:
/// - "1:1-7" or "1:1, 2:255"
/// - "Baqarah 255" or "Al-Baqarah:255"
/// - "Kahf 1-10" or "Maryam 1-5"
/// - "Ikhlas" (returns all verses of Surah)
pub fn search_verses(query: &str) -> Result<Vec<Verse>, String> {
    let all = verses();
    let mut results = Vec::new();

    for part in query.split(',') {
        let part = part.trim();
        if part.is_empty() {
            continue;
        }

        let (chapter_meta, verse_spec) = if let Some((ch_str, v_str)) = part.split_once(':') {
            let meta = resolve_chapter(ch_str)?;
            (meta, v_str)
        } else if let Some(last_space_idx) = part.rfind(' ') {
            let (ch_str, v_str) = part.split_at(last_space_idx);
            let meta = resolve_chapter(ch_str)?;
            (meta, v_str.trim())
        } else {
            // Whole chapter query, e.g. "Ikhlas"
            let meta = resolve_chapter(part)?;
            (meta, "")
        };

        let (start, end) = parse_range(verse_spec, total_verses(chapter_meta))?;

        let mut matches: Vec<Verse> = all
            .iter()
            .filter(|v| v.chapter == chapter_meta.number && v.verse >= start && v.verse <= end)
            .cloned()
            .collect();

        matches.sort_by_key(|v| v.verse);

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
    fn single_verse_numeric() {
        let results = search_verses("1:1").unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].chapter, 1);
        assert_eq!(results[0].verse, 1);
    }

    #[test]
    fn single_verse_named() {
        let results = search_verses("Baqarah 255").unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].chapter, 2);
        assert_eq!(results[0].verse, 255);
    }

    #[test]
    fn range_named() {
        let results = search_verses("Kahf 1-10").unwrap();
        assert_eq!(results.len(), 10);
        assert_eq!(results[0].chapter, 18);
        assert_eq!(results[0].verse, 1);
        assert_eq!(results.last().unwrap().verse, 10);
    }

    #[test]
    fn whole_surah_named() {
        let results = search_verses("Ikhlas").unwrap();
        assert_eq!(results.len(), 4);
        assert_eq!(results[0].chapter, 112);
    }

    #[test]
    fn chapter_nine_ends_at_127_with_a_useful_error() {
        // 9:128-129 are absent from this numbering. The old hardcoded table
        // claimed 129 verses, so the range check passed and the lookup then
        // failed with "No verses found", which explains nothing.
        let err = search_verses("9:128").unwrap_err();
        assert!(err.contains("exceeds total verses"), "got: {}", err);
        assert!(err.contains("127"), "the error should name the real count, got: {}", err);
        assert_eq!(search_verses("9:127").unwrap().len(), 1);
    }

    #[test]
    fn verse_counts_agree_with_the_generated_chapter_table() {
        for meta in SURAHS {
            let generated = crate::qurancode::chapter_verse_count(meta.number)
                .expect("every chapter must be in the generated table");
            if meta.number == 9 {
                assert_eq!(generated, 127, "chapter 9 carries 127 verses in this numbering");
            } else {
                assert_eq!(
                    generated, meta.total_verses,
                    "chapter {} disagrees between the literal table and the generated one",
                    meta.number
                );
            }
        }
    }

    #[test]
    fn boundary_error() {
        let err = search_verses("2:287").unwrap_err();
        assert!(err.contains("exceeds total verses"));
    }
}
