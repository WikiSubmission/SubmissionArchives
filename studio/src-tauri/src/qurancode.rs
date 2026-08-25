//! The QuranCode research module's query layer.
//!
//! Everything here is a pure function over data bundled at compile time with
//! `include_str!`, in the same shape as `quran.rs`. No filesystem access, no
//! user data, so none of the archive, trash or history concerns apply.
//!
//! Three decisions are worth knowing before reading further.
//!
//! **There is no prebuilt letter index, and there is no SQLite.** The fold that
//! turns pointed Uthmani into countable letters depends on the active text mode
//! *and* on the user's mark toggles, both of which are runtime state, so an
//! index built ahead of time would be stale the moment a checkbox moved. The
//! corpus is 77,401 words and about 325,000 letters, which folds in roughly a
//! millisecond, so every query folds on demand. `corpus_count` measures it.
//!
//! **The fold rules are data, not code.** `text_modes.json` carries the per-mode
//! fold tables, the toggle mappings, the always-drop set and the two structural
//! codepoints. This module reads that file rather than restating any of it, so
//! the generator and the backend cannot drift apart on what a hamza is.
//!
//! **Counts are always relative to a mode.** Nothing here returns a bare number.
//! Every result carries the mode, the toggles and the mode's verification state,
//! because a letter count without its convention is not a fact.

use std::collections::{HashMap, HashSet};
use std::sync::OnceLock;

use serde::{Deserialize, Serialize};

const WORDS_TSV: &str = include_str!("../assets/qurancode/words.tsv");
const VERSES_TSV: &str = include_str!("../assets/qurancode/verses.tsv");
const CHAPTERS_TSV: &str = include_str!("../assets/qurancode/chapters.tsv");
const ROOTS_TSV: &str = include_str!("../assets/qurancode/roots.tsv");
const DIVISIONS_TSV: &str = include_str!("../assets/qurancode/divisions.tsv");
const PROSTRATIONS_TSV: &str = include_str!("../assets/qurancode/prostrations.tsv");
const FIXTURES_JSON: &str = include_str!("../assets/qurancode/fixtures.json");
const TEXT_MODES_JSON: &str = include_str!("../assets/qurancode/text_modes.json");
const ABJAD_STANDARD_JSON: &str =
    include_str!("../assets/qurancode/value_systems/abjad_standard.json");
const ABJAD_MAGHRIBI_JSON: &str =
    include_str!("../assets/qurancode/value_systems/abjad_maghribi.json");
const COUNTS_ONLY_JSON: &str = include_str!("../assets/qurancode/value_systems/counts_only.json");

/* ── the bundled configuration ─────────────────────────────────────────── */

#[derive(Deserialize)]
struct RawConfig {
    modes: HashMap<String, RawMode>,
    toggles: Vec<RawToggle>,
    always_drop: Vec<String>,
    structural: RawStructural,
    alphabet: HashMap<String, String>,
}

#[derive(Deserialize)]
struct RawMode {
    label: String,
    countable: bool,
    fold: HashMap<String, String>,
    #[serde(default)]
    include_sura_basmalah_in_initials: bool,
    #[serde(default)]
    verified: Vec<String>,
    #[serde(default)]
    known_gaps: Vec<String>,
}

#[derive(Deserialize)]
struct RawToggle {
    id: String,
    default: bool,
    label: String,
    map: HashMap<String, String>,
    #[serde(default)]
    drops_letter_before: Option<String>,
}

#[derive(Deserialize)]
struct RawStructural {
    shadda: String,
    silent: String,
}

/// Arabic occupies U+0600..U+06FF, so every codepoint the fold cares about
/// fits in a 256-entry table indexed by the low byte. Nothing outside that
/// block is ever a letter here.
const BLOCK_LO: u32 = 0x0600;
const BLOCK_LEN: usize = 0x100;

/// What the fold does with one codepoint under one mode, resolved at load so
/// the inner loop is an array index rather than three hash lookups.
#[derive(Clone, Copy)]
enum Action {
    /// Not a letter under this mode: short vowels, waqf marks, tatweel.
    Drop,
    /// A letter, already folded to the form this mode counts it as.
    Keep(char),
    /// Governed by a mark toggle: kept as the given letter when the toggle is
    /// on, dropped when it is off.
    Governed(Slot, char),
    /// The shadda. A doubled letter is written once and counted once.
    Shadda,
    /// The silent marker itself, which is never a letter.
    SilentMarker,
}

pub struct Mode {
    pub id: String,
    pub label: String,
    pub countable: bool,
    pub include_basmalah_in_initials: bool,
    pub verified: Vec<String>,
    pub known_gaps: Vec<String>,
    fold: HashMap<char, char>,
    /// `fold`, the always-drop set, the toggle map and the letter test, all
    /// collapsed into one lookup. See `Action`.
    table: Box<[Action; BLOCK_LEN]>,
}

pub struct ToggleSpec {
    pub id: String,
    pub label: String,
    pub default: bool,
    map: HashMap<char, char>,
    drops_letter_before: Option<char>,
}

/// Which field of `Toggles` a governed codepoint answers to. Resolving the id
/// to a slot once at load turns the inner loop's string comparison into an
/// array index.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum Slot {
    HamzaOnLine,
    SuperscriptAlef,
    SmallWawYeh,
    SilentMarked,
}

impl Slot {
    fn from_id(id: &str) -> Option<Slot> {
        match id {
            "hamza_on_line" => Some(Slot::HamzaOnLine),
            "superscript_alef" => Some(Slot::SuperscriptAlef),
            "small_waw_yeh" => Some(Slot::SmallWawYeh),
            "silent_marked" => Some(Slot::SilentMarked),
            _ => None,
        }
    }
}

pub struct Config {
    pub modes: Vec<Mode>,
    pub toggles: Vec<ToggleSpec>,
    pub alphabet: HashMap<String, String>,
    /// The toggle that decides whether a letter carrying U+06DF survives, and
    /// the marker it watches for. This is the one rule the per-mode tables
    /// cannot express, because it is about the character *after* the one being
    /// folded.
    silent_rule: Option<(Slot, char)>,
}

/// Parses `"0627"` into `'ا'`. The generator writes every codepoint in this
/// form so the JSON stays legible in a diff.
fn from_hex(code: &str) -> Result<char, String> {
    let n = u32::from_str_radix(code, 16).map_err(|_| format!("bad codepoint '{}'", code))?;
    char::from_u32(n).ok_or_else(|| format!("codepoint {} is not a character", code))
}

fn one_char(s: &str, what: &str) -> Result<char, String> {
    let mut it = s.chars();
    match (it.next(), it.next()) {
        (Some(c), None) => Ok(c),
        _ => Err(format!("{} must be a single character, got '{}'", what, s)),
    }
}

impl Config {
    fn load() -> Result<Config, String> {
        let raw: RawConfig =
            serde_json::from_str(TEXT_MODES_JSON).map_err(|e| format!("text_modes.json: {}", e))?;

        let mut modes: Vec<Mode> = Vec::new();
        for (id, m) in raw.modes {
            let mut fold = HashMap::new();
            for (from, to) in &m.fold {
                fold.insert(one_char(from, "fold key")?, one_char(to, "fold value")?);
            }
            modes.push(Mode {
                id,
                label: m.label,
                countable: m.countable,
                include_basmalah_in_initials: m.include_sura_basmalah_in_initials,
                verified: m.verified,
                known_gaps: m.known_gaps,
                fold,
                // filled in below, once the toggle map and drop set exist
                table: Box::new([Action::Drop; BLOCK_LEN]),
            });
        }
        // stable order so the UI never reshuffles its own selector
        modes.sort_by(|a, b| a.id.cmp(&b.id)); // stable selector order

        let mut toggles = Vec::new();
        for t in raw.toggles {
            let mut map = HashMap::new();
            for (from, to) in &t.map {
                map.insert(from_hex(from)?, from_hex(to)?);
            }
            let drops_letter_before = match &t.drops_letter_before {
                Some(code) => Some(from_hex(code)?),
                None => None,
            };
            toggles.push(ToggleSpec {
                id: t.id,
                label: t.label,
                default: t.default,
                map,
                drops_letter_before,
            });
        }

        let mut always_drop = HashSet::new();
        for code in &raw.always_drop {
            always_drop.insert(from_hex(code)?);
        }

        let mut governed = HashMap::new();
        let mut silent_rule = None;
        for t in &toggles {
            let slot = Slot::from_id(&t.id)
                .ok_or_else(|| format!("text_modes.json declares an unknown toggle '{}'", t.id))?;
            for (from, to) in &t.map {
                governed.insert(*from, (slot, *to));
            }
            if let Some(marker) = t.drops_letter_before {
                silent_rule = Some((slot, marker));
            }
        }

        let shadda = from_hex(&raw.structural.shadda)?;
        let silent = from_hex(&raw.structural.silent)?;

        for mode in &mut modes {
            let mut table = Box::new([Action::Drop; BLOCK_LEN]);
            for slot in 0..BLOCK_LEN {
                let ch = match char::from_u32(BLOCK_LO + slot as u32) {
                    Some(c) => c,
                    None => continue,
                };
                table[slot] = if ch == shadda {
                    Action::Shadda
                } else if ch == silent {
                    Action::SilentMarker
                } else if let Some((toggle, mapped)) = governed.get(&ch).copied() {
                    let folded = *mode.fold.get(&mapped).unwrap_or(&mapped);
                    if is_letter(folded) {
                        Action::Governed(toggle, folded)
                    } else {
                        Action::Drop
                    }
                } else if always_drop.contains(&ch) {
                    Action::Drop
                } else {
                    let folded = *mode.fold.get(&ch).unwrap_or(&ch);
                    if is_letter(folded) {
                        Action::Keep(folded)
                    } else {
                        Action::Drop
                    }
                };
            }
            mode.table = table;
        }

        /* `always_drop`, `governed`, the shadda and the silent marker are all
         * baked into the per-mode tables above, so none of them outlives this
         * function. Only `silent_rule` is still needed at fold time. */
        Ok(Config {
            modes,
            toggles,
            alphabet: raw.alphabet,
            silent_rule,
        })
    }

    pub fn mode(&self, id: &str) -> Result<&Mode, String> {
        self.modes
            .iter()
            .find(|m| m.id == id)
            .ok_or_else(|| format!("unknown text mode '{}'", id))
    }
}

static CONFIG: OnceLock<Result<Config, String>> = OnceLock::new();

pub fn config() -> Result<&'static Config, String> {
    match CONFIG.get_or_init(Config::load) {
        Ok(c) => Ok(c),
        Err(e) => Err(e.clone()),
    }
}

/* ── toggles ───────────────────────────────────────────────────────────── */

/// The mark toggles as the UI sends them. Absent fields fall back to the
/// defaults declared in `text_modes.json`, so a caller that does not care about
/// hamza never has to name it.
#[derive(Deserialize, Clone, Copy, Debug, PartialEq, Eq, Default)]
#[serde(default)]
pub struct ToggleInput {
    pub hamza_on_line: Option<bool>,
    pub superscript_alef: Option<bool>,
    pub small_waw_yeh: Option<bool>,
    pub silent_marked: Option<bool>,
}

#[derive(Serialize, Clone, Copy, Debug, PartialEq, Eq)]
pub struct Toggles {
    pub hamza_on_line: bool,
    pub superscript_alef: bool,
    pub small_waw_yeh: bool,
    pub silent_marked: bool,
}

impl Toggles {
    /// Reads the shipped defaults out of the bundled config rather than
    /// restating them, so there is one place to change a default.
    pub fn defaults(cfg: &Config) -> Toggles {
        let on = |id: &str| {
            cfg.toggles
                .iter()
                .find(|t| t.id == id)
                .map(|t| t.default)
                .unwrap_or(false)
        };
        Toggles {
            hamza_on_line: on("hamza_on_line"),
            superscript_alef: on("superscript_alef"),
            small_waw_yeh: on("small_waw_yeh"),
            silent_marked: on("silent_marked"),
        }
    }

    fn resolve(cfg: &Config, input: Option<ToggleInput>) -> Toggles {
        let d = Toggles::defaults(cfg);
        match input {
            None => d,
            Some(i) => Toggles {
                hamza_on_line: i.hamza_on_line.unwrap_or(d.hamza_on_line),
                superscript_alef: i.superscript_alef.unwrap_or(d.superscript_alef),
                small_waw_yeh: i.small_waw_yeh.unwrap_or(d.small_waw_yeh),
                silent_marked: i.silent_marked.unwrap_or(d.silent_marked),
            },
        }
    }

    fn slot(&self, slot: Slot) -> bool {
        match slot {
            Slot::HamzaOnLine => self.hamza_on_line,
            Slot::SuperscriptAlef => self.superscript_alef,
            Slot::SmallWawYeh => self.small_waw_yeh,
            Slot::SilentMarked => self.silent_marked,
        }
    }
}

/* ── the fold ──────────────────────────────────────────────────────────── */

/// The 28 letters plus the standalone hamza. Whatever the folds produce, only
/// these reach a count.
fn is_letter(c: char) -> bool {
    ('\u{0621}'..='\u{063A}').contains(&c) || ('\u{0641}'..='\u{064A}').contains(&c)
}

/// Folds one word into a bare letter stream.
///
/// This mirrors `foldWord` in `scripts/lib/qurancode-text.mjs` rule for rule,
/// and `fixtures.json` is what keeps the two honest: if they diverge, the
/// fixture counts computed here stop matching the ones the generator wrote.
pub fn fold_word(cfg: &Config, word: &str, mode: &Mode, toggles: &Toggles) -> String {
    let mut out = String::with_capacity(word.len() / 2);
    fold_into(cfg, word, mode, toggles, &mut out);
    out
}

/// The same fold, writing into a buffer the caller owns.
///
/// A whole-corpus count folds 77,401 words twice over, once per countable
/// mode. Allocating a `String` for each of those was most of the cost, so the
/// hot paths hand in one buffer and reuse it.
fn fold_into(cfg: &Config, word: &str, mode: &Mode, toggles: &Toggles, out: &mut String) {
    out.clear();
    let silent_rule = cfg.silent_rule.filter(|(slot, _)| !toggles.slot(*slot));
    let mut chars = word.chars().peekable();

    while let Some(ch) = chars.next() {
        let index = match (ch as u32).checked_sub(BLOCK_LO) {
            Some(i) if (i as usize) < BLOCK_LEN => i as usize,
            // outside the Arabic block: the source carries a space and a hyphen,
            // neither of which is ever a letter
            _ => continue,
        };

        // a letter carrying the silent marker drops out when that toggle is off
        if let Some((_, marker)) = silent_rule {
            if chars.peek() == Some(&marker) {
                continue;
            }
        }

        match mode.table[index] {
            Action::Keep(folded) => out.push(folded),
            Action::Governed(slot, folded) => {
                if toggles.slot(slot) {
                    out.push(folded);
                }
            }
            Action::Drop | Action::Shadda | Action::SilentMarker => {}
        }
    }
}

/* ── the corpus ────────────────────────────────────────────────────────── */

pub struct Word {
    pub chapter: u32,
    pub verse: u32,
    pub position: u32,
    pub uthmani: &'static str,
    pub gloss: &'static str,
    pub translit: &'static str,
    /// Comma-separated indices into `roots()`. Stored as the raw field because
    /// parsing 77,849 small vectors at load costs more than the handful of
    /// splits a root query actually performs.
    pub root_ids: &'static str,
    /// False for the 112 unnumbered Basmalah groups, which are excluded from
    /// corpus totals and included when a sura's initials are counted.
    pub canonical: bool,
}

pub struct Chapter {
    pub number: u32,
    pub verses: u32,
    pub revelation_order: u32,
    /// `Makkah` or `Medina`, from Tanzil. Never blank, and asserted so at
    /// generation. Makkan against Medinan is a standard partition in this
    /// literature and the chapter table had no way to express it before.
    pub revelation_place: &'static str,
    pub name_arabic: &'static str,
    pub name_english: &'static str,
    pub name_transliterated: &'static str,
    /// The Quranic Initials prefixing this sura, empty for the 85 that carry
    /// none. Transcribed from Appendix 1 Table 1 rather than read off the text,
    /// because sura 42 carries its initials across two verses and sura 68
    /// spells its single letter out as نون.
    pub initials: &'static str,
}

/// Splits a TSV body into rows of columns, skipping the header and any blank
/// trailing line. The generator writes no quoted fields and strips tabs out of
/// free text, so a split is the whole parser.
fn tsv_rows(body: &'static str) -> impl Iterator<Item = Vec<&'static str>> {
    body.lines()
        .skip(1)
        .filter(|l| !l.is_empty())
        .map(|l| l.split('\t').collect())
}

fn field(row: &[&'static str], i: usize) -> &'static str {
    row.get(i).copied().unwrap_or("")
}

static WORDS: OnceLock<Vec<Word>> = OnceLock::new();

pub fn words() -> &'static Vec<Word> {
    WORDS.get_or_init(|| {
        tsv_rows(WORDS_TSV)
            .filter_map(|r| {
                Some(Word {
                    chapter: field(&r, 0).parse().ok()?,
                    verse: field(&r, 1).parse().ok()?,
                    position: field(&r, 2).parse().ok()?,
                    uthmani: field(&r, 3),
                    gloss: field(&r, 4),
                    translit: field(&r, 5),
                    root_ids: field(&r, 6),
                    canonical: field(&r, 7) == "canonical",
                })
            })
            .collect()
    })
}

static CHAPTERS: OnceLock<Vec<Chapter>> = OnceLock::new();

pub fn chapters() -> &'static Vec<Chapter> {
    CHAPTERS.get_or_init(|| {
        tsv_rows(CHAPTERS_TSV)
            .filter_map(|r| {
                Some(Chapter {
                    number: field(&r, 0).parse().ok()?,
                    verses: field(&r, 1).parse().ok()?,
                    revelation_order: field(&r, 2).parse().ok()?,
                    revelation_place: field(&r, 3),
                    name_arabic: field(&r, 4),
                    name_english: field(&r, 5),
                    name_transliterated: field(&r, 6),
                    initials: field(&r, 7),
                })
            })
            .collect()
    })
}

/// The authoritative verse count for a chapter. `quran.rs` used to carry its
/// own copy of these and claimed 129 for chapter 9, where the data has 127, so
/// `search_verses("9:128")` failed with "No verses found" rather than
/// explaining the numbering. There is one table now, and it is generated.
/// The Quranic Initials prefixing a sura, or `None` if the number is not a
/// sura. An empty string is a real answer: 85 suras carry no initials.
pub fn chapter_initials(number: u32) -> Option<&'static str> {
    chapters()
        .iter()
        .find(|c| c.number == number)
        .map(|c| c.initials)
}

pub fn chapter_verse_count(number: u32) -> Option<u32> {
    chapters()
        .iter()
        .find(|c| c.number == number)
        .map(|c| c.verses)
}

static ENGLISH: OnceLock<HashMap<(u32, u32), &'static str>> = OnceLock::new();

fn english() -> &'static HashMap<(u32, u32), &'static str> {
    ENGLISH.get_or_init(|| {
        let mut map = HashMap::new();
        for r in tsv_rows(VERSES_TSV) {
            if let (Ok(c), Ok(v)) = (field(&r, 0).parse::<u32>(), field(&r, 1).parse::<u32>()) {
                map.insert((c, v), field(&r, 2));
            }
        }
        map
    })
}

/* ── the traditional divisions ─────────────────────────────────────────── */

/// The six ways a mushaf is divided, from Tanzil's metadata under CC-BY.
///
/// A Copy enum rather than a string because it lives inside `Scope`, which is
/// `Copy` so that every query can take one by value. The lowercase names are
/// the wire format the frontend sends.
#[derive(Deserialize, Serialize, Clone, Copy, PartialEq, Eq, Hash, Debug)]
#[serde(rename_all = "lowercase")]
pub enum DivisionKind {
    Part,
    Group,
    Quarter,
    Station,
    Bowing,
    Page,
}

impl DivisionKind {
    pub const ALL: [DivisionKind; 6] = [
        DivisionKind::Part,
        DivisionKind::Group,
        DivisionKind::Quarter,
        DivisionKind::Station,
        DivisionKind::Bowing,
        DivisionKind::Page,
    ];

    fn from_tsv(s: &str) -> Option<DivisionKind> {
        match s {
            "part" => Some(DivisionKind::Part),
            "group" => Some(DivisionKind::Group),
            "quarter" => Some(DivisionKind::Quarter),
            "station" => Some(DivisionKind::Station),
            "bowing" => Some(DivisionKind::Bowing),
            "page" => Some(DivisionKind::Page),
            _ => None,
        }
    }

    pub fn id(&self) -> &'static str {
        match self {
            DivisionKind::Part => "part",
            DivisionKind::Group => "group",
            DivisionKind::Quarter => "quarter",
            DivisionKind::Station => "station",
            DivisionKind::Bowing => "bowing",
            DivisionKind::Page => "page",
        }
    }

    /// The name a reader would use. Juz', hizb and so on are the Arabic terms,
    /// but the surface is in English and the plan's own §6 mapping uses these.
    pub fn label(&self) -> &'static str {
        match self {
            DivisionKind::Part => "Part (juz')",
            DivisionKind::Group => "Group (hizb)",
            DivisionKind::Quarter => "Quarter",
            DivisionKind::Station => "Station (manzil)",
            DivisionKind::Bowing => "Bowing (ruku')",
            DivisionKind::Page => "Page",
        }
    }

    /// Which slot of `VerseDivisions` this kind occupies. Resolving the kind to
    /// an index once turns the per-word test into an array read.
    fn slot(&self) -> usize {
        match self {
            DivisionKind::Part => 0,
            DivisionKind::Group => 1,
            DivisionKind::Quarter => 2,
            DivisionKind::Station => 3,
            DivisionKind::Bowing => 4,
            DivisionKind::Page => 5,
        }
    }
}

/// One division, as an inclusive range of addresses.
pub struct Division {
    pub kind: DivisionKind,
    pub number: u32,
    pub start: (u32, u32),
    pub end: (u32, u32),
    pub verses: u32,
}

/// Which division of each kind a verse belongs to, indexed by
/// `DivisionKind::slot`. Every verse belongs to exactly one of each, because the
/// generator asserts that each kind tiles the corpus.
#[derive(Clone, Copy, Default, Serialize, Debug)]
pub struct VerseDivisions {
    pub part: u32,
    pub group: u32,
    pub quarter: u32,
    pub station: u32,
    pub bowing: u32,
    pub page: u32,
}

impl VerseDivisions {
    fn at(&self, slot: usize) -> u32 {
        match slot {
            0 => self.part,
            1 => self.group,
            2 => self.quarter,
            3 => self.station,
            4 => self.bowing,
            5 => self.page,
            _ => 0,
        }
    }

    fn set(&mut self, slot: usize, n: u32) {
        match slot {
            0 => self.part = n,
            1 => self.group = n,
            2 => self.quarter = n,
            3 => self.station = n,
            4 => self.bowing = n,
            5 => self.page = n,
            _ => {}
        }
    }
}

static DIVISIONS: OnceLock<Vec<Division>> = OnceLock::new();

pub fn divisions() -> &'static Vec<Division> {
    DIVISIONS.get_or_init(|| {
        tsv_rows(DIVISIONS_TSV)
            .filter_map(|r| {
                Some(Division {
                    kind: DivisionKind::from_tsv(field(&r, 0))?,
                    number: field(&r, 1).parse().ok()?,
                    start: (field(&r, 2).parse().ok()?, field(&r, 3).parse().ok()?),
                    end: (field(&r, 4).parse().ok()?, field(&r, 5).parse().ok()?),
                    verses: field(&r, 6).parse().ok()?,
                })
            })
            .collect()
    })
}

static VERSE_DIVISIONS: OnceLock<HashMap<(u32, u32), VerseDivisions>> = OnceLock::new();

/// Every verse's division numbers, built once by walking each range.
///
/// Inverted from the range list rather than searched per query: a scoped count
/// asks "is this word's verse in division N" once per word, 77,401 times, and a
/// linear scan over 1,497 ranges each time would dominate the fold it is meant
/// to filter.
pub fn verse_divisions() -> &'static HashMap<(u32, u32), VerseDivisions> {
    VERSE_DIVISIONS.get_or_init(|| {
        let order: Vec<(u32, u32)> = {
            let mut seen: Vec<(u32, u32)> = Vec::with_capacity(6234);
            for w in words() {
                if w.canonical && seen.last() != Some(&(w.chapter, w.verse)) {
                    seen.push((w.chapter, w.verse));
                }
            }
            seen
        };
        let position: HashMap<(u32, u32), usize> =
            order.iter().enumerate().map(|(i, a)| (*a, i)).collect();

        let mut map: HashMap<(u32, u32), VerseDivisions> = order
            .iter()
            .map(|a| (*a, VerseDivisions::default()))
            .collect();

        for d in divisions() {
            let slot = d.kind.slot();
            let (Some(&from), Some(&to)) = (position.get(&d.start), position.get(&d.end)) else {
                continue;
            };
            for a in &order[from..=to] {
                if let Some(v) = map.get_mut(a) {
                    v.set(slot, d.number);
                }
            }
        }
        map
    })
}

/// The divisions a verse belongs to, or `None` if the address is not a verse.
/// The 112 unnumbered Basmalah groups have no address of their own, so they
/// answer `None`: they sit inside the page and part their sura opens, but they
/// are not verses and a division that counted them would double-count the
/// Basmalah at 1:1.
pub fn divisions_of(chapter: u32, verse: u32) -> Option<VerseDivisions> {
    verse_divisions().get(&(chapter, verse)).copied()
}

#[derive(Deserialize, Clone, Copy, Debug)]
pub struct DivisionRef {
    pub kind: DivisionKind,
    pub number: u32,
}

pub struct Prostration {
    pub chapter: u32,
    pub verse: u32,
    /// `Recommended` or `Obligatory`, as Tanzil records it.
    pub kind: &'static str,
}

static PROSTRATIONS: OnceLock<Vec<Prostration>> = OnceLock::new();

pub fn prostrations() -> &'static Vec<Prostration> {
    PROSTRATIONS.get_or_init(|| {
        tsv_rows(PROSTRATIONS_TSV)
            .filter_map(|r| {
                Some(Prostration {
                    chapter: field(&r, 0).parse().ok()?,
                    verse: field(&r, 1).parse().ok()?,
                    kind: field(&r, 2),
                })
            })
            .collect()
    })
}

fn is_prostration(chapter: u32, verse: u32) -> bool {
    prostrations()
        .iter()
        .any(|p| p.chapter == chapter && p.verse == verse)
}

/* ── value systems ─────────────────────────────────────────────────────── */

#[derive(Deserialize)]
struct RawValueSystem {
    id: String,
    name: String,
    author: Option<String>,
    text_mode: String,
    note: String,
    letter_values: HashMap<String, i64>,
}

pub struct ValueSystem {
    pub id: String,
    pub name: String,
    pub author: Option<String>,
    pub text_mode: String,
    pub note: String,
    /// Indexed by the low byte of the codepoint, like the fold tables. A
    /// valuation runs once per letter over the whole corpus, so this is the
    /// difference between one array read and one hash of a `char`.
    values: Box<[i64; BLOCK_LEN]>,
}

static VALUE_SYSTEMS: OnceLock<Vec<ValueSystem>> = OnceLock::new();

pub fn value_systems() -> &'static Vec<ValueSystem> {
    VALUE_SYSTEMS.get_or_init(|| {
        [ABJAD_STANDARD_JSON, ABJAD_MAGHRIBI_JSON, COUNTS_ONLY_JSON]
            .iter()
            .filter_map(|json| serde_json::from_str::<RawValueSystem>(json).ok())
            .map(|raw| ValueSystem {
                id: raw.id,
                name: raw.name,
                author: raw.author,
                text_mode: raw.text_mode,
                note: raw.note,
                values: {
                    let mut table = Box::new([0i64; BLOCK_LEN]);
                    for (letter, value) in &raw.letter_values {
                        if let Some(c) = letter.chars().next() {
                            if let Some(i) = (c as u32).checked_sub(BLOCK_LO) {
                                if (i as usize) < BLOCK_LEN {
                                    table[i as usize] = *value;
                                }
                            }
                        }
                    }
                    table
                },
            })
            .collect()
    })
}

fn find_value_system(id: &str) -> Result<&'static ValueSystem, String> {
    value_systems()
        .iter()
        .find(|v| v.id == id)
        .ok_or_else(|| format!("unknown value system '{}'", id))
}

fn digit_sum(mut n: i64) -> i64 {
    n = n.abs();
    let mut s = 0;
    while n > 0 {
        s += n % 10;
        n /= 10;
    }
    s
}

fn digital_root(n: i64) -> i64 {
    let mut v = digit_sum(n);
    while v > 9 {
        v = digit_sum(v);
    }
    v
}

/* ── scope ─────────────────────────────────────────────────────────────── */

/// What a query counts over. An absent field means "all of them", so an empty
/// scope is the whole corpus.
#[derive(Deserialize, Clone, Copy, Debug, Default)]
#[serde(default)]
pub struct Scope {
    pub chapter: Option<u32>,
    pub verse: Option<u32>,
    pub word: Option<u32>,
    /// Whether the 112 unnumbered Basmalah groups are counted. Off by default,
    /// because 6,234 verses is the basis every published corpus figure uses.
    /// The published initial counts are the case that needs it on: counting
    /// canonical verses alone leaves lam short by exactly 4 and mim by exactly
    /// 3 in every one of the six ALM suras, which is precisely one Basmalah.
    pub include_basmalah: Option<bool>,
    /// One traditional division, which is an address *range* rather than an
    /// address prefix and so cannot be expressed by the fields above. Counting
    /// a page or a part is what §6 lists as the five remaining scopes; this is
    /// all five, because the kind is a parameter rather than five fields.
    pub division: Option<DivisionRef>,
}

impl Scope {
    fn matches(&self, w: &Word) -> bool {
        if !w.canonical && !self.include_basmalah.unwrap_or(false) {
            return false;
        }
        if let Some(d) = self.division {
            /* An unnumbered Basmalah has no address, so it belongs to no
               division. Including it in a page count would attribute four words
               to a page the mushaf does not put them on. */
            match divisions_of(w.chapter, w.verse) {
                Some(v) if v.at(d.kind.slot()) == d.number => {}
                _ => return false,
            }
        }
        if let Some(c) = self.chapter {
            if w.chapter != c {
                return false;
            }
        }
        if let Some(v) = self.verse {
            if w.verse != v {
                return false;
            }
        }
        if let Some(p) = self.word {
            if w.position != p {
                return false;
            }
        }
        true
    }

    fn label(&self) -> String {
        let base = match (self.chapter, self.verse, self.word) {
            (Some(c), Some(v), Some(w)) => format!("{}:{}:{}", c, v, w),
            (Some(c), Some(v), None) => format!("{}:{}", c, v),
            (Some(c), None, None) => format!("chapter {}", c),
            _ => "corpus".to_string(),
        };
        match self.division {
            /* The division goes in the label rather than replacing it, because
               a page intersected with a chapter is a different scope from
               either and a figure has to say which one it answers. */
            Some(d) if base == "corpus" => format!("{} {}", d.kind.id(), d.number),
            Some(d) => format!("{}, {} {}", base, d.kind.id(), d.number),
            None => base,
        }
    }

    fn words(&self) -> Vec<&'static Word> {
        words().iter().filter(|w| self.matches(w)).collect()
    }
}

/* ── results ───────────────────────────────────────────────────────────── */

#[derive(Serialize, Clone, Debug)]
pub struct Provenance {
    pub text_mode: String,
    pub text_mode_label: String,
    pub value_system: Option<String>,
    pub scope: String,
    pub toggles: Toggles,
    pub include_basmalah: bool,
    /// Empty when the mode reproduces every published figure it claims. A
    /// non-empty list is the UI's cue to stop presenting affected figures as
    /// authoritative.
    pub known_gaps: Vec<String>,
    pub verified: Vec<String>,
}

#[derive(Serialize, Clone, Debug)]
pub struct Counts {
    pub chapters: usize,
    pub verses: usize,
    pub words: usize,
    pub letters: usize,
    pub unique_letters: usize,
    pub value: Option<i64>,
    pub digit_sum: Option<i64>,
    pub digital_root: Option<i64>,
    pub provenance: Provenance,
}

#[derive(Serialize, Clone, Debug)]
pub struct LetterStat {
    pub letter: String,
    pub count: usize,
    /// Sum of the letter's 1-based positions in the scope's letter stream, and
    /// the sum of the gaps between consecutive occurrences. These are the old
    /// app's own two columns beside the frequency.
    pub sum_positions: usize,
    pub sum_distances: usize,
}

#[derive(Serialize, Clone, Debug)]
pub struct WordView {
    pub position: u32,
    pub uthmani: &'static str,
    pub folded: String,
    pub letters: usize,
    pub gloss: &'static str,
    pub translit: &'static str,
    pub canonical: bool,
}

#[derive(Serialize, Clone, Debug)]
pub struct VerseView {
    pub chapter: u32,
    pub verse: u32,
    pub english: String,
    pub words: Vec<WordView>,
    /// Which part, group, quarter, station, bowing and page this verse sits in.
    /// Carried on the verse rather than fetched separately because a reader who
    /// wants to know is looking at the verse when the question occurs to them.
    pub divisions: Option<VerseDivisions>,
    pub provenance: Provenance,
}

#[derive(Serialize, Clone, Debug)]
pub struct ModeInfo {
    pub id: String,
    pub label: String,
    pub countable: bool,
    pub include_basmalah_in_initials: bool,
    pub verified: Vec<String>,
    pub known_gaps: Vec<String>,
    pub alphabet: Option<String>,
}

#[derive(Serialize, Clone, Debug)]
pub struct ToggleInfo {
    pub id: String,
    pub label: String,
    pub default: bool,
}

#[derive(Serialize, Clone, Debug)]
pub struct ChapterInfo {
    pub number: u32,
    pub verses: u32,
    pub revelation_order: u32,
    pub revelation_place: &'static str,
    pub name_arabic: &'static str,
    pub name_english: &'static str,
    pub name_transliterated: &'static str,
    pub initials: &'static str,
}

#[derive(Serialize, Clone, Debug)]
pub struct ValueSystemInfo {
    pub id: String,
    pub name: String,
    pub author: Option<String>,
    pub text_mode: String,
    pub note: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct Metadata {
    pub presets: Vec<PresetInfo>,
    pub modes: Vec<ModeInfo>,
    pub toggles: Vec<ToggleInfo>,
    pub chapters: Vec<ChapterInfo>,
    pub value_systems: Vec<ValueSystemInfo>,
    /// The six division kinds and how many of each there are, so the UI builds
    /// its pickers from the data instead of hardcoding that a mushaf has 604
    /// pages.
    pub divisions: Vec<DivisionKindInfo>,
    pub prostrations: usize,
    pub default_mode: String,
    pub corpus: Counts,
}

#[derive(Serialize, Clone, Debug)]
pub struct DivisionKindInfo {
    pub id: String,
    pub label: String,
    pub count: usize,
}

/* ── the queries ───────────────────────────────────────────────────────── */

/// Simplified 29 is the default because nothing about it is unverified. The
/// published-figures mode is always available beside it, and the UI shows both.
pub const DEFAULT_MODE: &str = "simplified29";

fn provenance(
    cfg: &Config,
    mode: &Mode,
    scope: &Scope,
    toggles: Toggles,
    value_system: Option<&str>,
) -> Provenance {
    let _ = cfg;
    Provenance {
        text_mode: mode.id.clone(),
        text_mode_label: mode.label.clone(),
        value_system: value_system.map(|s| s.to_string()),
        scope: scope.label(),
        toggles,
        include_basmalah: scope.include_basmalah.unwrap_or(false),
        known_gaps: mode.known_gaps.clone(),
        verified: mode.verified.clone(),
    }
}

fn count_over(
    cfg: &Config,
    scope: &Scope,
    selected: &[&'static Word],
    mode: &Mode,
    toggles: Toggles,
    system: Option<&ValueSystem>,
) -> Counts {
    let mut buf = String::with_capacity(32);
    let mut chapters = HashSet::new();
    let mut verses = HashSet::new();
    // the alphabet is a 256-entry block, so "have I seen this letter" is a flag
    // rather than a hash insert per letter
    let mut seen = [false; BLOCK_LEN];
    let mut unique = 0usize;
    let mut letters = 0usize;
    let mut value = 0i64;

    for w in selected {
        chapters.insert(w.chapter);
        if w.canonical {
            verses.insert((w.chapter, w.verse));
        }
        fold_into(cfg, w.uthmani, mode, &toggles, &mut buf);
        for c in buf.chars() {
            letters += 1;
            let index = (c as u32 - BLOCK_LO) as usize;
            if !seen[index] {
                seen[index] = true;
                unique += 1;
            }
            if let Some(sys) = system {
                value += sys.values[index];
            }
        }
    }

    Counts {
        chapters: chapters.len(),
        verses: verses.len(),
        words: selected.len(),
        letters,
        unique_letters: unique,
        value: system.map(|_| value),
        digit_sum: system.map(|_| digit_sum(value)),
        digital_root: system.map(|_| digital_root(value)),
        provenance: provenance(cfg, mode, scope, toggles, system.map(|s| s.id.as_str())),
    }
}

/// Everything the surface needs at mount: the modes and their verification
/// state, the toggle row, the chapter table, the value systems, and the corpus
/// totals under the default mode. The UI hardcodes no count.
pub fn metadata() -> Result<Metadata, String> {
    let cfg = config()?;
    let toggles = Toggles::defaults(cfg);
    let mode = cfg.mode(DEFAULT_MODE)?;
    let scope = Scope::default();
    let corpus = count_over(cfg, &scope, &scope.words(), mode, toggles, None);

    Ok(Metadata {
        modes: cfg
            .modes
            .iter()
            .map(|m| ModeInfo {
                id: m.id.clone(),
                label: m.label.clone(),
                countable: m.countable,
                include_basmalah_in_initials: m.include_basmalah_in_initials,
                verified: m.verified.clone(),
                known_gaps: m.known_gaps.clone(),
                alphabet: cfg.alphabet.get(&m.id).cloned(),
            })
            .collect(),
        toggles: cfg
            .toggles
            .iter()
            .map(|t| ToggleInfo {
                id: t.id.clone(),
                label: t.label.clone(),
                default: t.default,
            })
            .collect(),
        chapters: chapters()
            .iter()
            .map(|c| ChapterInfo {
                number: c.number,
                verses: c.verses,
                revelation_order: c.revelation_order,
                revelation_place: c.revelation_place,
                name_arabic: c.name_arabic,
                name_english: c.name_english,
                name_transliterated: c.name_transliterated,
                initials: c.initials,
            })
            .collect(),
        value_systems: value_systems()
            .iter()
            .map(|v| ValueSystemInfo {
                id: v.id.clone(),
                name: v.name.clone(),
                author: v.author.clone(),
                text_mode: v.text_mode.clone(),
                note: v.note.clone(),
            })
            .collect(),
        presets: presets(),
        divisions: DivisionKind::ALL
            .iter()
            .map(|k| DivisionKindInfo {
                id: k.id().to_string(),
                label: k.label().to_string(),
                count: divisions().iter().filter(|d| d.kind == *k).count(),
            })
            .collect(),
        prostrations: prostrations().len(),
        default_mode: DEFAULT_MODE.to_string(),
        corpus,
    })
}

pub fn get_verse(
    chapter: u32,
    verse: u32,
    mode_id: Option<String>,
    toggles: Option<ToggleInput>,
) -> Result<VerseView, String> {
    let cfg = config()?;
    let mode = cfg.mode(mode_id.as_deref().unwrap_or(DEFAULT_MODE))?;
    let toggles = Toggles::resolve(cfg, toggles);

    let scope = Scope {
        chapter: Some(chapter),
        verse: Some(verse),
        ..Scope::default()
    };
    let mut selected: Vec<&Word> = words()
        .iter()
        .filter(|w| w.chapter == chapter && w.verse == verse)
        .collect();
    if selected.is_empty() {
        return Err(match chapter_verse_count(chapter) {
            Some(total) if verse > total => format!(
                "Sura {} has {} verses in this numbering, so {}:{} does not exist",
                chapter, total, chapter, verse
            ),
            Some(_) => format!("No text found for {}:{}", chapter, verse),
            None => format!("Chapter {} does not exist (the Quran has 114)", chapter),
        });
    }
    selected.sort_by_key(|w| w.position);

    Ok(VerseView {
        chapter,
        verse,
        english: english()
            .get(&(chapter, verse))
            .copied()
            .unwrap_or("")
            .to_string(),
        words: selected
            .iter()
            .map(|w| {
                let folded = fold_word(cfg, w.uthmani, mode, &toggles);
                WordView {
                    position: w.position,
                    uthmani: w.uthmani,
                    letters: folded.chars().count(),
                    folded,
                    gloss: w.gloss,
                    translit: w.translit,
                    canonical: w.canonical,
                }
            })
            .collect(),
        divisions: divisions_of(chapter, verse),
        provenance: provenance(cfg, mode, &scope, toggles, None),
    })
}

/// Counts a scope under **every** countable mode in one call.
///
/// Returning all of them rather than one is the point: because there is no
/// single true letter count, comparison is the default view in the readout
/// instead of something the researcher has to toggle between and remember.
pub fn count(
    scope: Option<Scope>,
    toggles: Option<ToggleInput>,
    value_system: Option<String>,
) -> Result<Vec<Counts>, String> {
    let cfg = config()?;
    let scope = scope.unwrap_or_default();
    let toggles = Toggles::resolve(cfg, toggles);
    let system = match value_system.as_deref() {
        None | Some("") => None,
        Some(id) => Some(find_value_system(id)?),
    };

    // one pass over the corpus for the selection, then fold it per mode
    let selected = scope.words();
    Ok(cfg
        .modes
        .iter()
        .filter(|m| m.countable)
        .map(|m| count_over(cfg, &scope, &selected, m, toggles, system))
        .collect())
}

pub fn letter_frequency(
    scope: Option<Scope>,
    mode_id: Option<String>,
    toggles: Option<ToggleInput>,
) -> Result<Vec<LetterStat>, String> {
    let cfg = config()?;
    let scope = scope.unwrap_or_default();
    let mode = cfg.mode(mode_id.as_deref().unwrap_or(DEFAULT_MODE))?;
    let toggles = Toggles::resolve(cfg, toggles);

    let mut positions: HashMap<char, Vec<usize>> = HashMap::new();
    let mut index = 0usize;
    let mut buf = String::with_capacity(32);
    for w in scope.words() {
        fold_into(cfg, w.uthmani, mode, &toggles, &mut buf);
        for c in buf.chars() {
            index += 1;
            positions.entry(c).or_default().push(index);
        }
    }

    let mut stats: Vec<LetterStat> = positions
        .into_iter()
        .map(|(letter, ps)| LetterStat {
            letter: letter.to_string(),
            count: ps.len(),
            sum_positions: ps.iter().sum(),
            sum_distances: ps.windows(2).map(|w| w[1] - w[0]).sum(),
        })
        .collect();
    // frequency first, then the letter itself, so the table never reshuffles
    // between two letters that happen to tie
    stats.sort_by(|a, b| b.count.cmp(&a.count).then(a.letter.cmp(&b.letter)));
    Ok(stats)
}

/* ── the value engine ──────────────────────────────────────────────────── */

/// The position and distance modifiers, as a typed struct rather than a
/// bitfield or a list of ids.
///
/// Each flag adds one number into the running total for every letter in scope.
/// `*_number` is the item's absolute index in the corpus, `*_number_in_*` its
/// index inside the named container, and `*_distance` the gap to the previous
/// item of that kind.
///
/// QuranCode advertises nineteen of these. Fourteen are what the model here can
/// define without inventing a semantic: four levels, each contributing an
/// absolute index, an index within each larger container, and a distance. The
/// remaining five in the original depend on containers Studio does not carry
/// yet (page, station, part, group, quarter, bowing), which arrive with the
/// division metadata in 9g and will slot in as more fields here.
#[derive(Deserialize, Serialize, Clone, Copy, Debug, Default, PartialEq, Eq)]
#[serde(default)]
pub struct Modifiers {
    pub letter_number: bool,
    pub letter_number_in_word: bool,
    pub letter_number_in_verse: bool,
    pub letter_number_in_chapter: bool,
    pub letter_distance: bool,
    pub word_number: bool,
    pub word_number_in_verse: bool,
    pub word_number_in_chapter: bool,
    pub word_distance: bool,
    pub verse_number: bool,
    pub verse_number_in_chapter: bool,
    pub verse_distance: bool,
    pub chapter_number: bool,
    pub chapter_distance: bool,
}

impl Modifiers {
    pub fn any(&self) -> bool {
        *self != Modifiers::default()
    }

    /// The ids that are on, in declaration order. Carried in the provenance so
    /// a copied figure names the combination that produced it: with half a
    /// million combinations available, a value quoted without them is not
    /// reproducible.
    pub fn active(&self) -> Vec<&'static str> {
        let all: [(&'static str, bool); 14] = [
            ("letter_number", self.letter_number),
            ("letter_number_in_word", self.letter_number_in_word),
            ("letter_number_in_verse", self.letter_number_in_verse),
            ("letter_number_in_chapter", self.letter_number_in_chapter),
            ("letter_distance", self.letter_distance),
            ("word_number", self.word_number),
            ("word_number_in_verse", self.word_number_in_verse),
            ("word_number_in_chapter", self.word_number_in_chapter),
            ("word_distance", self.word_distance),
            ("verse_number", self.verse_number),
            ("verse_number_in_chapter", self.verse_number_in_chapter),
            ("verse_distance", self.verse_distance),
            ("chapter_number", self.chapter_number),
            ("chapter_distance", self.chapter_distance),
        ];
        all.iter()
            .filter(|(_, on)| *on)
            .map(|(id, _)| *id)
            .collect()
    }
}

/// Named starting points, because the raw matrix is a search over roughly half
/// a million combinations with no signal about which are meaningful. Offering
/// it first would make the tool answer any question you like.
pub const PRESETS: &[(&str, &str, Modifiers)] = &[
    (
        "simple_value",
        "Simple value",
        Modifiers {
            letter_number: false,
            letter_number_in_word: false,
            letter_number_in_verse: false,
            letter_number_in_chapter: false,
            letter_distance: false,
            word_number: false,
            word_number_in_verse: false,
            word_number_in_chapter: false,
            word_distance: false,
            verse_number: false,
            verse_number_in_chapter: false,
            verse_distance: false,
            chapter_number: false,
            chapter_distance: false,
        },
    ),
    (
        "letter_positions",
        "Value + letter positions",
        Modifiers {
            letter_number: false,
            letter_number_in_word: true,
            letter_number_in_verse: false,
            letter_number_in_chapter: false,
            letter_distance: false,
            word_number: false,
            word_number_in_verse: false,
            word_number_in_chapter: false,
            word_distance: false,
            verse_number: false,
            verse_number_in_chapter: false,
            verse_distance: false,
            chapter_number: false,
            chapter_distance: false,
        },
    ),
    (
        "addressed",
        "Value + full address",
        Modifiers {
            letter_number: false,
            letter_number_in_word: true,
            letter_number_in_verse: false,
            letter_number_in_chapter: false,
            letter_distance: false,
            word_number: false,
            word_number_in_verse: true,
            word_number_in_chapter: false,
            word_distance: false,
            verse_number: false,
            verse_number_in_chapter: true,
            verse_distance: false,
            chapter_number: true,
            chapter_distance: false,
        },
    ),
];

#[derive(Serialize, Clone, Debug)]
pub struct PresetInfo {
    pub id: String,
    pub label: String,
    pub modifiers: Modifiers,
}

#[derive(Serialize, Clone, Debug)]
pub struct ValueBreakdown {
    pub letter: String,
    pub base: i64,
    pub added: i64,
    pub total: i64,
    pub chapter: u32,
    pub verse: u32,
    pub word: u32,
    pub position_in_word: u32,
}

#[derive(Serialize, Clone, Debug)]
pub struct ValueResult {
    pub value: i64,
    pub letters: usize,
    pub digit_sum: i64,
    pub digital_root: i64,
    pub is_prime: bool,
    /// Which of the small primes divide the total exactly, so the readout does
    /// not have to ask again for each one.
    pub divisors: Vec<i64>,
    /// Per-letter contributions, capped so a corpus-wide request cannot return
    /// hundreds of thousands of rows.
    pub breakdown: Vec<ValueBreakdown>,
    pub breakdown_truncated: bool,
    pub modifiers: Vec<&'static str>,
    pub provenance: Provenance,
}

const BREAKDOWN_CAP: usize = 400;
const SMALL_PRIMES: [i64; 8] = [2, 3, 5, 7, 11, 13, 17, 19];

fn is_prime(n: i64) -> bool {
    if n < 2 {
        return false;
    }
    if n % 2 == 0 {
        return n == 2;
    }
    let mut d = 3i64;
    while d.saturating_mul(d) <= n {
        if n % d == 0 {
            return false;
        }
        d += 2;
    }
    true
}

/// Where each chapter starts in the corpus letter and word streams, under one
/// mode and toggle set.
///
/// The absolute modifiers need to know a letter's index in the whole Quran, not
/// just in its verse, and that depends on the fold, so it cannot be baked into
/// the generated data. It costs one corpus fold, and it is recomputed per call
/// rather than cached because `qc_compute_value` answers a click rather than a
/// keystroke. If it ever drives a live readout, this is the thing to memoise.
struct Offsets {
    letters_before_chapter: Vec<usize>,
    words_before_chapter: Vec<usize>,
    verses_before_chapter: Vec<usize>,
}

fn offsets(cfg: &Config, mode: &Mode, toggles: &Toggles, include_basmalah: bool) -> Offsets {
    let mut letters = vec![0usize; 116];
    let mut words = vec![0usize; 116];
    let mut verses = vec![0usize; 116];
    let mut buf = String::with_capacity(32);

    let mut letter_total = 0usize;
    let mut word_total = 0usize;
    let mut verse_total = 0usize;
    let mut last_verse: Option<(u32, u32)> = None;
    let mut current = 1u32;

    for w in words_iter() {
        if !w.canonical && !include_basmalah {
            continue;
        }
        while current < w.chapter {
            current += 1;
            letters[current as usize] = letter_total;
            words[current as usize] = word_total;
            verses[current as usize] = verse_total;
        }
        fold_into(cfg, w.uthmani, mode, toggles, &mut buf);
        letter_total += buf.chars().count();
        word_total += 1;
        if w.canonical && last_verse != Some((w.chapter, w.verse)) {
            last_verse = Some((w.chapter, w.verse));
            verse_total += 1;
        }
    }
    while current < 115 {
        current += 1;
        letters[current as usize] = letter_total;
        words[current as usize] = word_total;
        verses[current as usize] = verse_total;
    }

    Offsets {
        letters_before_chapter: letters,
        words_before_chapter: words,
        verses_before_chapter: verses,
    }
}

fn words_iter() -> impl Iterator<Item = &'static Word> {
    words().iter()
}

/// The gematria engine.
///
/// Walks the scope in reading order, tracking each letter's index inside its
/// word, verse and chapter and in the corpus, and adds whichever of those the
/// active modifiers ask for on top of the letter's own value.
pub fn compute_value(
    scope: Option<Scope>,
    mode_id: Option<String>,
    toggles: Option<ToggleInput>,
    value_system: String,
    modifiers: Option<Modifiers>,
) -> Result<ValueResult, String> {
    let cfg = config()?;
    let scope = scope.unwrap_or_default();
    let mode = cfg.mode(mode_id.as_deref().unwrap_or(DEFAULT_MODE))?;
    if !mode.countable {
        return Err(format!(
            "'{}' is a reading mode, not a counting basis, so it has no value",
            mode.label
        ));
    }
    let toggles = Toggles::resolve(cfg, toggles);
    let system = find_value_system(&value_system)?;
    let mods = modifiers.unwrap_or_default();
    let include_basmalah = scope.include_basmalah.unwrap_or(false);

    // Absolute indices are only paid for when a modifier actually asks for one.
    let any_modifier = mods.any();
    let needs_absolute =
        mods.letter_number || mods.word_number || mods.verse_number || mods.chapter_number;
    let base = if needs_absolute {
        Some(offsets(cfg, mode, &toggles, include_basmalah))
    } else {
        None
    };

    let selected = scope.words();
    let mut buf = String::with_capacity(32);

    let mut value = 0i64;
    let mut letters = 0usize;
    let mut breakdown = Vec::new();

    // running counters, all 1-based because every published figure is
    let mut letter_in_chapter = 0u32;
    let mut letter_in_verse = 0u32;
    let mut letters_before_this_chapter = 0usize;
    let mut word_in_chapter = 0u32;
    let mut verse_in_chapter = 0u32;
    let mut chapter_seen = 0u32;
    let mut last_chapter: Option<u32> = None;
    let mut last_verse: Option<(u32, u32)> = None;
    let mut previous_chapter_number: Option<u32> = None;
    let mut previous_verse_number: Option<u32> = None;
    let mut word_index_overall = 0usize;

    for w in &selected {
        if last_chapter != Some(w.chapter) {
            if let Some(prev) = last_chapter {
                previous_chapter_number = Some(prev);
            }
            last_chapter = Some(w.chapter);
            chapter_seen += 1;
            letter_in_chapter = 0;
            word_in_chapter = 0;
            verse_in_chapter = 0;
            last_verse = None;
            letters_before_this_chapter = base
                .as_ref()
                .map(|o| o.letters_before_chapter[w.chapter as usize])
                .unwrap_or(0);
        }
        if last_verse != Some((w.chapter, w.verse)) {
            if let Some((_, v)) = last_verse {
                previous_verse_number = Some(v);
            }
            last_verse = Some((w.chapter, w.verse));
            verse_in_chapter += 1;
            letter_in_verse = 0;
        }
        word_in_chapter += 1;
        word_index_overall += 1;

        fold_into(cfg, w.uthmani, mode, &toggles, &mut buf);
        let mut position_in_word = 0u32;

        for c in buf.chars() {
            position_in_word += 1;
            letter_in_verse += 1;
            letter_in_chapter += 1;
            letters += 1;

            let index = (c as u32 - BLOCK_LO) as usize;
            let letter_base = system.values[index];
            let mut added = 0i64;

            /* With no modifiers on, the value is the plain sum of the letters
             * and every branch below is dead. Skipping them keeps the common
             * case, which is what the default preset does, off the slow path. */
            if !any_modifier {
                value += letter_base;
                if breakdown.len() < BREAKDOWN_CAP {
                    breakdown.push(ValueBreakdown {
                        letter: c.to_string(),
                        base: letter_base,
                        added: 0,
                        total: letter_base,
                        chapter: w.chapter,
                        verse: w.verse,
                        word: w.position,
                        position_in_word,
                    });
                }
                continue;
            }

            if mods.letter_number {
                added += (letters_before_this_chapter + letter_in_chapter as usize) as i64;
            }
            if mods.letter_number_in_word {
                added += position_in_word as i64;
            }
            if mods.letter_number_in_verse {
                added += letter_in_verse as i64;
            }
            if mods.letter_number_in_chapter {
                added += letter_in_chapter as i64;
            }
            if mods.letter_distance && position_in_word > 1 {
                added += 1; // consecutive letters are one apart by construction
            }
            if mods.word_number {
                added += (base
                    .as_ref()
                    .map(|o| o.words_before_chapter[w.chapter as usize])
                    .unwrap_or(0)
                    + word_in_chapter as usize) as i64;
            }
            if mods.word_number_in_verse {
                added += w.position as i64;
            }
            if mods.word_number_in_chapter {
                added += word_in_chapter as i64;
            }
            if mods.word_distance && word_index_overall > 1 {
                added += 1;
            }
            if mods.verse_number {
                added += (base
                    .as_ref()
                    .map(|o| o.verses_before_chapter[w.chapter as usize])
                    .unwrap_or(0)
                    + verse_in_chapter as usize) as i64;
            }
            if mods.verse_number_in_chapter {
                added += w.verse as i64;
            }
            if mods.verse_distance {
                if let Some(prev) = previous_verse_number {
                    added += (w.verse as i64 - prev as i64).abs();
                }
            }
            if mods.chapter_number {
                added += w.chapter as i64;
            }
            if mods.chapter_distance {
                if let Some(prev) = previous_chapter_number {
                    added += (w.chapter as i64 - prev as i64).abs();
                }
            }

            value += letter_base + added;

            if breakdown.len() < BREAKDOWN_CAP {
                breakdown.push(ValueBreakdown {
                    letter: c.to_string(),
                    base: letter_base,
                    added,
                    total: letter_base + added,
                    chapter: w.chapter,
                    verse: w.verse,
                    word: w.position,
                    position_in_word,
                });
            }
        }
    }

    let _ = chapter_seen;

    Ok(ValueResult {
        value,
        letters,
        digit_sum: digit_sum(value),
        digital_root: digital_root(value),
        is_prime: is_prime(value),
        divisors: SMALL_PRIMES
            .iter()
            .copied()
            .filter(|d| value != 0 && value % d == 0)
            .collect(),
        breakdown_truncated: letters > BREAKDOWN_CAP,
        breakdown,
        modifiers: mods.active(),
        provenance: provenance(cfg, mode, &scope, toggles, Some(&system.id)),
    })
}

pub fn presets() -> Vec<PresetInfo> {
    PRESETS
        .iter()
        .map(|(id, label, m)| PresetInfo {
            id: id.to_string(),
            label: label.to_string(),
            modifiers: *m,
        })
        .collect()
}

/* ── roots ─────────────────────────────────────────────────────────────── */

static ROOTS: OnceLock<Vec<&'static str>> = OnceLock::new();

/// The root strings, indexed by the ids `words.tsv` carries.
pub fn roots() -> &'static Vec<&'static str> {
    ROOTS.get_or_init(|| tsv_rows(ROOTS_TSV).map(|r| field(&r, 1)).collect())
}

fn root_strings(w: &Word) -> Vec<&'static str> {
    if w.root_ids.is_empty() {
        return Vec::new();
    }
    let table = roots();
    w.root_ids
        .split(',')
        .filter_map(|id| id.parse::<usize>().ok())
        .filter_map(|i| table.get(i).copied())
        .collect()
}

/* ── search ────────────────────────────────────────────────────────────── */

#[derive(Deserialize, Clone, Copy, Debug, PartialEq, Eq, Default)]
#[serde(rename_all = "snake_case")]
pub enum MatchKind {
    #[default]
    Exact,
    /// Every query word must appear in the verse, in any order and anywhere.
    Proximity,
    /// The query is a root, and every word sharing it matches.
    Root,
}

#[derive(Deserialize, Clone, Copy, Debug, PartialEq, Eq, Default)]
#[serde(rename_all = "snake_case")]
pub enum MatchLocation {
    #[default]
    Anywhere,
    AtStart,
    AtMiddle,
    AtEnd,
}

#[derive(Deserialize, Clone, Copy, Debug, PartialEq, Eq, Default)]
#[serde(rename_all = "snake_case")]
pub enum Wordness {
    #[default]
    WholeWord,
    PartOfWord,
}

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(default)]
pub struct SearchOptions {
    pub kind: MatchKind,
    pub location: MatchLocation,
    pub wordness: Wordness,
    pub scope: Option<Scope>,
    pub mode: Option<String>,
    pub toggles: Option<ToggleInput>,
    pub limit: Option<usize>,
}

#[derive(Serialize, Clone, Debug)]
pub struct VerseHit {
    pub chapter: u32,
    pub verse: u32,
    pub english: &'static str,
    /// Word positions that matched, so the UI can mark them rather than
    /// highlighting the whole verse.
    pub matches: Vec<u32>,
    pub words: usize,
    pub letters: usize,
    pub arabic: String,
    /// Similarity queries rank; text queries leave this at 1.0.
    pub score: f32,
}

#[derive(Serialize, Clone, Debug)]
pub struct SearchResult {
    pub hits: Vec<VerseHit>,
    pub total: usize,
    pub truncated: bool,
    pub provenance: Provenance,
}

const RESULT_CAP: usize = 500;

/// Everything a query compares against is the *folded* stream, not the pointed
/// text, so a search obeys the active text mode the same way a count does.
/// Searching for a hamza with the hamza toggle off finds nothing, which is
/// correct rather than surprising: the letter is not in the corpus being
/// counted.
/// One verse's words, in reading order, tagged with its address. Named because
/// three of the search functions pass it around and the bare tuple reads as
/// noise at every call site.
type VerseGroup = (u32, u32, Vec<&'static Word>);

fn verse_groups(scope: &Scope) -> Vec<VerseGroup> {
    let mut groups: Vec<VerseGroup> = Vec::new();
    for w in words().iter().filter(|w| scope.matches(w)) {
        match groups.last_mut() {
            Some((c, v, list)) if *c == w.chapter && *v == w.verse => list.push(w),
            _ => groups.push((w.chapter, w.verse, vec![w])),
        }
    }
    for (_, _, list) in &mut groups {
        list.sort_by_key(|w| w.position);
    }
    groups
}

fn located(haystack: &str, needle: &str, location: MatchLocation, wordness: Wordness) -> bool {
    if needle.is_empty() {
        return false;
    }
    match wordness {
        Wordness::WholeWord => match location {
            MatchLocation::Anywhere => haystack == needle,
            MatchLocation::AtStart => haystack.starts_with(needle),
            MatchLocation::AtEnd => haystack.ends_with(needle),
            MatchLocation::AtMiddle => {
                haystack.contains(needle)
                    && !haystack.starts_with(needle)
                    && !haystack.ends_with(needle)
            }
        },
        Wordness::PartOfWord => match location {
            MatchLocation::Anywhere => haystack.contains(needle),
            MatchLocation::AtStart => haystack.starts_with(needle),
            MatchLocation::AtEnd => haystack.ends_with(needle),
            MatchLocation::AtMiddle => {
                haystack.contains(needle)
                    && !haystack.starts_with(needle)
                    && !haystack.ends_with(needle)
            }
        },
    }
}

pub fn find_text(query: String, options: Option<SearchOptions>) -> Result<SearchResult, String> {
    let cfg = config()?;
    let opts = options.unwrap_or_default();
    let scope = opts.scope.unwrap_or_default();
    let mode = cfg.mode(opts.mode.as_deref().unwrap_or(DEFAULT_MODE))?;
    let toggles = Toggles::resolve(cfg, opts.toggles);
    let limit = opts.limit.unwrap_or(RESULT_CAP).min(RESULT_CAP);

    let trimmed = query.trim();
    if trimmed.is_empty() {
        return Err("Enter something to search for".to_string());
    }

    /* `-word` excludes and `+word` requires, which is the old app's own syntax
     * and the reason the terms are split before folding: the sigil is not part
     * of the Arabic. */
    let mut required: Vec<String> = Vec::new();
    let mut excluded: Vec<String> = Vec::new();
    for term in trimmed.split_whitespace() {
        let (bucket, rest) = match term.chars().next() {
            Some('-') => (&mut excluded, &term[1..]),
            Some('+') => (&mut required, &term[1..]),
            _ => (&mut required, term),
        };
        let folded = fold_word(cfg, rest, mode, &toggles);
        if !folded.is_empty() {
            bucket.push(folded);
        }
    }

    if opts.kind == MatchKind::Root {
        return find_by_root(cfg, mode, toggles, &scope, trimmed, limit);
    }
    if required.is_empty() {
        return Err("The query folds to nothing under this text mode".to_string());
    }

    let mut hits = Vec::new();
    let mut total = 0usize;

    for (chapter, verse, group) in verse_groups(&scope) {
        let folded: Vec<String> = group
            .iter()
            .map(|w| fold_word(cfg, w.uthmani, mode, &toggles))
            .collect();

        if excluded
            .iter()
            .any(|term| folded.iter().any(|f| f.contains(term.as_str())))
        {
            continue;
        }

        let mut matched: Vec<u32> = Vec::new();
        let satisfied = match opts.kind {
            // every term has to land, and the positions of all of them are returned
            MatchKind::Exact | MatchKind::Proximity => required.iter().all(|term| {
                let mut found = false;
                for (i, f) in folded.iter().enumerate() {
                    if located(f, term, opts.location, opts.wordness) {
                        matched.push(group[i].position);
                        found = true;
                    }
                }
                found
            }),
            MatchKind::Root => unreachable!("handled above"),
        };

        if !satisfied {
            continue;
        }
        matched.sort_unstable();
        matched.dedup();
        total += 1;
        if hits.len() < limit {
            hits.push(VerseHit {
                chapter,
                verse,
                english: english().get(&(chapter, verse)).copied().unwrap_or(""),
                matches: matched,
                words: group.len(),
                letters: folded.iter().map(|f| f.chars().count()).sum(),
                arabic: group
                    .iter()
                    .map(|w| w.uthmani)
                    .collect::<Vec<_>>()
                    .join(" "),
                score: 1.0,
            });
        }
    }

    Ok(SearchResult {
        truncated: total > hits.len(),
        total,
        hits,
        provenance: provenance(cfg, mode, &scope, toggles, None),
    })
}

fn find_by_root(
    cfg: &'static Config,
    mode: &Mode,
    toggles: Toggles,
    scope: &Scope,
    query: &str,
    limit: usize,
) -> Result<SearchResult, String> {
    // Roots are stored space-separated ("ط ه ر"); accept them typed either way.
    let wanted: String = query.chars().filter(|c| !c.is_whitespace()).collect();
    if wanted.is_empty() {
        return Err("Enter a root".to_string());
    }

    let mut hits = Vec::new();
    let mut total = 0usize;

    for (chapter, verse, group) in verse_groups(scope) {
        let matched: Vec<u32> = group
            .iter()
            .filter(|w| {
                root_strings(w)
                    .iter()
                    .any(|r| r.chars().filter(|c| !c.is_whitespace()).collect::<String>() == wanted)
            })
            .map(|w| w.position)
            .collect();
        if matched.is_empty() {
            continue;
        }
        total += 1;
        if hits.len() < limit {
            hits.push(VerseHit {
                chapter,
                verse,
                english: english().get(&(chapter, verse)).copied().unwrap_or(""),
                matches: matched,
                words: group.len(),
                letters: group
                    .iter()
                    .map(|w| fold_word(cfg, w.uthmani, mode, &toggles).chars().count())
                    .sum(),
                arabic: group
                    .iter()
                    .map(|w| w.uthmani)
                    .collect::<Vec<_>>()
                    .join(" "),
                score: 1.0,
            });
        }
    }

    Ok(SearchResult {
        truncated: total > hits.len(),
        total,
        hits,
        provenance: provenance(cfg, mode, scope, toggles, None),
    })
}

/* ── similarity ────────────────────────────────────────────────────────── */

/* The shared `Similar` prefix is deliberate: these are the four method names
 * the original app uses, and a researcher moving across should find them
 * spelled the way they already know. */
#[allow(clippy::enum_variant_names)]
#[derive(Deserialize, Clone, Copy, Debug, PartialEq, Eq, Default)]
#[serde(rename_all = "snake_case")]
pub enum SimilarityMethod {
    #[default]
    SimilarText,
    SimilarWords,
    SimilarStart,
    SimilarEnd,
}

/// Levenshtein over two folded letter streams, with the usual two-row trick so
/// the whole corpus can be compared without allocating a matrix per pair.
fn levenshtein(a: &[char], b: &[char]) -> usize {
    if a.is_empty() {
        return b.len();
    }
    if b.is_empty() {
        return a.len();
    }
    let mut prev: Vec<usize> = (0..=b.len()).collect();
    let mut curr = vec![0usize; b.len() + 1];
    for (i, ca) in a.iter().enumerate() {
        curr[0] = i + 1;
        for (j, cb) in b.iter().enumerate() {
            let cost = if ca == cb { 0 } else { 1 };
            curr[j + 1] = (prev[j + 1] + 1).min(curr[j] + 1).min(prev[j] + cost);
        }
        std::mem::swap(&mut prev, &mut curr);
    }
    prev[b.len()]
}

fn ratio(a: &[char], b: &[char]) -> f32 {
    let longest = a.len().max(b.len());
    if longest == 0 {
        return 1.0;
    }
    1.0 - (levenshtein(a, b) as f32 / longest as f32)
}

pub fn find_similar(
    chapter: u32,
    verse: u32,
    method: Option<SimilarityMethod>,
    threshold: Option<f32>,
    mode_id: Option<String>,
    toggles: Option<ToggleInput>,
    limit: Option<usize>,
) -> Result<SearchResult, String> {
    let cfg = config()?;
    let mode = cfg.mode(mode_id.as_deref().unwrap_or(DEFAULT_MODE))?;
    let toggles = Toggles::resolve(cfg, toggles);
    let method = method.unwrap_or_default();
    let threshold = threshold.unwrap_or(0.8).clamp(0.0, 1.0);
    let limit = limit.unwrap_or(100).min(RESULT_CAP);
    let scope = Scope::default();

    let groups = verse_groups(&scope);
    let source = groups
        .iter()
        .find(|(c, v, _)| *c == chapter && *v == verse)
        .ok_or_else(|| format!("No text found for {}:{}", chapter, verse))?;

    let fold_group = |group: &Vec<&'static Word>| -> Vec<char> {
        let joined: String = group
            .iter()
            .map(|w| fold_word(cfg, w.uthmani, mode, &toggles))
            .collect();
        joined.chars().collect()
    };

    let source_letters = fold_group(&source.2);
    let source_words: Vec<String> = source
        .2
        .iter()
        .map(|w| fold_word(cfg, w.uthmani, mode, &toggles))
        .collect();

    /* Half-verse comparisons take the first or last half of the letter stream,
     * which is what makes "same opening" and "same ending" distinct questions
     * from overall similarity. */
    let half = |letters: &[char], start: bool| -> Vec<char> {
        let n = letters.len() / 2;
        if start {
            letters[..n].to_vec()
        } else {
            letters[letters.len() - n..].to_vec()
        }
    };

    let mut scored: Vec<(f32, &VerseGroup)> = Vec::new();

    for group in &groups {
        if group.0 == chapter && group.1 == verse {
            continue;
        }
        let letters = fold_group(&group.2);

        // A length gap wider than the threshold allows cannot score above it,
        // so the expensive comparison is skipped outright.
        let longest = letters.len().max(source_letters.len()) as f32;
        if longest > 0.0 {
            let gap = (letters.len() as i64 - source_letters.len() as i64).unsigned_abs() as f32;
            if 1.0 - gap / longest < threshold {
                continue;
            }
        }

        let score = match method {
            SimilarityMethod::SimilarText => ratio(&source_letters, &letters),
            SimilarityMethod::SimilarStart => {
                ratio(&half(&source_letters, true), &half(&letters, true))
            }
            SimilarityMethod::SimilarEnd => {
                ratio(&half(&source_letters, false), &half(&letters, false))
            }
            SimilarityMethod::SimilarWords => {
                let other: Vec<String> = group
                    .2
                    .iter()
                    .map(|w| fold_word(cfg, w.uthmani, mode, &toggles))
                    .collect();
                let shared = source_words.iter().filter(|w| other.contains(w)).count();
                let union = source_words.len().max(other.len());
                if union == 0 {
                    0.0
                } else {
                    shared as f32 / union as f32
                }
            }
        };

        if score >= threshold {
            scored.push((score, group));
        }
    }

    scored.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap_or(std::cmp::Ordering::Equal));
    let total = scored.len();

    let hits = scored
        .into_iter()
        .take(limit)
        .map(|(score, group)| VerseHit {
            chapter: group.0,
            verse: group.1,
            english: english().get(&(group.0, group.1)).copied().unwrap_or(""),
            matches: Vec::new(),
            words: group.2.len(),
            letters: fold_group(&group.2).len(),
            arabic: group
                .2
                .iter()
                .map(|w| w.uthmani)
                .collect::<Vec<_>>()
                .join(" "),
            score,
        })
        .collect::<Vec<_>>();

    Ok(SearchResult {
        truncated: total > hits.len(),
        total,
        hits,
        provenance: provenance(cfg, mode, &scope, toggles, None),
    })
}

/* ── find by number ────────────────────────────────────────────────────── */

#[derive(Deserialize, Clone, Copy, Debug, PartialEq, Eq, Default)]
#[serde(rename_all = "snake_case")]
pub enum NumberTarget {
    #[default]
    Value,
    Letters,
    Words,
    UniqueLetters,
}

/// The inverse of the value calculator: which verses hit a given number.
pub fn find_by_number(
    target: i64,
    quantity: Option<NumberTarget>,
    mode_id: Option<String>,
    toggles: Option<ToggleInput>,
    value_system: Option<String>,
    scope: Option<Scope>,
    limit: Option<usize>,
) -> Result<SearchResult, String> {
    let cfg = config()?;
    let scope = scope.unwrap_or_default();
    let mode = cfg.mode(mode_id.as_deref().unwrap_or(DEFAULT_MODE))?;
    let toggles = Toggles::resolve(cfg, toggles);
    let quantity = quantity.unwrap_or_default();
    let limit = limit.unwrap_or(200).min(RESULT_CAP);
    let system = match value_system.as_deref() {
        None | Some("") => None,
        Some(id) => Some(find_value_system(id)?),
    };
    if quantity == NumberTarget::Value && system.is_none() {
        return Err("Searching by value needs a value system".to_string());
    }

    let mut hits = Vec::new();
    let mut total = 0usize;

    for (chapter, verse, group) in verse_groups(&scope) {
        let folded: Vec<String> = group
            .iter()
            .map(|w| fold_word(cfg, w.uthmani, mode, &toggles))
            .collect();
        let stream: String = folded.concat();
        let letters = stream.chars().count();

        let actual: i64 = match quantity {
            NumberTarget::Letters => letters as i64,
            NumberTarget::Words => group.len() as i64,
            NumberTarget::UniqueLetters => stream.chars().collect::<HashSet<_>>().len() as i64,
            NumberTarget::Value => stream
                .chars()
                .map(|c| {
                    system
                        .map(|s| s.values[(c as u32 - BLOCK_LO) as usize])
                        .unwrap_or(0)
                })
                .sum(),
        };

        if actual != target {
            continue;
        }
        total += 1;
        if hits.len() < limit {
            hits.push(VerseHit {
                chapter,
                verse,
                english: english().get(&(chapter, verse)).copied().unwrap_or(""),
                matches: Vec::new(),
                words: group.len(),
                letters,
                arabic: group
                    .iter()
                    .map(|w| w.uthmani)
                    .collect::<Vec<_>>()
                    .join(" "),
                score: 1.0,
            });
        }
    }

    Ok(SearchResult {
        truncated: total > hits.len(),
        total,
        hits,
        provenance: provenance(cfg, mode, &scope, toggles, system.map(|s| s.id.as_str())),
    })
}

/* ── one word ──────────────────────────────────────────────────────────── */

#[derive(Serialize, Clone, Debug)]
pub struct WordInfo {
    pub chapter: u32,
    pub verse: u32,
    pub position: u32,
    pub uthmani: &'static str,
    pub folded: String,
    pub gloss: &'static str,
    pub translit: &'static str,
    pub roots: Vec<&'static str>,
    /// How many words in the corpus share this word's first root, which is what
    /// the related-words lookup would return.
    pub root_occurrences: usize,
}

pub fn word_info(
    chapter: u32,
    verse: u32,
    position: u32,
    mode_id: Option<String>,
    toggles: Option<ToggleInput>,
) -> Result<WordInfo, String> {
    let cfg = config()?;
    let mode = cfg.mode(mode_id.as_deref().unwrap_or(DEFAULT_MODE))?;
    let toggles = Toggles::resolve(cfg, toggles);

    let w = words()
        .iter()
        .find(|w| w.chapter == chapter && w.verse == verse && w.position == position)
        .ok_or_else(|| format!("No word at {}:{}:{}", chapter, verse, position))?;

    let word_roots = root_strings(w);
    let occurrences = match word_roots.first() {
        Some(first) => words()
            .iter()
            .filter(|other| root_strings(other).iter().any(|r| r == first))
            .count(),
        None => 0,
    };

    Ok(WordInfo {
        chapter,
        verse,
        position,
        uthmani: w.uthmani,
        folded: fold_word(cfg, w.uthmani, mode, &toggles),
        gloss: w.gloss,
        translit: w.translit,
        roots: word_roots,
        root_occurrences: occurrences,
    })
}

/// Every root in the corpus with its occurrence count, for the root picker.
#[derive(Serialize, Clone, Debug)]
pub struct RootInfo {
    pub root: &'static str,
    pub occurrences: usize,
}

pub fn root_list() -> Vec<RootInfo> {
    let mut counts: HashMap<&'static str, usize> = HashMap::new();
    for w in words() {
        for r in root_strings(w) {
            *counts.entry(r).or_insert(0) += 1;
        }
    }
    let mut list: Vec<RootInfo> = counts
        .into_iter()
        .map(|(root, occurrences)| RootInfo { root, occurrences })
        .collect();
    list.sort_by(|a, b| b.occurrences.cmp(&a.occurrences).then(a.root.cmp(b.root)));
    list
}

/* ── a whole chapter, and an arbitrary selection ───────────────────────── */

#[derive(Serialize, Clone, Debug)]
pub struct ChapterView {
    pub chapter: u32,
    pub name_arabic: &'static str,
    pub name_english: &'static str,
    pub name_transliterated: &'static str,
    pub revelation_order: u32,
    pub verses: Vec<VerseView>,
    /// The unnumbered Basmalah, where the chapter has one. Carried separately
    /// from `verses` because it is not verse 1 and must not be counted as one.
    pub basmalah: Option<VerseView>,
    pub provenance: Provenance,
}

/// A whole sura in reading order.
///
/// The verse browser needs this to show a chapter rather than one verse at a
/// time. It is one pass over the corpus rather than N round trips, which
/// matters for Al-Baqarah's 286 verses.
pub fn get_chapter(
    chapter: u32,
    mode_id: Option<String>,
    toggles: Option<ToggleInput>,
) -> Result<ChapterView, String> {
    let cfg = config()?;
    let mode = cfg.mode(mode_id.as_deref().unwrap_or(DEFAULT_MODE))?;
    let toggles = Toggles::resolve(cfg, toggles);

    let meta = chapters()
        .iter()
        .find(|c| c.number == chapter)
        .ok_or_else(|| format!("Chapter {} does not exist (the Quran has 114)", chapter))?;

    let mut basmalah_words: Vec<&Word> = Vec::new();
    let mut grouped: Vec<(u32, Vec<&'static Word>)> = Vec::new();

    for w in words().iter().filter(|w| w.chapter == chapter) {
        if !w.canonical {
            basmalah_words.push(w);
            continue;
        }
        match grouped.last_mut() {
            Some((v, list)) if *v == w.verse => list.push(w),
            _ => grouped.push((w.verse, vec![w])),
        }
    }

    let scope = Scope {
        chapter: Some(chapter),
        ..Scope::default()
    };
    let build = |verse: u32, mut group: Vec<&'static Word>| -> VerseView {
        group.sort_by_key(|w| w.position);
        VerseView {
            chapter,
            verse,
            english: english()
                .get(&(chapter, verse))
                .copied()
                .unwrap_or("")
                .to_string(),
            words: group
                .iter()
                .map(|w| {
                    let folded = fold_word(cfg, w.uthmani, mode, &toggles);
                    WordView {
                        position: w.position,
                        uthmani: w.uthmani,
                        letters: folded.chars().count(),
                        folded,
                        gloss: w.gloss,
                        translit: w.translit,
                        canonical: w.canonical,
                    }
                })
                .collect(),
            divisions: divisions_of(chapter, verse),
            provenance: provenance(cfg, mode, &scope, toggles, None),
        }
    };

    let basmalah = if basmalah_words.is_empty() {
        None
    } else {
        let mut list: Vec<&'static Word> = basmalah_words.into_iter().collect();
        list.sort_by_key(|w| w.position);
        Some(build(0, list))
    };

    Ok(ChapterView {
        chapter,
        name_arabic: meta.name_arabic,
        name_english: meta.name_english,
        name_transliterated: meta.name_transliterated,
        revelation_order: meta.revelation_order,
        verses: grouped.into_iter().map(|(v, g)| build(v, g)).collect(),
        basmalah,
        provenance: provenance(cfg, mode, &scope, toggles, None),
    })
}

#[derive(Serialize, Clone, Debug)]
pub struct SelectionValue {
    /// The selection folded to countable letters, so the researcher can see
    /// what was actually measured rather than what was highlighted.
    pub folded: String,
    pub letters: usize,
    pub words: usize,
    pub unique_letters: usize,
    pub value: i64,
    pub digit_sum: i64,
    pub digital_root: i64,
    pub is_prime: bool,
    pub divisors: Vec<i64>,
    pub provenance: Provenance,
}

/// Counts and values an arbitrary run of Arabic.
///
/// This is what a mouse selection resolves to. The text arrives with whatever
/// the user dragged across, so it is folded by the active mode exactly as the
/// corpus is: the number that comes back is the number the same letters would
/// contribute to any other count.
///
/// Positional modifiers deliberately do not apply. A free selection has no
/// address, so "the letter's number in its verse" has no answer, and inventing
/// one by numbering from the start of the selection would produce a figure that
/// silently disagrees with the same letters counted in place.
pub fn value_of_text(
    text: String,
    mode_id: Option<String>,
    toggles: Option<ToggleInput>,
    value_system: Option<String>,
) -> Result<SelectionValue, String> {
    let cfg = config()?;
    let mode = cfg.mode(mode_id.as_deref().unwrap_or(DEFAULT_MODE))?;
    if !mode.countable {
        return Err(format!(
            "'{}' is a reading mode, not a counting basis, so a selection has no value in it",
            mode.label
        ));
    }
    let toggles = Toggles::resolve(cfg, toggles);
    let system = match value_system.as_deref() {
        None | Some("") | Some("none") => None,
        Some(id) => Some(find_value_system(id)?),
    };

    let word_count = text
        .split_whitespace()
        .filter(|part| !fold_word(cfg, part, mode, &toggles).is_empty())
        .count();
    let folded: String = text
        .split_whitespace()
        .map(|part| fold_word(cfg, part, mode, &toggles))
        .collect();

    if folded.is_empty() {
        return Err("Nothing in the selection counts as a letter under this text mode".to_string());
    }

    let mut unique = [false; BLOCK_LEN];
    let mut unique_count = 0usize;
    let mut value = 0i64;
    for c in folded.chars() {
        let index = (c as u32 - BLOCK_LO) as usize;
        if !unique[index] {
            unique[index] = true;
            unique_count += 1;
        }
        if let Some(sys) = system {
            value += sys.values[index];
        }
    }

    let scope = Scope::default();
    let mut prov = provenance(cfg, mode, &scope, toggles, system.map(|s| s.id.as_str()));
    prov.scope = "selection".to_string();

    Ok(SelectionValue {
        letters: folded.chars().count(),
        words: word_count,
        unique_letters: unique_count,
        value,
        digit_sum: digit_sum(value),
        digital_root: digital_root(value),
        is_prime: is_prime(value),
        divisors: SMALL_PRIMES
            .iter()
            .copied()
            .filter(|d| value != 0 && value % d == 0)
            .collect(),
        folded,
        provenance: prov,
    })
}

/* ── the fixture ledger ────────────────────────────────────────────────── */

/// One published figure, what this corpus computes for it, and whether the two
/// agree.
///
/// The ledger is bundled rather than recomputed because the generator already
/// refuses to write a dataset that fails a `verified` fixture, so every entry
/// marked verified is true of the very bytes the binary was built from. What
/// the surface adds is that a reader can see the list, including the entries
/// that do *not* reproduce, without reading the build log.
#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct Fixture {
    pub id: String,
    pub mode: String,
    pub description: String,
    pub expected: i64,
    pub actual: i64,
    pub pass: bool,
    /// `verified` or `known_gap`.
    pub status: String,
}

#[derive(Deserialize)]
struct RawLedger {
    fixtures: Vec<Fixture>,
}

#[derive(Serialize, Clone, Debug)]
pub struct Ledger {
    pub fixtures: Vec<Fixture>,
    pub verified: usize,
    pub known_gaps: usize,
    /// The summed absolute difference between computed and published across
    /// every gap. The count of gaps is a poor measure on its own, because
    /// adding a fixture that nearly reproduces raises it; this is the number
    /// that has to go down.
    pub distance: i64,
}

pub fn ledger() -> Result<Ledger, String> {
    let raw: RawLedger =
        serde_json::from_str(FIXTURES_JSON).map_err(|e| format!("fixtures.json: {}", e))?;
    let verified = raw.fixtures.iter().filter(|f| f.status == "verified").count();
    let distance = raw
        .fixtures
        .iter()
        .filter(|f| f.status != "verified")
        .map(|f| (f.actual - f.expected).abs())
        .sum();
    Ok(Ledger {
        known_gaps: raw.fixtures.len() - verified,
        verified,
        distance,
        fixtures: raw.fixtures,
    })
}

/* ── aggregation ───────────────────────────────────────────────────────── */

/// Which word instances an aggregate runs over.
///
/// `Scope` cannot express the questions this module exists to answer. The
/// published arguments select a *set* of word instances scattered across the
/// corpus and then total something about them: how many there are, how many
/// verses they touch, what their verse numbers add up to. Every field here
/// narrows that set, they intersect rather than union, and an empty query is
/// the whole corpus.
#[derive(Deserialize, Clone, Debug, Default)]
#[serde(default)]
pub struct AggregateQuery {
    /// Matched against the word's folded form, so a selection obeys the active
    /// text mode exactly as a count does.
    pub text: Option<String>,
    /// Match the whole folded word when true, any part of it otherwise.
    pub whole_word: Option<bool>,
    /// Restricts to words carrying this root. Intersecting a root with `text`
    /// is what separates a proper name from its homographs: the divine name is
    /// root 56 *and* contains لله, where اللهم carries a different root and
    /// ضلالة a different root again. Either filter alone overcounts.
    pub root_id: Option<u32>,
    /// Inclusive `(chapter, verse)` bounds, compared as addresses so a span
    /// crosses chapters. Separate from `scope`, which has no way to say
    /// "from 2:1 to 68:1".
    pub from: Option<(u32, u32)>,
    pub to: Option<(u32, u32)>,
    /// Word position within `from` and `to`, for a span that starts or ends
    /// part-way through a verse. Appendix 1 needs this for the words between
    /// the two Basmalahs of sura 27, which begin and end mid-verse. Ignored
    /// unless the corresponding bound is set.
    pub from_word: Option<u32>,
    pub to_word: Option<u32>,
    /// `Some(true)` keeps only suras carrying Quranic Initials, `Some(false)`
    /// only those carrying none. The initials are a property of the sura, not
    /// of the word, so this cannot be expressed as a text filter.
    pub initialed: Option<bool>,
    /// `Makkah` or `Medina`. Matched case-insensitively because it arrives from
    /// a UI control rather than from the data.
    pub revelation_place: Option<String>,
    /// `Some(true)` keeps only verses of prostration, `Some(false)` excludes
    /// them. Fifteen verses, so the false case is nearly the whole corpus and
    /// exists mainly to make the pair symmetrical.
    pub prostration: Option<bool>,
    /// Only verses carrying this number, in every chapter at once. This is the
    /// cross-cutting selection behind "every verse numbered 19".
    pub verse_number: Option<u32>,
    /// An explicit chapter set, for an argument about a group of suras that is
    /// not a contiguous range.
    pub chapters: Option<Vec<u32>>,
    /// Letters to count inside the selected words. Absent counts every letter,
    /// which is what lets one command answer both "how many occurrences" and
    /// "how many times does ق appear in them".
    pub letters: Option<String>,
    /// Everything `Scope` already means.
    pub scope: Option<Scope>,
}

/// One total, with the divisibility test already applied.
///
/// The UI renders a row per figure rather than a fixed set of fields, so adding
/// a figure here needs no frontend change, and no figure can reach the screen
/// without its remainder beside it.
#[derive(Serialize, Clone, Debug)]
pub struct Figure {
    pub id: String,
    pub label: String,
    pub total: i64,
    pub exact: bool,
    pub quotient: i64,
    pub remainder: i64,
    pub digit_sum: i64,
    pub digital_root: i64,
}

fn figure(id: &str, label: &str, total: i64, divisor: i64) -> Figure {
    let d = if divisor == 0 { 1 } else { divisor };
    Figure {
        id: id.to_string(),
        label: label.to_string(),
        total,
        exact: total % d == 0,
        quotient: total / d,
        remainder: total % d,
        digit_sum: digit_sum(total),
        digital_root: digital_root(total),
    }
}

#[derive(Serialize, Clone, Debug)]
pub struct Aggregate {
    pub provenance: Provenance,
    pub divisor: i64,
    pub selector: String,
    pub occurrences: usize,
    pub verses: usize,
    pub chapters: usize,
    pub letters: i64,
    pub value: Option<i64>,
    pub first: Option<String>,
    pub last: Option<String>,
    /// The opening addresses of the match set, so a figure can be spot-checked
    /// without re-running the query as a search.
    pub examples: Vec<String>,
    pub figures: Vec<Figure>,
}

const EXAMPLE_CAP: usize = 24;

/// Totals a selected set of word instances and tests each total for
/// divisibility.
///
/// Two sums over verse numbers are reported, not one. "The numbers of the
/// verses where the word occurs" is ambiguous between summing each distinct
/// verse once and summing it once per occurrence, and the two differ by a lot:
/// for the divine name they are 118,123 and 182,034. A tool that silently
/// picked one would let a reader believe a figure they never asked for, so both
/// are named and both are shown.
///
/// The 112 unnumbered Basmalah groups are excluded from every verse count and
/// every number sum even when the scope includes them, because an unnumbered
/// verse has no number to contribute. They still contribute occurrences and
/// letters, which is what the published initial counts need.
pub fn aggregate(
    query: Option<AggregateQuery>,
    mode: Option<String>,
    toggles: Option<ToggleInput>,
    value_system: Option<String>,
    divisor: Option<i64>,
) -> Result<Aggregate, String> {
    let cfg = config()?;
    let q = query.unwrap_or_default();
    let mode = cfg.mode(mode.as_deref().unwrap_or(DEFAULT_MODE))?;
    if !mode.countable {
        return Err(format!("{} is not a countable text mode", mode.label));
    }
    let toggles = Toggles::resolve(cfg, toggles);
    let system = match value_system.as_deref() {
        Some(id) if id != "none" => Some(find_value_system(id)?),
        _ => None,
    };
    let divisor = divisor.unwrap_or(19).max(1);
    let scope = q.scope.unwrap_or_default();

    let needle = q
        .text
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| fold_word(cfg, s, mode, &toggles));
    if let Some(n) = &needle {
        if n.is_empty() {
            return Err("Nothing in that query survives this text mode".to_string());
        }
    }
    let wordness = if q.whole_word.unwrap_or(false) {
        Wordness::WholeWord
    } else {
        Wordness::PartOfWord
    };
    let letter_filter: Option<Vec<char>> = q
        .letters
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| fold_word(cfg, s, mode, &toggles).chars().collect());

    /* Resolved to a set of sura numbers before the loop rather than looked up
       per word: revelation place is a property of the sura, so scanning the
       chapter table 77,401 times would be 77,401 scans of the same 114 rows. */
    let place_filter: Option<HashSet<u32>> = q.revelation_place.as_deref().map(|p| {
        chapters()
            .iter()
            .filter(|c| c.revelation_place.eq_ignore_ascii_case(p))
            .map(|c| c.number)
            .collect()
    });

    let mut buf = String::with_capacity(32);
    let mut chapters: HashSet<u32> = HashSet::new();
    let mut verses: HashSet<(u32, u32)> = HashSet::new();
    let mut occurrences = 0usize;
    let mut letters = 0i64;
    let mut value = 0i64;
    let mut sum_positions = 0i64;
    let mut sum_verse_per_occurrence = 0i64;
    let mut first: Option<(u32, u32, u32)> = None;
    let mut last: Option<(u32, u32, u32)> = None;
    let mut examples: Vec<String> = Vec::new();

    for w in words() {
        if !scope.matches(w) {
            continue;
        }
        if let Some(n) = q.verse_number {
            if w.verse != n {
                continue;
            }
        }
        if let Some(list) = &q.chapters {
            if !list.contains(&w.chapter) {
                continue;
            }
        }
        /* Compared as three-part addresses so a bound can land mid-verse. The
           word component defaults to the open end, so an unset `from_word`
           takes the verse from its first word and an unset `to_word` takes it
           to its last, which is what a verse-level bound means. */
        if let Some((fc, fv)) = q.from {
            if (w.chapter, w.verse, w.position) < (fc, fv, q.from_word.unwrap_or(0)) {
                continue;
            }
        }
        if let Some((tc, tv)) = q.to {
            if (w.chapter, w.verse, w.position) > (tc, tv, q.to_word.unwrap_or(u32::MAX)) {
                continue;
            }
        }
        if let Some(want) = q.initialed {
            let has = chapter_initials(w.chapter).is_some_and(|i| !i.is_empty());
            if has != want {
                continue;
            }
        }
        if let Some(set) = &place_filter {
            if !set.contains(&w.chapter) {
                continue;
            }
        }
        if let Some(want) = q.prostration {
            if is_prostration(w.chapter, w.verse) != want {
                continue;
            }
        }
        if let Some(rid) = q.root_id {
            let wanted = rid.to_string();
            if !w.root_ids.split(',').any(|id| id == wanted) {
                continue;
            }
        }

        fold_into(cfg, w.uthmani, mode, &toggles, &mut buf);
        if let Some(n) = &needle {
            if !located(&buf, n, MatchLocation::Anywhere, wordness) {
                continue;
            }
        }

        occurrences += 1;
        chapters.insert(w.chapter);
        let at = (w.chapter, w.verse, w.position);
        if first.is_none() {
            first = Some(at);
        }
        last = Some(at);
        if examples.len() < EXAMPLE_CAP {
            examples.push(format!("{}:{}:{}", w.chapter, w.verse, w.position));
        }
        sum_positions += w.position as i64;
        if w.canonical {
            verses.insert((w.chapter, w.verse));
            sum_verse_per_occurrence += w.verse as i64;
        }

        for c in buf.chars() {
            if let Some(set) = &letter_filter {
                if !set.contains(&c) {
                    continue;
                }
            }
            letters += 1;
            if let Some(sys) = system {
                value += sys.values[(c as u32 - BLOCK_LO) as usize];
            }
        }
    }

    let sum_chapter_numbers: i64 = verses.iter().map(|(c, _)| *c as i64).sum();
    let sum_verse_numbers: i64 = verses.iter().map(|(_, v)| *v as i64).sum();
    /* Once per sura rather than once per verse. Several published arguments are
       arithmetic over sura numbers themselves, such as the sura numbers from 9
       to 27 totalling 342, and summing them once per verse would give a figure
       nobody asked for. */
    let sum_chapter_numbers_once: i64 = chapters.iter().map(|c| *c as i64).sum();

    let mut figures = vec![
        figure("occurrences", "Occurrences", occurrences as i64, divisor),
        figure("verses", "Verses touched", verses.len() as i64, divisor),
        figure("chapters", "Suras touched", chapters.len() as i64, divisor),
        figure(
            "letters",
            if letter_filter.is_some() {
                "Letters matched"
            } else {
                "Letters"
            },
            letters,
            divisor,
        ),
        figure(
            "sum_verse_numbers",
            "Sum of verse numbers, per verse",
            sum_verse_numbers,
            divisor,
        ),
        figure(
            "sum_verse_numbers_per_occurrence",
            "Sum of verse numbers, per occurrence",
            sum_verse_per_occurrence,
            divisor,
        ),
        figure(
            "sum_chapter_numbers",
            "Sum of sura numbers, per verse",
            sum_chapter_numbers,
            divisor,
        ),
        figure(
            "sum_chapter_numbers_once",
            "Sum of sura numbers, per sura",
            sum_chapter_numbers_once,
            divisor,
        ),
        figure(
            "sum_addresses",
            "Sum of sura + verse, per verse",
            sum_chapter_numbers + sum_verse_numbers,
            divisor,
        ),
        figure(
            "sum_word_positions",
            "Sum of word positions",
            sum_positions,
            divisor,
        ),
    ];
    if system.is_some() {
        figures.push(figure("value", "Value", value, divisor));
    }

    let addr = |a: Option<(u32, u32, u32)>| a.map(|(c, v, p)| format!("{}:{}:{}", c, v, p));

    Ok(Aggregate {
        provenance: provenance(cfg, mode, &scope, toggles, system.map(|s| s.id.as_str())),
        divisor,
        selector: describe_selector(&q),
        occurrences,
        verses: verses.len(),
        chapters: chapters.len(),
        letters,
        value: system.map(|_| value),
        first: addr(first),
        last: addr(last),
        examples,
        figures,
    })
}

/// A one-line restatement of what was selected, so a copied figure carries the
/// question as well as the answer. Provenance covers the counting convention;
/// this covers the selection, and a figure needs both to be checkable.
fn describe_selector(q: &AggregateQuery) -> String {
    let mut parts: Vec<String> = Vec::new();
    if let Some(t) = q.text.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        parts.push(if q.whole_word.unwrap_or(false) {
            format!("word \"{}\"", t)
        } else {
            format!("containing \"{}\"", t)
        });
    }
    if let Some(r) = q.root_id {
        parts.push(format!("root #{}", r));
    }
    if let Some(n) = q.verse_number {
        parts.push(format!("verses numbered {}", n));
    }
    if let Some(on) = q.initialed {
        parts.push(if on {
            "initialed suras".to_string()
        } else {
            "un-initialed suras".to_string()
        });
    }
    if let Some(place) = &q.revelation_place {
        parts.push(format!("{} suras", place));
    }
    if let Some(on) = q.prostration {
        parts.push(if on {
            "verses of prostration".to_string()
        } else {
            "excluding verses of prostration".to_string()
        });
    }
    if let Some(list) = &q.chapters {
        parts.push(format!(
            "suras {}",
            list.iter()
                .map(|c| c.to_string())
                .collect::<Vec<_>>()
                .join(", ")
        ));
    }
    let at = |a: Option<(u32, u32)>, w: Option<u32>| match (a, w) {
        (Some((c, v)), Some(p)) => format!("{}:{}:{}", c, v, p),
        (Some((c, v)), None) => format!("{}:{}", c, v),
        (None, _) => String::new(),
    };
    match (q.from, q.to) {
        (Some(_), Some(_)) => parts.push(format!(
            "{} to {}",
            at(q.from, q.from_word),
            at(q.to, q.to_word)
        )),
        (Some(_), None) => parts.push(format!("from {}", at(q.from, q.from_word))),
        (None, Some(_)) => parts.push(format!("up to {}", at(q.to, q.to_word))),
        (None, None) => {}
    }
    if let Some(l) = q.letters.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        parts.push(format!("counting {}", l));
    }
    if parts.is_empty() {
        "every word in scope".to_string()
    } else {
        parts.join(", ")
    }
}

/* ── tests ─────────────────────────────────────────────────────────────── */

#[cfg(test)]
mod tests {
    use super::*;

    /// The two classical orderings agree up to nun and diverge after it, which
    /// is the whole reason both are bundled: a value quoted without naming its
    /// ordering is ambiguous between them.
    #[test]
    fn the_two_abjad_orderings_agree_early_and_diverge_late() {
        let std = find_value_system("abjad_standard").unwrap();
        let mag = find_value_system("abjad_maghribi").unwrap();
        let v = |sys: &ValueSystem, c: char| sys.values[(c as u32 - BLOCK_LO) as usize];

        for c in "ابجدهوزحطيكلمن".chars() {
            assert_eq!(v(std, c), v(mag, c), "{} should agree in both orderings", c);
        }
        assert_eq!((v(std, 'ص'), v(mag, 'ص')), (90, 60));
        assert_eq!((v(std, 'س'), v(mag, 'س')), (60, 300));
        assert_eq!((v(std, 'ش'), v(mag, 'ش')), (300, 1000));
        assert_eq!((v(std, 'غ'), v(mag, 'غ')), (1000, 900));
    }

    fn cfg() -> &'static Config {
        config().expect("bundled text_modes.json must parse")
    }

    fn defaults() -> Toggles {
        Toggles::defaults(cfg())
    }

    /// Counts one letter class over a chapter with the sura's unnumbered
    /// Basmalah included, which is what the published initial counts do.
    fn initials(chapter: u32, letters: &str, mode_id: &str) -> usize {
        let scope = Scope {
            chapter: Some(chapter),
            include_basmalah: Some(true),
            ..Scope::default()
        };
        let mode = cfg().mode(mode_id).unwrap();
        let mut n = 0;
        for w in scope.words() {
            for c in fold_word(cfg(), w.uthmani, mode, &defaults()).chars() {
                if letters.contains(c) {
                    n += 1;
                }
            }
        }
        n
    }

    fn ap1(chapter: u32, letters: &str) -> usize {
        initials(chapter, letters, "khalifa_appendix1")
    }

    #[test]
    fn config_parses_and_declares_three_modes() {
        let c = cfg();
        assert_eq!(c.modes.len(), 3);
        assert!(c.mode("simplified29").unwrap().countable);
        assert!(c.mode("khalifa_appendix1").unwrap().countable);
        assert!(!c.mode("original").unwrap().countable);
    }

    #[test]
    fn toggle_defaults_come_from_the_bundled_config() {
        let d = defaults();
        assert!(d.hamza_on_line, "hamza on the line counts by default");
        assert!(!d.superscript_alef);
        assert!(!d.small_waw_yeh);
        assert!(d.silent_marked);
    }

    #[test]
    fn corpus_totals_match_the_generator() {
        let counts = count(None, None, None).unwrap();
        let s29 = counts
            .iter()
            .find(|c| c.provenance.text_mode == "simplified29")
            .unwrap();
        assert_eq!(s29.chapters, 114);
        assert_eq!(s29.verses, 6234);
        assert_eq!(s29.words, 77401);
        assert_eq!(s29.letters, 325273);
        assert_eq!(s29.unique_letters, 29, "Simplified 29 is named for this");
    }

    #[test]
    fn al_fatiha_reproduces_the_published_counts() {
        let scope = Scope {
            chapter: Some(1),
            ..Scope::default()
        };
        let counts = count(Some(scope), None, None).unwrap();
        let s29 = counts
            .iter()
            .find(|c| c.provenance.text_mode == "simplified29")
            .unwrap();
        assert_eq!(s29.verses, 7);
        assert_eq!(s29.words, 29);
        assert_eq!(s29.letters, 139);
    }

    #[test]
    fn published_initial_counts_reproduce() {
        // ح + م across the seven HM suras
        let hm: usize = [40, 41, 42, 43, 44, 45, 46]
            .iter()
            .map(|c| ap1(*c, "\u{062D}\u{0645}"))
            .sum();
        assert_eq!(hm, 2147, "19 x 113");

        let sad: usize = [7, 19, 38].iter().map(|c| ap1(*c, "\u{0635}")).sum();
        assert_eq!(sad, 152, "19 x 8");

        let qaf: usize = [42, 50].iter().map(|c| ap1(*c, "\u{0642}")).sum();
        assert_eq!(qaf, 114, "19 x 6");

        assert_eq!(ap1(68, "\u{0646}"), 133, "19 x 7, initial spelled نون");
        assert_eq!(ap1(20, "\u{0637}"), 28);
        assert_eq!(ap1(27, "\u{0637}"), 27);
        assert_eq!(ap1(36, "\u{0633}"), 48);
        // ه + ة: teh marbuta folds into ha, which is what the published counts need
        assert_eq!(ap1(19, "\u{0647}"), 175);
        assert_eq!(ap1(20, "\u{0647}"), 251);
    }

    #[test]
    fn lam_and_mim_reproduce_across_the_alm_suras() {
        // Sura 30 uses 394 lams, not the 393 in the printed table: the source
        // documentation records one fewer alif and one more lam there, leaving
        // the 1,254 total intact.
        let published: [(u32, usize, usize); 6] = [
            (2, 3202, 2195),
            (3, 1892, 1249),
            (29, 554, 344),
            (30, 394, 317),
            (31, 297, 173),
            (32, 155, 158),
        ];
        let mut lam_total = 0;
        let mut mim_total = 0;
        for (chapter, lam, mim) in published {
            assert_eq!(ap1(chapter, "\u{0644}"), lam, "lam in sura {}", chapter);
            assert_eq!(ap1(chapter, "\u{0645}"), mim, "mim in sura {}", chapter);
            lam_total += lam;
            mim_total += mim;
        }
        assert_eq!(lam_total, 6494);
        assert_eq!(mim_total, 4436);
        // and the published alif total closes the grand total at 19 x 1046
        assert_eq!(8944 + lam_total + mim_total, 19874);
    }

    #[test]
    fn the_basmalah_is_nineteen_letters_in_both_countable_modes() {
        for mode in ["simplified29", "khalifa_appendix1"] {
            let scope = Scope {
                chapter: Some(2),
                verse: Some(0),
                include_basmalah: Some(true),
                ..Scope::default()
            };
            let m = cfg().mode(mode).unwrap();
            let words = scope.words();
            assert_eq!(words.len(), 4, "{}: the basmalah is four words", mode);
            let letters: usize = words
                .iter()
                .map(|w| fold_word(cfg(), w.uthmani, m, &defaults()).chars().count())
                .sum();
            assert_eq!(letters, 19, "{}: the basmalah is nineteen letters", mode);
        }
    }

    #[test]
    fn unnumbered_basmalahs_are_excluded_unless_asked_for() {
        let without = count(
            Some(Scope {
                chapter: Some(2),
                ..Scope::default()
            }),
            None,
            None,
        )
        .unwrap();
        let with = count(
            Some(Scope {
                chapter: Some(2),
                include_basmalah: Some(true),
                ..Scope::default()
            }),
            None,
            None,
        )
        .unwrap();
        let w0 = &without[0];
        let w1 = &with[0];
        assert_eq!(w1.words - w0.words, 4, "one basmalah, four words");
        assert_eq!(w1.letters - w0.letters, 19);
        assert_eq!(w0.verses, w1.verses, "the basmalah adds no numbered verse");
    }

    #[test]
    fn chapter_nine_stops_at_127_and_says_so() {
        assert_eq!(chapter_verse_count(9), Some(127));
        let err = get_verse(9, 128, None, None).unwrap_err();
        assert!(
            err.contains("127"),
            "the error should explain the numbering, got: {}",
            err
        );
        assert!(get_verse(9, 127, None, None).is_ok());
    }

    #[test]
    fn chapter_table_is_complete_and_sums_to_6234() {
        let all = chapters();
        assert_eq!(all.len(), 114);
        let sum: u32 = all.iter().map(|c| c.verses).sum();
        assert_eq!(sum, 6234);
    }

    #[test]
    fn toggles_change_the_count_and_are_carried_in_provenance() {
        let scope = Scope {
            chapter: Some(33),
            verse: Some(33),
            ..Scope::default()
        };
        let base = count(Some(scope), None, None).unwrap();
        let s29 = base
            .iter()
            .find(|c| c.provenance.text_mode == "simplified29")
            .unwrap();
        assert_eq!(s29.words, 25);
        assert_eq!(s29.letters, 122);
        assert!(s29.provenance.toggles.hamza_on_line);

        let no_hamza = count(
            Some(scope),
            Some(ToggleInput {
                hamza_on_line: Some(false),
                ..Default::default()
            }),
            None,
        )
        .unwrap();
        let s29b = no_hamza
            .iter()
            .find(|c| c.provenance.text_mode == "simplified29")
            .unwrap();
        assert_eq!(
            s29b.letters, 121,
            "33:33 carries exactly one hamza on the line"
        );
        assert!(!s29b.provenance.toggles.hamza_on_line);

        let sup = count(
            Some(scope),
            Some(ToggleInput {
                superscript_alef: Some(true),
                ..Default::default()
            }),
            None,
        )
        .unwrap();
        let s29c = sup
            .iter()
            .find(|c| c.provenance.text_mode == "simplified29")
            .unwrap();
        assert_eq!(s29c.letters, 126, "33:33 carries four superscript alefs");
    }

    #[test]
    fn abjad_values_and_their_digit_reductions() {
        let scope = Scope {
            chapter: Some(33),
            verse: Some(33),
            ..Scope::default()
        };
        let counts = count(Some(scope), None, Some("abjad_standard".into())).unwrap();
        let s29 = counts
            .iter()
            .find(|c| c.provenance.text_mode == "simplified29")
            .unwrap();
        assert_eq!(s29.value, Some(6795));
        assert_eq!(s29.digit_sum, Some(27));
        assert_eq!(s29.digital_root, Some(9));
        assert_eq!(
            s29.provenance.value_system.as_deref(),
            Some("abjad_standard")
        );
    }

    #[test]
    fn letter_frequency_carries_positions_and_distances() {
        let scope = Scope {
            chapter: Some(33),
            verse: Some(33),
            ..Scope::default()
        };
        let stats = letter_frequency(Some(scope), None, None).unwrap();
        assert_eq!(stats.len(), 22, "33:33 uses 22 of the 29 letters");
        let total: usize = stats.iter().map(|s| s.count).sum();
        assert_eq!(total, 122);
        let alef = stats.iter().find(|s| s.letter == "\u{0627}").unwrap();
        assert_eq!(alef.count, 17);
        assert_eq!(alef.sum_positions, 1087);
        assert_eq!(alef.sum_distances, 107);
        // a letter occurring once has no gap to any other occurrence
        assert!(stats
            .iter()
            .filter(|s| s.count == 1)
            .all(|s| s.sum_distances == 0));
    }

    #[test]
    fn known_gaps_travel_with_the_mode_that_has_them() {
        let counts = count(None, None, None).unwrap();
        let s29 = counts
            .iter()
            .find(|c| c.provenance.text_mode == "simplified29")
            .unwrap();
        let ap1 = counts
            .iter()
            .find(|c| c.provenance.text_mode == "khalifa_appendix1")
            .unwrap();
        assert!(
            s29.provenance.known_gaps.is_empty(),
            "Simplified 29 is verified end to end"
        );
        assert!(
            !ap1.provenance.known_gaps.is_empty(),
            "the published-figures mode still has the alif gap and must say so"
        );
    }

    #[test]
    fn get_verse_folds_every_word_and_keeps_them_in_order() {
        let v = get_verse(33, 33, None, None).unwrap();
        assert_eq!(v.words.len(), 25);
        assert!(v.words.windows(2).all(|w| w[0].position < w[1].position));
        assert_eq!(v.words.iter().map(|w| w.letters).sum::<usize>(), 122);
        assert!(!v.english.is_empty());
        assert_eq!(v.words[0].translit, "waqarna");
    }

    #[test]
    fn original_mode_is_declared_uncountable() {
        let m = cfg().mode("original").unwrap();
        assert!(!m.countable);
        let counted = count(None, None, None).unwrap();
        assert!(
            counted.iter().all(|c| c.provenance.text_mode != "original"),
            "an uncountable mode must not appear in a count"
        );
    }

    #[test]
    fn unknown_mode_and_system_are_refused_by_name() {
        assert!(get_verse(1, 1, Some("nonsense".into()), None)
            .unwrap_err()
            .contains("nonsense"));
        assert!(count(None, None, Some("nonsense".into()))
            .unwrap_err()
            .contains("nonsense"));
    }

    /* ── value engine ─────────────────────────────────────────────── */

    fn value_of(scope: Scope, mods: Modifiers) -> ValueResult {
        compute_value(Some(scope), None, None, "abjad_standard".into(), Some(mods)).unwrap()
    }

    #[test]
    fn a_bare_value_is_the_sum_of_the_letters() {
        // No modifiers, so this has to agree with what `qc_count` reports for
        // the same scope. If the two ever diverge, one of them is wrong.
        let scope = Scope {
            chapter: Some(33),
            verse: Some(33),
            ..Scope::default()
        };
        let v = value_of(scope, Modifiers::default());
        assert_eq!(v.value, 6795);
        assert_eq!(v.letters, 122);
        assert_eq!(v.digit_sum, 27);
        assert_eq!(v.digital_root, 9);

        let counted = count(Some(scope), None, Some("abjad_standard".into())).unwrap();
        let s29 = counted
            .iter()
            .find(|c| c.provenance.text_mode == "simplified29")
            .unwrap();
        assert_eq!(v.value, s29.value.unwrap(), "the two engines must agree");
    }

    #[test]
    fn the_basmalah_is_nineteen_letters_and_prime_free_arithmetic_holds() {
        let scope = Scope {
            chapter: Some(2),
            verse: Some(0),
            include_basmalah: Some(true),
            ..Scope::default()
        };
        let v = value_of(scope, Modifiers::default());
        assert_eq!(v.letters, 19);
        assert_eq!(v.digital_root, digital_root(v.value));
        assert!(v.divisors.iter().all(|d| v.value % d == 0));
    }

    #[test]
    fn each_modifier_adds_exactly_what_it_says() {
        let scope = Scope {
            chapter: Some(112),
            verse: Some(1),
            ..Scope::default()
        };
        let bare = value_of(scope, Modifiers::default());

        // letter_number_in_word adds 1+2+..+k for every word, so the delta is
        // the sum of each word's triangular number.
        let by_position = value_of(
            scope,
            Modifiers {
                letter_number_in_word: true,
                ..Modifiers::default()
            },
        );
        let verse = get_verse(112, 1, None, None).unwrap();
        let expected: i64 = verse
            .words
            .iter()
            .map(|w| {
                let k = w.letters as i64;
                k * (k + 1) / 2
            })
            .sum();
        assert_eq!(by_position.value - bare.value, expected);

        // chapter_number adds the chapter once per letter
        let by_chapter = value_of(
            scope,
            Modifiers {
                chapter_number: true,
                ..Modifiers::default()
            },
        );
        assert_eq!(by_chapter.value - bare.value, 112 * bare.letters as i64);

        // verse_number_in_chapter likewise
        let by_verse = value_of(
            scope,
            Modifiers {
                verse_number_in_chapter: true,
                ..Modifiers::default()
            },
        );
        assert_eq!(by_verse.value - bare.value, bare.letters as i64);
    }

    #[test]
    fn absolute_numbering_starts_at_one_and_is_paid_for_only_when_asked() {
        // 1:1 is the first verse, so its absolute letter numbers are 1..=19 and
        // the delta over the bare value is the sum of those.
        let scope = Scope {
            chapter: Some(1),
            verse: Some(1),
            ..Scope::default()
        };
        let bare = value_of(scope, Modifiers::default());
        let absolute = value_of(
            scope,
            Modifiers {
                letter_number: true,
                ..Modifiers::default()
            },
        );
        let letters = bare.letters as i64;
        assert_eq!(absolute.value - bare.value, letters * (letters + 1) / 2);
    }

    #[test]
    fn the_active_modifier_set_travels_with_the_result() {
        let scope = Scope {
            chapter: Some(1),
            verse: Some(1),
            ..Scope::default()
        };
        let v = value_of(
            scope,
            Modifiers {
                chapter_number: true,
                letter_number_in_word: true,
                ..Modifiers::default()
            },
        );
        assert_eq!(v.modifiers, vec!["letter_number_in_word", "chapter_number"]);
        assert_eq!(v.provenance.value_system.as_deref(), Some("abjad_standard"));
    }

    #[test]
    fn presets_are_offered_and_the_first_is_the_plain_sum() {
        let all = presets();
        assert_eq!(all.len(), 3);
        assert_eq!(all[0].id, "simple_value");
        assert!(!all[0].modifiers.any(), "the default preset adds nothing");
        assert!(all[2].modifiers.any());
    }

    #[test]
    fn the_breakdown_is_capped_rather_than_returning_the_corpus() {
        let v = compute_value(None, None, None, "abjad_standard".into(), None).unwrap();
        assert_eq!(v.letters, 325273);
        assert!(v.breakdown_truncated);
        assert_eq!(v.breakdown.len(), BREAKDOWN_CAP);
    }

    #[test]
    fn primality_and_divisors_are_reported_together() {
        assert!(is_prime(19));
        assert!(is_prime(2));
        assert!(!is_prime(1));
        assert!(!is_prime(0));
        assert!(!is_prime(-7));
        assert!(!is_prime(9899), "19 x 521");
        let scope = Scope {
            chapter: Some(33),
            verse: Some(33),
            ..Scope::default()
        };
        let v = value_of(scope, Modifiers::default());
        assert!(v.divisors.contains(&3), "6795 divides by 3");
        assert!(!v.divisors.contains(&19));
    }

    #[test]
    fn an_uncountable_mode_has_no_value() {
        let err = compute_value(
            None,
            Some("original".into()),
            None,
            "abjad_standard".into(),
            None,
        )
        .unwrap_err();
        assert!(err.contains("not a counting basis"), "got: {}", err);
    }

    /* ── search ───────────────────────────────────────────────────── */

    fn search(query: &str, opts: SearchOptions) -> SearchResult {
        find_text(query.to_string(), Some(opts)).unwrap()
    }

    #[test]
    fn an_exact_word_search_finds_its_verses_and_marks_the_words() {
        // أهل, "people of", as a whole word
        let r = search("\u{0623}\u{0647}\u{0644}", SearchOptions::default());
        assert!(r.total > 0, "أهل occurs in the corpus");
        let hit = &r.hits[0];
        assert!(
            !hit.matches.is_empty(),
            "the matching word positions come back"
        );
        assert!(!hit.english.is_empty());
    }

    #[test]
    fn the_query_is_folded_the_same_way_the_corpus_is() {
        /* Typed with a bare alef where the text has an alef wasla. Under
         * Simplified 29 both fold to alef, so the search still lands. This is
         * the property that makes searching agree with counting. */
        let r = search("\u{0627}\u{0644}\u{0644}\u{0647}", SearchOptions::default());
        assert!(
            r.total > 100,
            "the name of God occurs throughout, got {}",
            r.total
        );
    }

    #[test]
    fn location_and_wordness_narrow_a_search() {
        let anywhere = search(
            "\u{0644}\u{0647}",
            SearchOptions {
                wordness: Wordness::PartOfWord,
                ..Default::default()
            },
        );
        let at_start = search(
            "\u{0644}\u{0647}",
            SearchOptions {
                wordness: Wordness::PartOfWord,
                location: MatchLocation::AtStart,
                ..Default::default()
            },
        );
        assert!(
            anywhere.total > at_start.total,
            "a start anchor can only narrow"
        );
        assert!(at_start.total > 0);
    }

    #[test]
    fn a_minus_term_excludes_verses() {
        let scope = Scope {
            chapter: Some(1),
            ..Scope::default()
        };
        let all = search(
            "\u{0627}\u{0644}\u{0644}\u{0647}",
            SearchOptions {
                scope: Some(scope),
                ..Default::default()
            },
        );
        let without = search(
            "\u{0627}\u{0644}\u{0644}\u{0647} -\u{0627}\u{0644}\u{0631}\u{062D}\u{064A}\u{0645}",
            SearchOptions {
                scope: Some(scope),
                wordness: Wordness::PartOfWord,
                ..Default::default()
            },
        );
        assert!(
            without.total < all.total,
            "excluding a term cannot widen the result"
        );
    }

    #[test]
    fn a_root_search_returns_the_whole_family() {
        // ط ه ر, purity: 33:33 uses it twice
        let r = search(
            "\u{0637} \u{0647} \u{0631}",
            SearchOptions {
                kind: MatchKind::Root,
                ..Default::default()
            },
        );
        assert!(
            r.total > 10,
            "the root recurs across the corpus, got {}",
            r.total
        );
        assert!(
            r.hits.iter().any(|h| h.chapter == 33 && h.verse == 33),
            "33:33 carries two words from this root"
        );
    }

    #[test]
    fn an_empty_or_unfoldable_query_is_refused_by_name() {
        assert!(find_text("   ".into(), None)
            .unwrap_err()
            .contains("search for"));
        // a query of pure diacritics folds away to nothing
        assert!(find_text("\u{064E}\u{0652}".into(), None)
            .unwrap_err()
            .contains("folds to nothing"));
    }

    #[test]
    fn results_are_capped_and_say_so() {
        let r = search(
            "\u{0627}",
            SearchOptions {
                wordness: Wordness::PartOfWord,
                limit: Some(25),
                ..Default::default()
            },
        );
        assert_eq!(r.hits.len(), 25);
        assert!(r.truncated);
        assert!(r.total > 25);
    }

    /* ── similarity ───────────────────────────────────────────────── */

    #[test]
    fn levenshtein_behaves() {
        let a: Vec<char> = "kitten".chars().collect();
        let b: Vec<char> = "sitting".chars().collect();
        assert_eq!(levenshtein(&a, &b), 3);
        assert_eq!(levenshtein(&a, &a), 0);
        assert_eq!(ratio(&a, &a), 1.0);
    }

    #[test]
    fn similar_verses_come_back_ranked() {
        // 55:13 is repeated verbatim thirty times across Ar-Rahman, so an exact
        // twin has to score 1.0 and sort first.
        let r = find_similar(55, 13, None, Some(0.9), None, None, Some(10)).unwrap();
        assert!(
            r.total > 5,
            "Ar-Rahman repeats its refrain, got {}",
            r.total
        );
        assert!(
            (r.hits[0].score - 1.0).abs() < 1e-6,
            "an identical verse scores 1.0"
        );
        assert!(
            r.hits.windows(2).all(|w| w[0].score >= w[1].score),
            "hits must be ranked"
        );
        assert!(
            !r.hits.iter().any(|h| h.chapter == 55 && h.verse == 13),
            "the source is excluded"
        );
    }

    #[test]
    fn a_higher_threshold_returns_fewer_verses() {
        let loose = find_similar(55, 13, None, Some(0.5), None, None, Some(500)).unwrap();
        let tight = find_similar(55, 13, None, Some(0.95), None, None, Some(500)).unwrap();
        assert!(tight.total <= loose.total);
    }

    #[test]
    fn similarity_refuses_a_verse_that_does_not_exist() {
        assert!(find_similar(9, 128, None, None, None, None, None)
            .unwrap_err()
            .contains("9:128"));
    }

    /* ── find by number ───────────────────────────────────────────── */

    #[test]
    fn finding_by_letter_count_agrees_with_counting() {
        let r = find_by_number(
            122,
            Some(NumberTarget::Letters),
            None,
            None,
            None,
            None,
            Some(500),
        )
        .unwrap();
        assert!(
            r.hits.iter().any(|h| h.chapter == 33 && h.verse == 33),
            "33:33 has 122 letters, so it must be in the result"
        );
        assert!(r.hits.iter().all(|h| h.letters == 122));
    }

    #[test]
    fn finding_by_value_needs_a_value_system() {
        let err = find_by_number(
            6795,
            Some(NumberTarget::Value),
            None,
            None,
            None,
            None,
            None,
        )
        .unwrap_err();
        assert!(err.contains("value system"), "got: {}", err);

        let r = find_by_number(
            6795,
            Some(NumberTarget::Value),
            None,
            None,
            Some("abjad_standard".into()),
            None,
            Some(500),
        )
        .unwrap();
        assert!(r.hits.iter().any(|h| h.chapter == 33 && h.verse == 33));
    }

    /* ── one word ─────────────────────────────────────────────────── */

    #[test]
    fn word_info_carries_the_root_and_its_reach() {
        // 33:33:24, وَيُطَهِّرَكُمْ, from ط ه ر
        let w = word_info(33, 33, 24, None, None).unwrap();
        // t with dot below (U+1E6D), which is the transliteration the source uses
        assert_eq!(w.translit, "wayu\u{1E6D}ahhirakum");
        assert_eq!(w.roots.len(), 1);
        assert!(
            w.root_occurrences > 10,
            "the root recurs, got {}",
            w.root_occurrences
        );
        assert!(!w.folded.is_empty());
        assert!(word_info(33, 33, 99, None, None)
            .unwrap_err()
            .contains("33:33:99"));
    }

    #[test]
    fn the_root_list_is_complete_and_ranked() {
        let list = root_list();
        assert_eq!(list.len(), 1782, "every root in the corpus");
        assert!(
            list.windows(2)
                .all(|w| w[0].occurrences >= w[1].occurrences),
            "most frequent first"
        );
        let total: usize = list.iter().map(|r| r.occurrences).sum();
        assert!(
            total > 77_000,
            "nearly every word carries a root, got {}",
            total
        );
    }

    /* ── whole chapters and free selections ───────────────────────── */

    #[test]
    fn a_chapter_comes_back_whole_and_in_order() {
        let c = get_chapter(1, None, None).unwrap();
        assert_eq!(c.verses.len(), 7);
        assert_eq!(c.name_transliterated, "Al-F\u{e3}tehah");
        assert!(
            c.basmalah.is_none(),
            "chapter 1 carries the basmalah as verse 1"
        );
        assert!(c.verses.windows(2).all(|w| w[0].verse < w[1].verse));
        assert!(
            c.verses.iter().all(|v| !v.english.is_empty()),
            "every verse has its translation"
        );
        assert_eq!(c.verses.iter().map(|v| v.words.len()).sum::<usize>(), 29);
        assert_eq!(
            c.verses
                .iter()
                .flat_map(|v| &v.words)
                .map(|w| w.letters)
                .sum::<usize>(),
            139
        );
    }

    #[test]
    fn the_unnumbered_basmalah_is_carried_apart_from_the_verses() {
        let c = get_chapter(2, None, None).unwrap();
        assert_eq!(c.verses.len(), 286, "the basmalah is not one of them");
        let b = c.basmalah.expect("chapter 2 has an unnumbered basmalah");
        assert_eq!(b.verse, 0);
        assert_eq!(b.words.len(), 4);
        assert_eq!(b.words.iter().map(|w| w.letters).sum::<usize>(), 19);

        // chapter 9 has none at all
        assert!(get_chapter(9, None, None).unwrap().basmalah.is_none());
        assert_eq!(get_chapter(9, None, None).unwrap().verses.len(), 127);
    }

    #[test]
    fn every_chapter_loads_and_matches_the_table() {
        for meta in chapters() {
            let c = get_chapter(meta.number, None, None).unwrap();
            assert_eq!(
                c.verses.len() as u32,
                meta.verses,
                "chapter {} returned {} verses, table says {}",
                meta.number,
                c.verses.len(),
                meta.verses
            );
        }
        assert!(get_chapter(115, None, None).unwrap_err().contains("115"));
    }

    #[test]
    fn a_selection_is_folded_and_valued_like_the_corpus() {
        // the Basmalah, typed as a selection
        let text = "\u{628}\u{650}\u{633}\u{652}\u{645}\u{650} \u{671}\u{644}\u{644}\u{64e}\u{651}\u{647}\u{650} \
                    \u{671}\u{644}\u{631}\u{64e}\u{651}\u{62d}\u{652}\u{645}\u{64e}\u{670}\u{646}\u{650} \
                    \u{671}\u{644}\u{631}\u{64e}\u{651}\u{62d}\u{650}\u{64a}\u{645}\u{650}";
        let v = value_of_text(text.to_string(), None, None, Some("abjad_standard".into())).unwrap();
        assert_eq!(v.letters, 19, "the Basmalah is nineteen letters");
        assert_eq!(v.words, 4);
        assert_eq!(v.provenance.scope, "selection");

        // and it must agree with the same letters counted in place
        let scope = Scope {
            chapter: Some(2),
            verse: Some(0),
            include_basmalah: Some(true),
            ..Scope::default()
        };
        let in_place = count(Some(scope), None, Some("abjad_standard".into())).unwrap();
        let s29 = in_place
            .iter()
            .find(|c| c.provenance.text_mode == "simplified29")
            .unwrap();
        assert_eq!(
            v.value,
            s29.value.unwrap(),
            "a selection cannot disagree with the corpus"
        );
        assert_eq!(v.letters, s29.letters);
    }

    #[test]
    fn a_selection_obeys_the_active_toggles() {
        let with_hamza = "\u{621}\u{627}";
        let on = value_of_text(with_hamza.into(), None, None, None).unwrap();
        let off = value_of_text(
            with_hamza.into(),
            None,
            Some(ToggleInput {
                hamza_on_line: Some(false),
                ..Default::default()
            }),
            None,
        )
        .unwrap();
        assert_eq!(on.letters, 2);
        assert_eq!(
            off.letters, 1,
            "the hamza stops counting when its toggle is off"
        );
    }

    #[test]
    fn a_selection_with_no_letters_is_refused_by_name() {
        for input in ["", "   ", "\u{64e}\u{652}", "hello"] {
            let err = value_of_text(input.into(), None, None, None).unwrap_err();
            assert!(err.contains("counts as a letter"), "got: {}", err);
        }
    }

    #[test]
    fn a_selection_has_no_value_in_a_reading_mode() {
        let err = value_of_text("\u{627}".into(), Some("original".into()), None, None).unwrap_err();
        assert!(err.contains("not a counting basis"), "got: {}", err);
    }

    /// Sweeps every scope level across the awkward chapters, because the UI can
    /// reach all of them and a single unhandled Err blanks the whole pane.
    #[test]
    fn every_scope_level_answers_for_every_command() {
        let interesting = [1u32, 2, 9, 33, 108, 112, 114];
        for chapter in interesting {
            let total = chapter_verse_count(chapter).unwrap();
            for verse in [1, total] {
                for scope in [
                    Scope::default(),
                    Scope {
                        chapter: Some(chapter),
                        ..Scope::default()
                    },
                    Scope {
                        chapter: Some(chapter),
                        verse: Some(verse),
                        ..Scope::default()
                    },
                    Scope {
                        chapter: Some(chapter),
                        verse: Some(verse),
                        word: Some(1),
                        ..Scope::default()
                    },
                    Scope {
                        chapter: Some(chapter),
                        include_basmalah: Some(true),
                        ..Scope::default()
                    },
                ] {
                    count(Some(scope), None, Some("abjad_standard".into()))
                        .unwrap_or_else(|e| panic!("count failed for {:?}: {}", scope.label(), e));
                    letter_frequency(Some(scope), None, None).unwrap_or_else(|e| {
                        panic!("frequency failed for {:?}: {}", scope.label(), e)
                    });
                    compute_value(Some(scope), None, None, "abjad_standard".into(), None)
                        .unwrap_or_else(|e| panic!("value failed for {:?}: {}", scope.label(), e));
                    compute_value(
                        Some(scope),
                        None,
                        None,
                        "abjad_standard".into(),
                        Some(Modifiers {
                            letter_number: true,
                            word_number: true,
                            verse_number: true,
                            chapter_number: true,
                            ..Modifiers::default()
                        }),
                    )
                    .unwrap_or_else(|e| {
                        panic!("value+absolute failed for {:?}: {}", scope.label(), e)
                    });
                }
                get_verse(chapter, verse, None, None).unwrap_or_else(|e| {
                    panic!("get_verse failed for {}:{}: {}", chapter, verse, e)
                });
            }
        }
    }

    /// Folding on demand instead of keeping a prebuilt index is only defensible
    /// if a whole-corpus count is fast enough to drive a live readout, so this
    /// measures the shipped path and prints what it got.
    ///
    /// **The assertion is a catastrophe guard, not a benchmark.** A tight
    /// wall-clock bound in a unit test flakes as soon as the suite shares a
    /// machine with a frontend build or a CI runner, and no amount of sampling
    /// fixes that: the whole measurement is slower under load, best case
    /// included. So the budget is set an order of magnitude above the real
    /// figure, where it still catches the class of regression that matters (the
    /// naive fold ran at 1.7 s in debug) without failing on a busy machine.
    ///
    /// The number to actually look at is the one this prints. On an idle
    /// machine it is ~13 ms release, ~275 ms debug; the pre-optimisation fold
    /// was 42 ms and 1.06 s. If those printed figures drift upward, that is
    /// worth investigating even while the assertion still passes.
    #[test]
    fn corpus_count_is_fast_enough_for_a_live_readout() {
        let _ = count(None, None, None).unwrap(); // warm the OnceLocks

        // Best of five, so the printed figure is the machine's real capability
        // rather than whichever sample caught a scheduler hiccup.

        let mut elapsed = std::time::Duration::MAX;
        let mut counts = Vec::new();
        for _ in 0..5 {
            let start = std::time::Instant::now();
            counts = count(None, None, Some("abjad_standard".into())).unwrap();
            elapsed = elapsed.min(start.elapsed());
        }
        assert_eq!(counts.len(), 2, "both countable modes in one call");

        let budget = if cfg!(debug_assertions) { 4_000 } else { 250 };
        println!(
            "whole-corpus count over both modes: {:?} best of 5 (budget {} ms, {} build)",
            elapsed,
            budget,
            if cfg!(debug_assertions) {
                "debug"
            } else {
                "release"
            }
        );
        assert!(
            elapsed.as_millis() < budget,
            "whole-corpus count took {:?}, over the {} ms budget",
            elapsed,
            budget
        );
    }

    /* ── aggregation ───────────────────────────────────────────────────── */

    /// The divine name, as Appendix 1 counts it: root 56 intersected with the
    /// definite form. Neither filter alone gives the published figure. The root
    /// alone also catches إله and آلهة, the generic noun, at 2,844. The string
    /// alone also catches ٱللَّهُمَّ (a different root) and ضَلَـٰلَة and كَلَـٰلَة,
    /// at 2,726. Together they are 2,698.
    fn divine_name() -> AggregateQuery {
        AggregateQuery {
            text: Some("لله".to_string()),
            root_id: Some(56),
            ..Default::default()
        }
    }

    fn agg(q: AggregateQuery) -> Aggregate {
        aggregate(Some(q), None, None, None, None).expect("aggregate must run")
    }

    fn total(a: &Aggregate, id: &str) -> i64 {
        a.figures
            .iter()
            .find(|f| f.id == id)
            .unwrap_or_else(|| panic!("no figure '{}'", id))
            .total
    }

    #[test]
    fn the_divine_name_occurs_2698_times() {
        let a = agg(divine_name());
        assert_eq!(a.occurrences, 2698, "Appendix 1: 19 x 142");
        let f = a.figures.iter().find(|f| f.id == "occurrences").unwrap();
        assert!(f.exact, "2698 is a multiple of 19");
        assert_eq!(f.quotient, 142);
        assert_eq!(f.remainder, 0);
    }

    /// Either filter on its own overcounts, which is the whole reason the query
    /// intersects them. If this test ever passes with one of them removed, the
    /// root data or the fold has changed underneath us.
    #[test]
    fn neither_filter_alone_reaches_the_published_figure() {
        let root_only = agg(AggregateQuery {
            root_id: Some(56),
            ..Default::default()
        });
        let text_only = agg(AggregateQuery {
            text: Some("لله".to_string()),
            ..Default::default()
        });
        assert_eq!(root_only.occurrences, 2844, "root 56 also catches إله");
        assert_eq!(text_only.occurrences, 2726, "the string also catches ضلالة");
    }

    /// The second Appendix 1 figure, and the reason two verse-number sums are
    /// reported rather than one: the per-verse sum is the published 118,123 and
    /// the per-occurrence sum is 182,034, which is not a multiple of 19.
    #[test]
    fn the_verse_numbers_of_the_divine_name_sum_to_118123() {
        let a = agg(divine_name());
        assert_eq!(total(&a, "sum_verse_numbers"), 118_123, "19 x 6217");
        assert_eq!(118_123 % 19, 0);
        assert_eq!(total(&a, "sum_verse_numbers_per_occurrence"), 182_034);
        assert_ne!(182_034 % 19, 0, "the ambiguity is not harmless");
        assert_eq!(a.verses, 1820);
    }

    /// From the first Quranic Initial to the last, and the complement. Both are
    /// multiples of 19 and they add back to the whole, which is what makes the
    /// address bounds worth having as a first-class filter.
    #[test]
    fn the_span_between_the_first_and_last_initial_splits_2698_into_multiples() {
        let inside = agg(AggregateQuery {
            from: Some((2, 1)),
            to: Some((68, 1)),
            ..divine_name()
        });
        assert_eq!(inside.occurrences, 2641, "Appendix 1: 19 x 139");
        assert_eq!(2641 % 19, 0);

        let before = agg(AggregateQuery {
            to: Some((1, 999)),
            ..divine_name()
        });
        let after = agg(AggregateQuery {
            from: Some((68, 2)),
            ..divine_name()
        });
        assert_eq!(before.occurrences + after.occurrences, 57, "19 x 3");
        assert_eq!(inside.occurrences + before.occurrences + after.occurrences, 2698);
    }

    /// A cross-cutting selection: every verse carrying one number, in every
    /// chapter at once. No scope can express this, which is why the predicate
    /// lives on the query rather than on `Scope`.
    #[test]
    fn qaf_in_every_verse_numbered_19_totals_76() {
        let a = agg(AggregateQuery {
            verse_number: Some(19),
            letters: Some("ق".to_string()),
            ..Default::default()
        });
        assert_eq!(total(&a, "letters"), 76, "Appendix 1: 19 x 4");
        assert_eq!(76 % 19, 0);
        assert!(a.verses > 0 && a.verses <= 114);
    }

    /// The multi-letter initial groups. Every letter but alif reproduced to the
    /// unit even while alif was short by 1,129 across the six الم suras, and
    /// that is what localised the gap to one letter class: 877 for lam + mim +
    /// ra in sura 13, 2,791 for lam + mim + sad in sura 7.
    ///
    /// Alif now folds every written form of alef, hamza included, and no longer
    /// counts the superscript alef. The four-letter totals land within single
    /// digits of the published figures, with signs going both ways, which is
    /// what an orthographic difference between two source texts looks like
    /// rather than a rule still missing. Asserted as a bound rather than as
    /// equality: pinning -5 and +8 exactly would make an improvement in the
    /// source data fail the suite.
    #[test]
    fn every_initial_letter_but_alif_reproduces_exactly() {
        let published = |q: AggregateQuery| {
            aggregate(
                Some(q),
                Some("khalifa_appendix1".to_string()),
                None,
                None,
                None,
            )
            .unwrap()
        };
        let with_basmalah = Scope {
            include_basmalah: Some(true),
            ..Scope::default()
        };
        let letters_in = |chapter: u32, letters: &str| {
            total(
                &published(AggregateQuery {
                    chapters: Some(vec![chapter]),
                    letters: Some(letters.to_string()),
                    scope: Some(with_basmalah),
                    ..Default::default()
                }),
                "letters",
            )
        };

        assert_eq!(letters_in(13, "لمر"), 877, "sura 13 without alif");
        assert_eq!(letters_in(7, "لمص"), 2791, "sura 7 without alif");

        for (chapter, letters, published_total) in
            [(13u32, "المر", 1482i64), (7, "المص", 5320), (15, "الر", 912)]
        {
            let got = letters_in(chapter, letters);
            assert!(
                (got - published_total).abs() <= 10,
                "sura {} {}: computed {}, published {}, off by {}",
                chapter,
                letters,
                got,
                published_total,
                got - published_total
            );
        }
        assert_eq!(letters_in(15, "الر"), 912, "sura 15 lands exactly");
    }

    /// The whole point of the alif fold: the الم grand total. It used to be
    /// short by 1,129 and is now over by one.
    #[test]
    fn the_alm_grand_total_is_within_one_of_19874() {
        let a = aggregate(
            Some(AggregateQuery {
                chapters: Some(vec![2, 3, 29, 30, 31, 32]),
                letters: Some("الم".to_string()),
                scope: Some(Scope {
                    include_basmalah: Some(true),
                    ..Scope::default()
                }),
                ..Default::default()
            }),
            Some("khalifa_appendix1".to_string()),
            None,
            None,
            None,
        )
        .unwrap();
        let got = total(&a, "letters");
        assert!(
            (got - 19_874).abs() <= 5,
            "الم total computed {}, published 19,874",
            got
        );
    }

    /// The alif fold must not touch any letter class that already reproduced.
    /// Folding the hamza-carrying alifs to alef is safe precisely because none
    /// of the published initial counts involve them; a test says so rather than
    /// leaving it to be rediscovered.
    #[test]
    fn the_alif_fold_leaves_every_other_published_count_alone() {
        let mode = Some("khalifa_appendix1".to_string());
        let letters_in = |chapters: Vec<u32>, letters: &str| {
            total(
                &aggregate(
                    Some(AggregateQuery {
                        chapters: Some(chapters),
                        letters: Some(letters.to_string()),
                        scope: Some(Scope {
                            include_basmalah: Some(true),
                            ..Scope::default()
                        }),
                        ..Default::default()
                    }),
                    mode.clone(),
                    None,
                    None,
                    None,
                )
                .unwrap(),
                "letters",
            )
        };
        assert_eq!(letters_in(vec![40, 41, 42, 43, 44, 45, 46], "حم"), 2147);
        assert_eq!(letters_in(vec![7, 19, 38], "ص"), 152);
        assert_eq!(letters_in(vec![42, 50], "ق"), 114);
        assert_eq!(letters_in(vec![68], "ن"), 133);
        assert_eq!(letters_in(vec![19], "ه"), 175);
        assert_eq!(letters_in(vec![20], "ه"), 251);
        assert_eq!(letters_in(vec![2], "ل"), 3202);
        assert_eq!(letters_in(vec![2], "م"), 2195);
    }

    /// An empty query is the whole corpus, and it has to agree with `qc_count`
    /// for the same scope. Two engines that disagree on the same question are
    /// worse than one engine, so this is the property that keeps them honest.
    #[test]
    fn an_empty_aggregate_agrees_with_the_counter() {
        let a = agg(AggregateQuery::default());
        let counts = count(None, None, None).unwrap();
        let s29 = counts
            .iter()
            .find(|c| c.provenance.text_mode == "simplified29")
            .unwrap();
        assert_eq!(a.occurrences, s29.words);
        assert_eq!(a.letters, s29.letters as i64);
        assert_eq!(a.verses, s29.verses);
        assert_eq!(a.chapters, s29.chapters);
    }

    /// The selector travels with the figure. Provenance says how it was
    /// counted; this says what was counted, and a number needs both before it
    /// can be checked by anyone else.
    #[test]
    fn the_aggregate_states_what_it_selected() {
        let a = agg(AggregateQuery {
            from: Some((2, 1)),
            to: Some((68, 1)),
            ..divine_name()
        });
        assert!(a.selector.contains("root #56"), "{}", a.selector);
        assert!(a.selector.contains("2:1 to 68:1"), "{}", a.selector);
        assert_eq!(
            a.first.as_deref(),
            Some("2:7:2"),
            "khatama ALLAHu, the second word of 2:7"
        );
        assert!(!a.examples.is_empty() && a.examples.len() <= 24);
        assert_eq!(agg(AggregateQuery::default()).selector, "every word in scope");
    }

    /// The divisor is a parameter, not a constant. 19 is the default because it
    /// is what the literature is about, but a figure that is only ever tested
    /// against one number cannot be falsified against another.
    #[test]
    fn the_divisor_is_a_parameter() {
        let a = aggregate(Some(divine_name()), None, None, None, Some(7)).unwrap();
        let f = a.figures.iter().find(|f| f.id == "occurrences").unwrap();
        assert_eq!(a.divisor, 7);
        assert_eq!((f.total, f.exact, f.remainder), (2698, false, 2698 % 7));
    }

    #[test]
    fn an_uncountable_mode_is_refused_rather_than_answered() {
        let err = aggregate(None, Some("original".to_string()), None, None, None)
            .expect_err("Original mode declares itself uncountable");
        assert!(err.contains("not a countable"), "{}", err);
    }


    /* ── selection by predicate ────────────────────────────────────────── */

    /// Arithmetic over sura numbers themselves, which is a different question
    /// from arithmetic over the verses inside them. Appendix 1 counts the suras
    /// from the missing Basmalah of sura 9 to the extra one of sura 27 and sums
    /// their numbers to 342. Summing once per verse instead gives 47,973, so the
    /// two figures are reported separately rather than one standing for both.
    #[test]
    fn the_sura_numbers_from_9_to_27_sum_to_342() {
        let a = agg(AggregateQuery {
            from: Some((9, 1)),
            to: Some((27, 93)),
            ..Default::default()
        });
        assert_eq!(a.chapters, 19, "nineteen suras, 9 through 27");
        assert_eq!(total(&a, "sum_chapter_numbers_once"), 342, "19 x 18");
        assert_ne!(
            total(&a, "sum_chapter_numbers"),
            342,
            "the per-verse sum is a different figure and must not be confused for it"
        );
    }

    /// A span with word precision at both ends. The two Basmalahs of sura 27
    /// are the numbered one at 1:1 and the one inside 27:30, and Appendix 1
    /// counts 342 words between them. Our tokenization gives a different figure,
    /// which is recorded here rather than asserted away: the point of the test
    /// is that the bound is word-precise and the span is well defined, not that
    /// the published number falls out of a word table it was not built from.
    #[test]
    fn a_span_can_begin_and_end_part_way_through_a_verse() {
        let whole_verse = agg(AggregateQuery {
            from: Some((27, 30)),
            to: Some((27, 30)),
            ..Default::default()
        });
        let trimmed = agg(AggregateQuery {
            from: Some((27, 30)),
            to: Some((27, 30)),
            from_word: Some(3),
            ..Default::default()
        });
        assert!(
            trimmed.occurrences < whole_verse.occurrences,
            "dropping the first two words has to shrink the span"
        );
        assert_eq!(
            whole_verse.occurrences - trimmed.occurrences,
            2,
            "by exactly two words"
        );
        assert_eq!(trimmed.first.as_deref(), Some("27:30:3"));
        assert!(
            trimmed.selector.contains("27:30:3"),
            "the word component belongs in the selector: {}",
            trimmed.selector
        );
    }

    /// The initials are a property of the sura, so they cannot be expressed as a
    /// text filter on a word. Appendix 1 counts 38 un-initialed suras strictly
    /// between the first initialed sura and the last, which is 19 x 2.
    #[test]
    fn the_initialed_and_uninitialed_suras_partition_the_book() {
        let initialed = agg(AggregateQuery {
            initialed: Some(true),
            ..Default::default()
        });
        let plain = agg(AggregateQuery {
            initialed: Some(false),
            ..Default::default()
        });
        assert_eq!(initialed.chapters, 29, "Appendix 1 Table 1");
        assert_eq!(plain.chapters, 85);
        assert_eq!(initialed.chapters + plain.chapters, 114);
        assert_eq!(
            total(&initialed, "sum_chapter_numbers_once"),
            822,
            "the 29 sura numbers"
        );
        assert_eq!(822 + 14, 836, "plus the 14 sets is 19 x 44");

        let between = agg(AggregateQuery {
            initialed: Some(false),
            from: Some((3, 1)),
            to: Some((67, 30)),
            ..Default::default()
        });
        assert_eq!(between.chapters, 38, "19 x 2");
    }

    /// The initials table is data with invariants, not an inference. Sura 42
    /// carries its initials across two verses and sura 68 spells its single
    /// letter out, so a reader that tried to derive the set from the text would
    /// need both exceptions hardcoded anyway.
    #[test]
    fn the_initials_table_has_the_shape_appendix_1_describes() {
        let all: Vec<&str> = chapters()
            .iter()
            .map(|c| c.initials)
            .filter(|i| !i.is_empty())
            .collect();
        assert_eq!(all.len(), 29);
        assert_eq!(all.iter().collect::<HashSet<_>>().len(), 14, "distinct sets");
        assert_eq!(
            all.concat().chars().collect::<HashSet<_>>().len(),
            14,
            "distinct letters"
        );
        assert_eq!(chapter_initials(2), Some("الم"));
        assert_eq!(chapter_initials(42), Some("حمعسق"), "two verses, one set");
        assert_eq!(chapter_initials(68), Some("ن"), "written نون, counted as ن");
        assert_eq!(chapter_initials(1), Some(""), "no initials is a real answer");
        assert_eq!(chapter_initials(115), None, "not a sura");
    }

    /// The first and last revelations, by verse range rather than by whole sura.
    #[test]
    fn the_first_and_last_revelations_are_19_shaped() {
        let first = agg(AggregateQuery {
            from: Some((96, 1)),
            to: Some((96, 5)),
            ..Default::default()
        });
        assert_eq!(total(&first, "letters"), 76, "19 x 4");

        let last = agg(AggregateQuery {
            chapters: Some(vec![110]),
            ..Default::default()
        });
        assert_eq!(last.occurrences, 19, "sura 110 is 19 words");

        let opener = agg(AggregateQuery {
            from: Some((110, 1)),
            to: Some((110, 1)),
            ..Default::default()
        });
        assert_eq!(total(&opener, "letters"), 19);
    }

    /// The corpus total Appendix 1 quotes is the one that includes the
    /// unnumbered Basmalahs, which is not the 6,234 every other figure here
    /// uses. Both are reachable, and which one is in play is visible in
    /// provenance rather than implied.
    #[test]
    fn the_basmalahs_turn_6234_into_6346() {
        let numbered = agg(AggregateQuery::default());
        assert_eq!(numbered.verses, 6234);

        let with_basmalahs = agg(AggregateQuery {
            scope: Some(Scope {
                include_basmalah: Some(true),
                ..Scope::default()
            }),
            ..Default::default()
        });
        /* The unnumbered groups deliberately do not enter the verse count: an
           unnumbered verse has no number, and letting it inflate a figure that
           the rest of the module reports as 6,234 would be the exact kind of
           silent convention change §0.3 exists to prevent. The 112 are counted
           from the suras that carry them. */
        assert_eq!(with_basmalahs.verses, 6234, "still the numbered verses");
        assert!(
            with_basmalahs.occurrences > numbered.occurrences,
            "but the words are there"
        );
        assert_eq!(
            with_basmalahs.occurrences - numbered.occurrences,
            448,
            "112 Basmalahs of four words each"
        );
        assert_eq!(6234 + 112, 6346, "19 x 334");
        assert!(with_basmalahs.provenance.include_basmalah);
    }


    /* ── the traditional divisions ─────────────────────────────────────── */

    /// Each kind has to tile the corpus: every verse in exactly one division,
    /// no gaps and no overlaps. A gap would silently drop verses from a scoped
    /// count and an overlap would double them, and neither shows up as a
    /// wrong-looking number on screen.
    #[test]
    fn every_division_kind_tiles_the_corpus() {
        let per_verse = verse_divisions();
        assert_eq!(per_verse.len(), 6234, "one entry per numbered verse");

        for kind in DivisionKind::ALL {
            let ranges: Vec<&Division> = divisions().iter().filter(|d| d.kind == kind).collect();
            assert!(!ranges.is_empty(), "{} has no ranges", kind.id());

            let declared: u32 = ranges.iter().map(|d| d.verses).sum();
            assert_eq!(
                declared, 6234,
                "{} ranges declare {} verses",
                kind.id(),
                declared
            );

            /* Numbered 1..n with no repeats, because the UI offers the number
               as a stepper and a hole in the sequence would be a dead step. */
            let mut numbers: Vec<u32> = ranges.iter().map(|d| d.number).collect();
            numbers.sort_unstable();
            assert_eq!(
                numbers,
                (1..=ranges.len() as u32).collect::<Vec<_>>(),
                "{} numbering",
                kind.id()
            );

            /* And every verse actually resolves to one of them. */
            let slot = kind.slot();
            let assigned = per_verse.values().filter(|v| v.at(slot) > 0).count();
            assert_eq!(
                assigned,
                6234,
                "{} leaves {} verses unassigned",
                kind.id(),
                6234 - assigned
            );
        }
    }

    #[test]
    fn the_divisions_are_the_counts_a_mushaf_has() {
        let n = |k: DivisionKind| divisions().iter().filter(|d| d.kind == k).count();
        assert_eq!(n(DivisionKind::Part), 30, "juz'");
        assert_eq!(n(DivisionKind::Group), 60, "hizb");
        assert_eq!(n(DivisionKind::Quarter), 240);
        assert_eq!(n(DivisionKind::Station), 7, "manzil");
        assert_eq!(n(DivisionKind::Bowing), 556, "ruku'");
        assert_eq!(n(DivisionKind::Page), 604);
        assert_eq!(prostrations().len(), 15);
    }

    /// The first part opens the book and the last closes it, which is the cheap
    /// check that the ranges were built in reading order rather than sorted by
    /// address.
    #[test]
    fn the_first_and_last_division_bracket_the_corpus() {
        let part = |n: u32| {
            divisions()
                .iter()
                .find(|d| d.kind == DivisionKind::Part && d.number == n)
                .unwrap()
        };
        assert_eq!(part(1).start, (1, 1));
        assert_eq!(part(30).end, (114, 6));
        assert_eq!(divisions_of(1, 1).unwrap().part, 1);
        assert_eq!(divisions_of(1, 1).unwrap().page, 1);
        assert_eq!(divisions_of(114, 6).unwrap().part, 30);
    }

    /// A scoped count over a division has to agree with the same count taken
    /// over the division's address range by hand. This is the property that
    /// makes `Scope::division` trustworthy, because the two paths share no code.
    #[test]
    fn counting_a_division_agrees_with_counting_its_range() {
        let page = divisions()
            .iter()
            .find(|d| d.kind == DivisionKind::Page && d.number == 2)
            .unwrap();

        let by_division = count(
            Some(Scope {
                division: Some(DivisionRef {
                    kind: DivisionKind::Page,
                    number: 2,
                }),
                ..Scope::default()
            }),
            None,
            None,
        )
        .unwrap();
        let by_range = aggregate(
            Some(AggregateQuery {
                from: Some(page.start),
                to: Some(page.end),
                ..Default::default()
            }),
            None,
            None,
            None,
            None,
        )
        .unwrap();

        let s29 = by_division
            .iter()
            .find(|c| c.provenance.text_mode == "simplified29")
            .unwrap();
        assert_eq!(s29.words, by_range.occurrences, "words on page 2");
        assert_eq!(s29.letters as i64, by_range.letters, "letters on page 2");
        assert_eq!(s29.verses, by_range.verses, "verses on page 2");
        assert!(
            s29.provenance.scope.contains("page 2"),
            "the division belongs in the scope label: {}",
            s29.provenance.scope
        );
    }

    /// An unnumbered Basmalah has no address, so it belongs to no division.
    /// Letting it into a page count would put four words on a page the mushaf
    /// does not print them on, and would also make the Basmalah at 1:1 count
    /// twice on page 1.
    #[test]
    fn an_unnumbered_basmalah_belongs_to_no_division() {
        assert!(divisions_of(2, 0).is_none(), "sura 2's Basmalah has no verse number");
        let scope = Scope {
            division: Some(DivisionRef {
                kind: DivisionKind::Page,
                number: 2,
            }),
            include_basmalah: Some(true),
            ..Scope::default()
        };
        let without = Scope {
            include_basmalah: None,
            ..scope
        };
        let a = count(Some(scope), None, None).unwrap();
        let b = count(Some(without), None, None).unwrap();
        assert_eq!(
            a[0].words, b[0].words,
            "asking for Basmalahs cannot add words to a page"
        );
    }

    /// Makkan against Medinan, the partition the chapter table could not express
    /// before this import.
    #[test]
    fn revelation_place_partitions_the_suras() {
        let makkah = agg(AggregateQuery {
            revelation_place: Some("Makkah".to_string()),
            ..Default::default()
        });
        let medina = agg(AggregateQuery {
            revelation_place: Some("medina".to_string()),
            ..Default::default()
        });
        assert_eq!(makkah.chapters + medina.chapters, 114);
        assert_eq!(
            makkah.occurrences + medina.occurrences,
            77_401,
            "and between them every word"
        );
        assert!(makkah.selector.contains("Makkah"), "{}", makkah.selector);
        assert!(
            chapters().iter().all(|c| c.revelation_place == "Makkah"
                || c.revelation_place == "Medina"),
            "never blank"
        );
    }

    #[test]
    fn the_fifteen_verses_of_prostration_are_selectable() {
        let a = agg(AggregateQuery {
            prostration: Some(true),
            ..Default::default()
        });
        assert_eq!(a.verses, 15);
        let rest = agg(AggregateQuery {
            prostration: Some(false),
            ..Default::default()
        });
        assert_eq!(a.verses + rest.verses, 6234);
        assert!(prostrations()
            .iter()
            .all(|p| p.kind == "Recommended" || p.kind == "Obligatory"));
    }

    /// The metadata carries the division counts so the UI never hardcodes that
    /// a mushaf has 604 pages, the same rule §9c set for the corpus totals.
    #[test]
    fn the_metadata_declares_the_divisions() {
        let m = metadata().unwrap();
        assert_eq!(m.divisions.len(), 6);
        let page = m.divisions.iter().find(|d| d.id == "page").unwrap();
        assert_eq!(page.count, 604);
        assert!(page.label.contains("Page"));
        assert_eq!(m.prostrations, 15);
        assert!(m.chapters.iter().all(|c| !c.revelation_place.is_empty()));
    }

    /// A verse carries its own divisions, so a reader looking at 2:255 can see
    /// which part and page it sits on without a second query.
    #[test]
    fn a_verse_carries_the_divisions_it_sits_in() {
        let v = get_verse(2, 255, None, None).unwrap();
        let d = v.divisions.expect("a numbered verse has divisions");
        assert!(d.part >= 1 && d.part <= 30);
        assert!(d.page >= 1 && d.page <= 604);
        assert!(d.bowing >= 1 && d.bowing <= 556);
        assert_eq!(
            d.part,
            divisions_of(2, 255).unwrap().part,
            "the same answer either way"
        );
    }


    /* ── the fixture ledger ────────────────────────────────────────────── */

    /// The ledger has to agree with the dataset it was generated from, and the
    /// generator refuses to write when a `verified` fixture drifts. This is the
    /// other half of that guarantee: every entry marked verified must actually
    /// have matched, so a hand-edited fixtures.json cannot claim a figure the
    /// build never checked.
    #[test]
    fn every_verified_fixture_actually_matched() {
        let l = ledger().unwrap();
        assert!(l.verified > 0);
        for f in &l.fixtures {
            if f.status == "verified" {
                assert_eq!(
                    f.expected, f.actual,
                    "{} is marked verified but computed {} against {}",
                    f.id, f.actual, f.expected
                );
                assert!(f.pass, "{} is marked verified but pass is false", f.id);
            } else {
                assert_ne!(
                    f.expected, f.actual,
                    "{} is a known gap but the two figures agree",
                    f.id
                );
            }
        }
    }

    /// Simplified 29 carries no gaps, which is why it is the default mode. The
    /// generator asserts it too; asserted here as well because the ledger is
    /// what the UI reads, and a mode the UI presents as authoritative has to be.
    #[test]
    fn the_default_mode_carries_no_gaps_in_the_ledger() {
        let l = ledger().unwrap();
        let gaps: Vec<&str> = l
            .fixtures
            .iter()
            .filter(|f| f.mode == DEFAULT_MODE && f.status != "verified")
            .map(|f| f.id.as_str())
            .collect();
        assert!(gaps.is_empty(), "{} has gaps: {:?}", DEFAULT_MODE, gaps);
    }

    /// The distance is the metric that matters, and it is a lot smaller than it
    /// was. Bounded rather than pinned so that better source data improves the
    /// suite instead of breaking it.
    #[test]
    fn the_distance_to_the_published_figures_is_small() {
        let l = ledger().unwrap();
        assert!(
            l.distance <= 120,
            "distance to published figures is {}, was 2,123 before the alif fold",
            l.distance
        );
        assert!(l.known_gaps > 0, "hiding a gap is worse than having one");
    }

}
