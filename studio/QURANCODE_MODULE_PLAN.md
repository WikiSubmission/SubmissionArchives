# QuranCode Research Module: Deep-Dive Plan

**Status:** 9a through 9f shipped. 9g is data-gated and outstanding.
**Supersedes:** `QuranCode_Module_Plan.md` (the standalone-app plan, then its fold-into-Studio revision).
**Slots into:** CONTEXT.md's phase roadmap as **Phase 9**. Note the collision: `studio_improvement_plan.md` numbers its own phases independently and already uses "Phase 9" for Scholarly Writing Tools. This document uses CONTEXT.md numbering.

---

## 0. What changed after reading the code and the data

The earlier plan was written from the shape of the codebase. This one is written from the codebase **and** from measurements of the actual Quran text in the repo, plus the real QuranCode source at `islamisoftware/QuranCode`. Five findings move the plan materially.

### 0.1 Studio's bundled Quran text cannot support this module at all

`studio/src-tauri/assets/quran.csv` (1.6 MB, 6,346 rows) is the `arabic_clean` column of the upstream source: **undiacriticized, simplified orthography**. Codepoint census of its Arabic column shows base letters, spaces, and nine waqf marks: no harakat, no shadda, no alef wasla, no superscript alef.

It also **double-counts the Basmalah**. Chapters 2–114 except 9 carry both a `verse 0` Basmalah row *and* the Basmalah re-embedded as a prefix inside verse 1's Arabic:

```
2,0,بسم الله الرحمن الرحيم,"In the name of GOD..."
2,1,بسم الله الرحمن الرحيم الم,A. L. M.±
4,1,بسم الله الرحمن الرحيم يا أيها الناس اتقوا ربكم...
```

That is invisible to the verse embed (it renders one verse at a time) and fatal to a counting engine: 112 × 19 = 2,128 phantom letters. Measured letter totals over numbered verses: **332,723 as stored**, 330,595 after de-duplication. Neither figure reproduces any published count.

Consequence: **the module needs a different text source.** Not a nice-to-have; a precondition.

### 0.2 Two datasets, one of which is now the primary source

**`Words and Root - Uthmani Script - Sheet.csv` (4.9 MB, 79,569 rows) is the primary source.** Word-level, pointed Uthmani, with roots, English gloss and transliteration per word:

```
SuraNumberEnglish,VerseNumberEnglish,WordNumberEnglish,Uthmani,EnglishWord,TransliterationWord,Root Word 1,Root Word 2,Root Word 3
1,1,1,بِسْمِ,In (the) name,bis'mi,س م و,,
1,1,3,ٱلرَّحْمَـٰنِ,"Most Gracious,",l-rahmani,ر ح م,,
```

Measured properties:

| | |
|---|---|
| Canonical word rows (`verse > 0`) | **77,401** |
| Unnumbered Basmalah rows (112 chapters x 4 words) | 448 |
| Filler rows, every column a literal `-` | **1,720** |
| Distinct verses | **6,234** |
| Distinct chapters | 114 |
| Chapter 9 range | 1 to 127 |
| Words with no root | **0** |
| Distinct roots | **1,782** (untrimmed the source reads 1,790: six roots carry inconsistent whitespace, and the filler rows add a literal `-`) |
| Words with no gloss / no transliteration | 0 / 3 |
| Verses with non-contiguous word numbering | 0 |

Three things the generator has to handle, all found by measurement:

- **The 1,720 filler rows** (`-,-,-,-,…`) are spreadsheet spacers. `79,569 = 77,401 + 448 + 1,720` exactly, so nothing else is unaccounted for. Filter on a numeric `SuraNumberEnglish`.
- **`37:130:3` is `إِلْ يَاسِينَ`, one word containing a space.** The dataset is right and a whitespace tokenizer would be wrong. This is why the word count is 77,401 and not the 77,403 a naive split of the verse-level CSV gives.
- **Verse 1 does not embed the Basmalah.** `2:1` is `الٓمٓ` alone, and the Basmalah is its own `verse 0` group. This dataset does not have §0.1's bug.

`ws_quran_text_rows.csv` stays as the **secondary** source, joined on `chapter:verse`, for the things it alone carries: English and 14 other translations, plus `ws_quran_chapters_rows.csv` (`chapter_verses`, `revelation_order`, titles in 16 languages) and the per-verse subtitle and footnote CSVs in 15 languages.

Both are already on Khalifa's numbering: 6,234 verses, `sum(chapter_verses) = 6234`, chapter 9 running 1 to 127, chapter 1 carrying the Basmalah as 1:1.

**The two Uthmani renderings differ.** The words CSV writes `ٱلرَّحْمَـٰنِ` with a tatweel carrier (`U+0640` appears 6,848 times) where the verse CSV writes `ٱلرَّحْمَٰنِ` (tatweel 518 times). Under an identical Simplified29 fold the corpus totals come out **325,273 letters** from the words CSV against 325,534 from the verse CSV, a 261-letter spread. One of them has to be canonical for counting, and it is the words CSV: it tokenizes words correctly, carries the roots, and reproduces Al-Fatiha exactly. See §8 Q2.

### 0.3 The counting convention, and how far it reconciles

QuranCode's feature list names its text modes: **`Simplified29`**, `Simplified30`, `WawSimplified29`, `ShaddasSimplified29`. These are letter-set normalizations, and every count in the app is relative to one. The old app's Statistics header confirms the mechanism directly: under the mode name sits **a row of per-mark checkboxes**, one of them tooltipped *"Hamza above horizontal line as letter"*, alongside a `base < 10 >` radix control and a `/ < 19 >` divisor control. Whether a given hamza or mark form counts as a letter is a **toggle**, not a fixed property of the mode.

**Simplified29 reproduces the 29-letter basis exactly.** Fold the words CSV's Uthmani column: drop all marks including the silent and superscript diacritics, the tatweel and the stray hyphen; fold `أ إ آ ٱ` to `ا`, `ؤ` to `و`, `ئ` to `ي`, `ة` to `ه`, `ى` to `ي`. The result is exactly 29 distinct letters:

```
ء ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي
```

| Simplified29 | computed | published |
|---|---|---|
| Al-Fatiha verses / words / letters | **7 / 29 / 139** | 7 / 29 / 139 OK |
| Corpus chapters / verses | **114 / 6,234** | 114 / 6,234 OK |
| Corpus words | **77,401** | not published |
| Corpus letters | **325,273** | not published |
| Distinct letters in the fold | **29** | 29 OK |

**Initial counts include the sura's Basmalah.** This one came out of the data rather than out of a source. Counting canonical verses only, lam came in short by exactly 4 and mim short by exactly 3 in *every one* of the six الم suras. A uniform offset is a missing constant, and the Basmalah is that constant: `بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ` holds exactly 4 lams and 3 mims. Add the unnumbered Basmalah back and the counts land.

With that rule in place, plain codepoint counting reproduces the published figures for every orthographically unambiguous letter: 27 of 31 fixtures pass.

| test | computed | published | |
|---|---|---|---|
| ح + م across suras 40 to 46 | **2,147** | 2,147 = 19x113 | OK |
| ص across suras 7, 19, 38 | **152** | 152 = 19x8 | OK |
| ق in 42 and 50 | **114** | 114 = 19x6 | OK |
| ن in sura 68 | **133** | 133 = 19x7 | OK |
| ط in sura 20 / sura 27 | **28 / 27** | 28 / 27 | OK |
| ه + ة in sura 19 / sura 20 | **175 / 251** | 175 / 251 | OK |
| س in sura 36 | **48** | 48 | OK |
| ل and م, six الم suras (12 fixtures) | exact in 11 | | OK x11 |
| ل in sura 30 | **394** | 394 | ✓ (see below) |
| ي + ى + small yeh, sura 19 | **343** | 343 | OK |
| ي + ى (+ small yeh), sura 36 | 233 / 241 | 237 | off by 4 |

**Two of the four gaps close against an outside source.** The [qurantalk "Quran Initial Count"](https://qurantalk.gitbook.io/quran-initial-count/) documentation of Appendix 1 supplies both:

- **Sura 30 carries one fewer alif and one more lam than the printed table**, leaving the 1,254 total intact. Our measured lam of 394 is the correct figure and the printed 393 is the error, so the fixture uses 394 and now passes. The same source traces it to 30:21, where Dr. Khalifa's book records seven lams where the manuscripts have eight.
- **Sura 68's initial is spelled `نون`, not `ن`**, which is how the count reaches 133. The word list already spells it out, which is why that fixture passed from the start.

With the corrected table, **all twelve lam and mim fixtures across the six الم suras pass exactly**, and the grand total lands on 8,944 + 6,494 + 4,436 = **19,874 = 19 × 1,046**.

**Alif does not reconcile, and it is not a toggle.** With the Basmalah included, the published alif figures for the six الم suras (4502, 2521, 774, 544, 347, 257) sit 2,530 / 1,493 / 448 / 316 / 218 / 133 above the bare-alif count. I enumerated **all 8,192 subsets** of thirteen candidate classes: `ٱ` wasla, `ٰ` superscript alef, `أ`, `إ`, `آ`, `ء` on the line, `ؤ`, `ئ`, `ى` maqsura, combining hamza `ٔ`, combining madda `ٓ`, small waw `ۥ`, small yeh `ۦ`, testing each subset against all six suras at once. **No subset reproduces more than 2 of the 6.** The best fit (`ٱ + أ + ؤ + ئ + ٔ`) lands suras 30 and 32 exactly and misses sura 2 by 147.

The same qurantalk documentation says why, and the answer rules the toggle approach out permanently:

> if any word with a hamza was to be considered as an Alif then the hamza would be considered as an Alif in every occurrence of this word and the derivative of that word throughout the entire Quran

**The rule is keyed on the word, not on the codepoint.** A given hamza form counts as an alif in one word and not in another, decided per lexical item and applied consistently to that item and its derivatives everywhere. Where hamza alone will not close a sura, an alternate spelling is taken from the early manuscripts and then used for that word throughout. No per-class toggle can express either, which is exactly why all 8,192 subsets failed.

Sizing the table this implies: across the six الم suras the deficit is **1,128 alifs against a pool of 2,907 hamza-bearing letters**, so roughly 39% of the pool has to resolve to alif. Those occurrences span **948 distinct word forms** in those six suras and **3,749 corpus-wide**. That is a large but bounded lookup, and it is now a data-entry and calibration task rather than an open question.

`text_modes.json` therefore carries an `alif_overrides` map, empty today, keyed on the word form. The cheapest way to populate it is to **diff QuranCode's own Simplified29 letter stream against ours word by word** and record the disagreements, which the open-source decision (§0.5) makes straightforward. Until it is populated, alif-dependent totals ship labelled unverified.

**Architectural conclusion.** There is no single true letter count. Simplified29 is fully verified against the 29-letter basis. The published-figures mode is verified for every unambiguous letter and unresolved for alif. `text_mode` plus its per-mark toggles is therefore a first-class, switchable axis of the whole module, and no number may ever be displayed without the mode, the toggles, and the verification state that produced it. This is §2.2 and §5.6, and it is the single most important design decision in this plan.

### 0.4 What the repo still does not have

The words CSV closes most of the earlier gap list. What is left:

| needed for | missing data | resolution |
|---|---|---|
| `SelectionScope` = Page / Station / Part / Group / Quarter / Bowing | division boundaries | import from QuranCode `Model/Data/quran-metadata.txt`, ultimately Tanzil |
| Grammar edition: word-part segmentation | morphology | **derive it** (§2.7) |
| Grammar edition: POS tags, lemmas, case, mood | morphological tagging | not derivable from what we have; optional external import, and not required by any counting feature |

**Prostration filtering is dropped, not deferred.** `FindType.Prostration` and the `ProstrationType` enum come out of the feature map entirely.

**Roots, per-word gloss and transliteration are no longer gaps.** They arrive with the words CSV at full coverage: zero words without a root, 1,782 distinct roots. Root search, related-words lookup and gloss-on-hover move from deferred to shippable, which is the biggest single scope change in this revision.

### 0.5 Licence, resolved

**Decision taken: Studio goes open source, and the plan assumes a GPL-compatible licence.** That settles what was the blocking question:

- QuranCode's GPL-3.0 data files are ingestible. Word-parts morphology and the division metadata become schedulable work rather than a legal question.
- Reading QuranCode's Simplified29 implementation to calibrate the alif rule is fine, which is what makes §0.3's resolution path viable.
- **Code is still not ported.** Not for licence reasons now, for engineering ones: the presentation layer is a single 548 KB `MainForm.cs` against 437 KB of designer code on .NET 2.0 WinForms. There is nothing there to reuse in a React and Rust app. The module is reimplemented from the feature surface (`Model/Enums.cs`, `Features.txt`, the screenshots) and the algorithms are read for their semantics, then written fresh.
- Attribution and licence notices for every ingested dataset go in `studio/src-tauri/assets/qurancode/CREDITS.md`, generated alongside the index so it cannot drift.

Worth stating plainly regardless of licence: this module computes numbers over scripture and will be used to make claims. §5.6 treats provenance as a feature requirement, not polish.


## 1. Where the module lives

### 1.1 The ribbon button

A new `LeftRibbon` entry immediately **below** the `VideoCamera` media-notes button, closing the top-actions group:

```tsx
{onOpenQuranCode && (
  <motion.button
    whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.92 }} transition={springSnappy}
    onClick={onOpenQuranCode}
    aria-label="QuranCode"
    title="QuranCode: numeric & similarity research (Ctrl+Shift+K)"
    className={`tactile p-2 rounded-lg transition-colors ${quranCodeOpen
      ? 'text-ed-accent bg-ed-accent-soft border border-ed-accent/25 shadow-xs'
      : 'text-ed-fg-muted hover:text-ed-accent hover:bg-ed-accent-soft'}`}
  >
    <MathOperations size={18} weight={quranCodeOpen ? 'fill' : 'regular'} />
  </motion.button>
)}
```

`MathOperations` from Phosphor. Media Notes' exact active-state treatment, so the two research surfaces read as siblings. Shortcut `Ctrl+Shift+K` (`Ctrl+Shift+Q` is taken by cue-quoting), registered in `SYSTEM_COMMANDS` under a new `'Research'` category, `useShortcuts` only walks that list, and Phase 7 already lost two shortcuts to exactly this omission.

### 1.2 The shell: a tab, not a modal, not an inspector pane

Three options existed. The choice matters more than it looks.

| option | precedent | verdict |
|---|---|---|
| right-inspector tab | Media Notes (`inspectorWide`, 440 px floor) | **No.** 440 px seats a player and a transcript. It cannot seat a query builder, a verse browser and a live statistics readout. Pushing `INSPECTOR_MEDIA_MAX_SIZE` past 62% turns the inspector into the app. |
| full-screen scrim overlay | `GraphView`, `CanvasView` (`fixed inset-0 bg-ed-scrim z-50`) | **No.** Correct for a glance; wrong for an hour. An overlay cannot be split against the note you are writing, gets no tab, no history, no persisted layout, and every citation is a round-trip through dismiss/reopen. |
| a pane the editor region can host | `renderPane(filePath)` + `TabHeader` | **Yes.** |

**Decision: QuranCode is a pseudo-file tab.** It opens as a tab whose path is the sentinel `qc://workspace`, and `renderEditorPane` returns the surface for it:

```tsx
const QC_TAB_PATH = 'qc://workspace'

const renderEditorPane = (path: string | null) => {
  if (path === QC_TAB_PATH) return <QuranCodeSurface archivePath={archivePath} />
  if (!path) return <HomeDashboard … />
  if (fileKindOf(path) !== 'markdown') return <FileViewer filePath={path} />
  return <Editor … />
}
```

Everything else falls out for free, which is the point:

- **Split view already works.** `Ctrl+\` puts QuranCode in one half and the note in the other. The researcher reads counts and writes prose without a mode switch. This is the single strongest argument for the approach and it costs nothing.
- **Tabs, history (`historyStack`), and `autoSaveId` pane persistence** all apply unchanged.
- **Citation flow copies Media Notes exactly**: a `quranCodeBus` (mirroring `lib/mediaBus.ts`) carries "insert this finding" to whichever editor pane holds the active-editor slot. `mediaBus` already solved the sibling-panes-with-no-shared-context problem; do not re-solve it.

Touch points, all small: `fileKindOf` must return something non-`markdown` for the sentinel so `StatusBar` and `Editor` stay out of the way; `handleOpenFile` must not push the sentinel into `recordOpen`; `TabHeader` needs an icon branch. Roughly 30 lines across `App.tsx`, `fileTypes.ts`, `TabHeader.tsx`.

### 1.3 Inside the surface

A nested `PanelGroup`: the pattern `WorkspaceLayout` already uses for splits:

```
┌──────────────┬────────────────────────────────┬──────────────────┐
│  QUERY       │  TEXT                          │  READOUT         │
│              │                                │                  │
│  ▸ Text      │  ┌──────────────────────────┐  │  Scope           │
│  ▸ Numbers   │  │ 33:33  parchment card    │  │  ch 33 · v 33    │
│  ▸ Similarity│  │ Arabic (Amiri, pointed)  │  │                  │
│  ▸ Frequency │  │ English (Source Serif)   │  │  Counts     mono │
│              │  └──────────────────────────┘  │  words       23  │
│  [ builder ] │                                │  letters     78  │
│              │  results list, virtualized     │  value    1,368  │
│  ─────────── │                                │                  │
│  text mode   │                                │  ÷19?  ✓ 72×19   │
│  Simplified29│                                │                  │
│  ─────────── │                                │  Letter freq     │
│  value system│                                │  ا 12  ل 9  …    │
│  Abjad std   │                                │                  │
└──────────────┴────────────────────────────────┴──────────────────┘
```

Min sizes 240 / 420 / 300 px. The two mode selectors sit in the **left pane footer**, permanently visible, because §0.3 means they are not settings; they are part of every question asked.

---

## 2. Data layer

### 2.1 Generator script

`scripts/generate/build_qurancode_index.mjs`, mirroring `build_studio_media_index.mjs` (which already projects Next.js data into `studio/public/media/`). Wired as `npm run generate:qurancode` / `verify:qurancode`, the latter in `verify:deploy`.

Inputs: the words CSV as primary, plus `data/sources/quran/1992/ws_quran_{text,chapters,subtitles,footnotes}_rows.csv` as secondary, joined on `chapter:verse` (§0.2).
Output: `studio/src-tauri/assets/qurancode/`: bundled via `include_str!`/`include_bytes!`, not `public/`, because the Rust side owns every query (§3).

One scan produces everything, the `scan_archive` philosophy applied to scripture:

| file | ~size | content |
|---|---|---|
| `words.tsv` | ~4 MB | `chapter ⇥ verse ⇥ word ⇥ uthmani ⇥ gloss ⇥ translit ⇥ root_ids ⇥ status` |
| `verses.tsv` | ~1.4 MB | `chapter ⇥ verse ⇥ english ⇥ subtitle ⇥ footnote_id ⇥ status` |
| `roots.tsv` | ~40 KB | 1,782 roots, each with its word-id list, for root search |
| `segments.tsv` | ~1.5 MB | prefix / stem / suffix spans per word, derived (§2.7) |
| `chapters.tsv` | ~20 KB | number, verse count, revelation order + place, Arabic/English/transliterated titles |
| `letters.bin` | ~3 MB | the letter index, one per countable mode (§2.3) |
| `text_modes.json` | ~4 KB | the fold tables (§2.2) |
| `value_systems/*.json` | ~2 KB ea. | letter→number tables (§4.2) |
| `fixtures.json` | ~8 KB | the 31 published counts, for CI (§2.6) |
| `CREDITS.md` | ~2 KB | per-dataset attribution and licence, generated so it cannot drift |

~9 MB bundled. For scale: `studio/public/media/` is already ~8.5 MB and committed.

### 2.2 Text modes are data, and so are their toggles

`text_modes.json`: one entry per mode. Each carries a base codepoint fold, a token-boundary rule, and the **per-mark toggle set** the old app exposes as a checkbox row under the mode name (§0.3). Adding a mode, or a toggle, is editing this file. It never touches Rust.

```json
{
  "original": {
    "label": "Original (Uthmani)",
    "description": "Pointed text as printed. Display only: not a counting basis.",
    "countable": false
  },
  "simplified29": {
    "label": "Simplified 29",
    "description": "29-letter alphabet. Al-Fatiha 7/29/139.",
    "drop":  ["064B-0655", "0670", "0640", "06D6-06ED", "002D"],
    "fold":  { "0671":"0627", "0622":"0627", "0623":"0627", "0625":"0627",
               "0624":"0648", "0626":"064A", "0629":"0647", "0649":"064A" },
    "alphabet": "ءابتثجحخدذرزسشصضطظعغفقكلمنهوي",
    "countable": true,
    "toggles": {
      "hamza_on_line":     { "cp": "0621",      "default": true,  "label": "Hamza above horizontal line as letter" },
      "superscript_alef":  { "cp": "0670",      "default": false, "label": "Superscript alef as letter" },
      "small_waw_yeh":     { "cp": "06E5,06E6", "default": false, "label": "Small waw / yeh as letter" },
      "silent_marked":     { "cp": "06DF",      "default": false, "label": "Count letters marked silent" }
    },
    "verified": ["fatiha_7_29_139", "corpus_114_6234_77401_325273", "alphabet_is_29"]
  },
  "khalifa_appendix1": {
    "label": "Appendix 1 (published)",
    "description": "Reproduces Dr. Khalifa's published Appendix 1 initial counts.",
    "drop":  ["064B-064F", "0651-0655", "0640", "06D6-06DE", "06E0-06ED", "002D"],
    "fold":  { "0629":"0647" },
    "countable": true,
    "include_sura_basmalah_in_initials": true,
    "verified": ["hm_2147", "sad_152", "qaf_114", "nun_133", "ta_20_28", "ta_27_27",
                 "sin_36_48", "ya_19_343", "ha_19_175", "ha_20_251",
                 "lam_mim_alm_suras_11of12"],
    "known_gaps": [
      "alif: no subset of 13 mark classes reproduces published alif for all six ALM suras (best 2 of 6)",
      "lam sura 30: computed 394 vs published 393",
      "ya sura 36: computed 233 without small yeh, 241 with, vs published 237"
    ]
  },
  "simplified30": { "note": "deferred to 9g" }
}
```

Three fields here are load-bearing rather than descriptive.

**`toggles`** is the mechanism the screenshot shows, lifted into data. Each entry names a codepoint class, a default, and the label the UI puts on its checkbox. The Rust side reads the set and applies it; it has no built-in opinion about hamza. This is what makes the alif question answerable later without a code change: when the rule is finally pinned down, it lands here.

**`include_sura_basmalah_in_initials`** encodes §0.3's discovery. It is a property of the published counting method, so it belongs to the mode, not to a query.

**`verified` and `known_gaps`** are read at runtime and surfaced in the UI (§5.6). A mode with an open gap cannot be presented as authoritative for the letters that gap touches. The alif gap is not cosmetic: alif forms are roughly 16% of all letters, so an unresolved alif rule makes that mode unreliable for about a sixth of the corpus. The two smaller gaps (one lam, four ya) are recorded at the same fidelity so nobody has to rediscover them.

### 2.3 No letter index, and why

The plan originally called for a prebuilt `letters.bin`: six parallel arrays of chapter, verse, word, position and letter code, built once and queried thereafter. **That is not what shipped, and it could not have been.**

The fold that turns pointed Uthmani into countable letters depends on the active text mode *and* on the user's mark toggles. Both are runtime state. A letter index built ahead of time would be stale the moment a checkbox moved, so it would have to be rebuilt per toggle combination, which is the work it was meant to avoid.

So every query folds on demand. The question that makes that defensible is whether a whole-corpus count is fast enough to drive a live readout, and the answer is measured rather than assumed:

| | release | debug |
|---|---|---|
| whole corpus, both countable modes, with valuation | **13.1 ms** | 275 ms |

That is the shipped path, not a micro-benchmark: `count(None, None, Some("abjad_standard"))` over all 77,401 words, folding each twice. It got there in three steps, and the first version was 42 ms:

- **One array index per character instead of three hash lookups.** Arabic occupies U+0600..U+06FF, so every codepoint the fold cares about fits a 256-entry table indexed by the low byte. Each mode resolves its fold map, the always-drop set, the toggle map and the letter test into one `Action` table at load. The inner loop became a single indexed read.
- **A flat `[bool; 256]` for "have I seen this letter"** instead of a `HashSet<char>` insert per letter, which was 650,000 hashes per corpus count.
- **The same 256-entry trick for letter values**, so a valuation is an array read rather than a hash of a `char`.

One rule resists the table and stays in the loop: the silent marker governs the letter *before* it, so it needs a one-character lookahead. That is why `Config` still carries a `silent_rule` when everything else folded into the per-mode tables.

The test asserts against a different budget per build profile (25 ms release, 1 s debug) and prints what it measured. A single budget would either fail the default `cargo test` or let a real regression through.

### 2.4 Verse status

Every verse row carries `status`: `'canonical' | 'basmalah_unnumbered'`. There is no third value.

- The 112 unnumbered Basmalah groups (448 word rows) are `basmalah_unnumbered`. They are **excluded from corpus totals** — 6,234 is the number every published figure is taken against — and **included when counting a sura's initials**, which §0.3 established as a rule of the published counts, not a preference.
- **9:128–129 are absent from both datasets and stay absent.** Nothing is re-inserted, nothing is flagged, and no `excluded` status exists. The Khalifa numbering is the numbering, and carrying the two verses around as marked-out rows would only invite them back into a count by accident.
- That does leave one live inconsistency to fix: `quran.rs`'s hardcoded `SURAHS` table claims chapter 9 has 129 verses while the data has 127, so `search_verses("9:128")` currently fails with an unhelpful "No verses found". Chapter metadata moves to generated data, and the hardcoded tables in both `src-tauri/src/quran.rs` and `src/lib/quranData.ts` are deleted.
- The words CSV needs no Basmalah stripping (§0.2), so the assertion §0.1 called for becomes a guard instead: fail generation if any `verse 1` word group begins with the Basmalah's four words.

### 2.5 Does the verse embed migrate too?

Not in 9a. `search_verses` keeps reading the existing bundled CSV so nothing regresses. But once `verses.tsv` exists it is strictly better: pointed Arabic, transliteration, subtitles, footnotes, 15 translations; and the embed should move to it in 9c, deleting `assets/quran.csv`, `src/assets/quran.csv`, and most of `src/lib/quranData.ts` (which exists only as the web-preview mock). One text source, not three.

### 2.6 CI validation

`fixtures.json` holds every published figure this plan verified, each tagged with the mode it belongs to. `verify:qurancode` recomputes all of them and **fails the build on any drift**. This is the mechanism that keeps a numeric research tool honest across refactors, and it is the reason §0.3's measurements were worth taking before writing code rather than after.

Additional generator assertions, every one of them a measurement from §0.2 or §0.3: `79,569 == 77,401 + 448 + 1,720` on the words CSV; 114 chapters; 6,234 distinct verses; `sum(chapter_verses) == 6234`; chapter 9 range 1 to 127 with nothing beyond it; 112 unnumbered Basmalah groups; zero words without a root; 1,782 distinct roots; contiguous word numbering in all 6,234 verses; no `verse 1` group beginning with the Basmalah; each countable mode's alphabet size matching its declaration; the Simplified29 fold resolving to exactly 29 distinct letters.

---

### 2.7 Derived morphology

We do not have a morphology file and do not need to import one for segmentation. The words CSV gives every word its root, and a root is enough to locate the stem inside the word: **walk the root's radicals through the word's consonant skeleton in order; everything before the first match is the prefix, everything after the last is the suffix, and the span between them is the stem.**

Measured on all 77,371 rooted words, in two passes:

| pass | segmented | failed |
|---|---|---|
| naive radical walk | 65,093 (84.10%) | 12,308 |
| **+ shadda satisfies a doubled radical, + one elided weak radical** | **76,472 (98.84%)** | 899 |

The 14-point jump comes from one insight: a geminate root (`ر ب ب`, `ض ل ل`) is written once with a shadda, so a shadda-bearing letter must be allowed to satisfy two consecutive identical radicals. Allowing one elided weak radical (`و ي ا`) covers hollow and assimilated forms.

The remaining **899 instances (1.16%)** are a narrow, enumerable class: `قُلنَا` from `ق و ل`, `تَتَّقُونَ` from `و ق ي`, `هَـٰذَا` from `ه ا ذ`. A hand-checked exception table of roughly sixty distinct forms closes it, and the generator **fails** rather than guessing on anything not in that table. Adding a second permitted weak skip only reaches 98.89%, so it is not worth the loosened constraint.

What falls out for free, as data rather than as a hand-written list:

- **156 distinct prefix forms and 198 suffix forms**, ranked by frequency: `و` 4,805, `ال` 4,756, `ي` 3,282, `ا` 2,970 as prefixes; `ا` 4,231, `ت` 3,910, `وا` 2,981, `هم` 2,956 as suffixes. These are QuranCode's `WordPart` boundaries, derived instead of ingested.
- Word-part scoping for the counting engine: counting letters "in stems only" or "excluding the definite article" becomes a filter over `letters.bin`, no new data.
- Root-family navigation, which the roots column already gave us.

What this does **not** give: part-of-speech tags, lemmas, case, gender, mood. Those are annotations, not derivations, and no counting feature needs them. If the Grammar edition's full tag set is wanted later, the Quranic Arabic Corpus is importable now that the licence question is settled (§0.5), and it would slot in as an extra column rather than a rebuild.

The segmentation is a generated artifact, so it gets the same treatment as everything else in §2.6: the alignment rate is a CI assertion, and a regression that drops it below 98.84% fails the build. As shipped in 9a it aligns **76,472 of 77,371** rooted words, emitting 156 prefix and 198 suffix forms.

---

## 3. Rust backend

New module `src-tauri/src/qurancode.rs`, following the `quran.rs` / `notes.rs` command style. Pure functions over bundled data: no filesystem writes, no user data, so none of the archive/trash/history concerns apply.

### 3.1 No SQLite

The superseded plan argued for `rusqlite` because the queries are aggregate. Reversing that:

- **Scale doesn't warrant it.** 6,234 verses / 77,401 words / 325,273 letters. The entire corpus fits in L3.
- **The queries aren't relational.** They are predicate scans over contiguous arrays (`count letters where code == X and pos_in_word == 1 and chapter in 2..=5`). A `GROUP BY` over 326 k rows through SQLite's VM is slower than the equivalent Rust loop, not faster, and the loop needs no query planner, no prepared statements, no result marshalling.
- **It adds the only native C dependency in the tree.** Current `Cargo.toml`: tauri, serde, serde_json, serde_yaml, csv, regex, zip. `rusqlite` pulls `libsqlite3-sys`, which pulls a C toolchain into a cross-platform Tauri release pipeline that currently has none.
- **`include_str!` already keeps the offline charter airtight.** A bundled `.db` would need extraction to a writable path on first run, which is new failure surface for zero benefit.

**Decision: fold on demand behind `OnceLock`-loaded corpus data, no new dependency.** Measured at 13.1 ms for a whole-corpus count over both modes with valuation (§2.3), so the 16 ms bar holds with room to spare and SQLite would have bought nothing but a C toolchain in the release pipeline.

### 3.2 IPC surface

Named `qc_*`, registered in `lib.rs`'s `invoke_handler`.

| command | returns | notes |
|---|---|---|
| `qc_metadata()` | text modes, value systems, chapter table, corpus totals per mode | one call at surface mount; the UI never hardcodes a count |
| `qc_get_verse(ref, mode)` | verse in original + selected mode, per-letter spans, word boundaries | spans drive letter-level selection and diff highlighting |
| `qc_count(filter)` | `{ chapters, verses, words, letters, unique_letters, value, digit_sum, digital_root }` | the "by Numbers" engine. `filter` = scope + text/letter predicate + position + wordness. Returns the same block for **every** countable mode in one call, so mode-switching in the UI is free and comparison is the default view, not a feature. |
| `qc_letter_frequency(scope, mode)` | per letter: `{ char, count, sum_positions, sum_distances }` | the screenshot's `# L Freq ΣPos Σ∆` |
| `qc_compute_value(selector, system, modifiers)` | `{ value, breakdown[], divisors: {19: …, 7: …}, is_prime, digit_sum, digital_root }` | §4 |
| `qc_find_by_number(target, range, mode, system)` | matching verses/words/chapters | inverse of `qc_compute_value`; `FindByNumbersTextRange` |
| `qc_similarity(query, method, scope, threshold)` | ranked matches with aligned spans | Levenshtein; `SimilarText \| SimilarWords \| SimilarStart \| SimilarEnd` |
| `qc_find_text(query, opts)` | matches with spans | `Exact \| Proximity \| Root`; `Anywhere\|AtStart\|AtMiddle\|AtEnd\|AllWords\|AnyWord`; `WholeWord\|PartOfWord\|Any`; `-`/`+` word exclusion/inclusion |
| `qc_word_info(chapter, verse, word)` | Uthmani, gloss, transliteration, roots, related-word ids | powers hover cards and the related-words lookup |
| `qc_root_words(root)` | every word sharing a root, grouped by verse | the old app's Ctrl+Click and F5 |
| `qc_radix(expr, base)` | evaluated value | bases 2–36, both directions |

Everything returns a `provenance` block: `{ text_mode, value_system, scope, verified, known_gaps }`, because §5.6 requires the UI to be unable to render a number without it. Making that structural beats making it a convention.

### 3.3 Tests

`#[cfg(test)]` in `qurancode.rs`, matching the existing style in `quran.rs`/`archive.rs`/`notes.rs`:

- Al-Fatiha under Simplified29 = 7 / 29 / 139
- corpus under Simplified29 = 114 / 6,234 / 77,401 / 325,273
- ح+م across 40–46 = 2,147; ص across 7/19/38 = 152; ق = 114; ن = 133 (Appendix-1 mode)
- ه+ة sura 19 = 175, sura 20 = 251
- Basmalah = 19 letters / 4 words in both countable modes
- unnumbered Basmalahs excluded by default, included when scoped
- 9:128–129 absent from the corpus entirely; a query for either returns a numbering explanation, not "No verses found"
- a sura's initials count includes its unnumbered Basmalah; corpus totals do not
- root lookup: every word resolves to at least one root; 1,782 distinct roots
- start/mid/end predicates against a hand-checked short sura
- digital root, digit sum, primality on known values
- every mode's alphabet size matches its declaration

---

## 4. Value systems

### 4.1 Named, versioned, data

One JSON file per system in `assets/qurancode/value_systems/`. A system **declares the text mode it is defined over**: a letter→number table is meaningless without knowing what counts as a letter.

```json
{
  "id": "abjad_standard",
  "name": "Abjad standard",
  "author": "classical (hisab al-jummal)",
  "text_mode": "simplified29",
  "note": "The classical Arabic gematria order. Hamza carriers take the value of their seat.",
  "letter_values": { "ا": 1, "ء": 1, "ب": 2, "…": 0 }
}
```

Ship: `abjad_standard`, `abjad_maghribi`, `counts_only`. Load user systems from `<archive>/.studio/value_systems/*.json`, the archive already owns `settings.json`, `theme.css` and folder icons, so this is the established shape and needs no new Rust plumbing beyond a directory read. Live editing with persistence (a QuranCode feature) is 9g.

### 4.2 The 19 modifiers

QuranCode's "19 value modifiers (letter/word/verse/chapter position and distance)" are a cross product: for each of **letter / word / verse / chapter**, add its *number*, *number-in-parent*, or *distance-to-previous* into the running value. `Model/Letter.cs` confirms the shape: `Number`, `NumberInChapter`, `NumberInVerse`, `NumberInWord`, `DistanceToPrevious`.

Model it as a flat typed struct, not 19 booleans in a bitfield:

```rust
pub struct ValueModifiers {
    letter:  LevelMods,   // { number, number_in_word, number_in_verse,
    word:    LevelMods,   //   number_in_chapter, distance_to_previous }
    verse:   LevelMods,
    chapter: LevelMods,
}
```

**UX consequence, and it is the big one for modernization.** The old app exposes these as 19 checkboxes plus an `L W V S Cs #` / `S H C P G Q V B` matrix: a combinatorial space of ~500 k configurations with no indication which are meaningful. Any conclusion is reachable by clicking enough boxes.

The module therefore ships **named presets first** ("Simple value", "Value + letter positions", "Abjad standard"), with the raw matrix behind a "Custom…" disclosure that is honest about what it is: a search over half a million combinations. When a custom combination is active, the readout says so, and every copied figure carries the full modifier set. Progressive disclosure here is not tidiness; it is the difference between a research instrument and a slot machine.

---

## 5. Frontend

### 5.1 Components

Naming follows the existing convention (`components/media/*`, `hooks/use*`, `lib/*Bus`).

```
src/components/qurancode/
  QuranCodeSurface.tsx        three-pane shell; owns scope + mode state
  QueryPane.tsx               tab shell: ExplorerPanel's segmented switcher pattern
    TextQueryPanel.tsx        Exact / Proximity / Root · location · wordness
    NumberQueryPanel.tsx      target value, range, grouping
    SimilarityQueryPanel.tsx  method + threshold
    FrequencyQueryPanel.tsx   letter-frequency sums, ± duplicates
    RootQueryPanel.tsx        root picker over the 1,782 roots
  ScopeBar.tsx                chapter/verse/word/letter nav + division scopes
  VerseBrowser.tsx            reading surface; wraps the parchment card
  ResultsList.tsx             virtualized (TranscriptTeleprompter's approach)
  ReadoutPane.tsx             live counts + value calculator + frequency table
    CountBlock.tsx
    ValueCalculator.tsx
    LetterFrequencyTable.tsx
  ModeSelectors.tsx           text mode + value system, left-pane footer
  MarkToggleRow.tsx           the per-mark checkbox row, readout header
  WordHoverCard.tsx           gloss, transliteration, roots, related words
  ProvenanceChip.tsx          the thing that makes a number citable
src/hooks/useQuranCode.ts     wraps the qc_* calls, useArchive's shape
src/lib/quranCodeBus.ts       mediaBus's shape, for citations
```

`ResultsList` must be windowed from the start. `TranscriptTeleprompter` already solved this for ~1,700 cues with measured row heights; a whole-corpus text search returns thousands of verses and a letter-level result set returns tens of thousands.

### 5.2 Theme

No new palette. Phase 7 was explicit: no Studio-only colours, no third accent, no off-scale radius.

| surface | tokens |
|---|---|
| chrome, panes, rules | `--ed-*` |
| verse display | `--qv-*` "Ink on Parchment", theme-aware per §4D: parchment card in dark, framed inset in light |
| **every numeral** | JetBrains Mono (`--font-mono`), already bundled, already how timestamps and references are styled |
| Arabic | Amiri (`--font-arabic`) |
| English gloss | Source Serif 4 (`--font-serif`) |
| letter-role / grammatical colouring | `--ed-cat-1..5`: exists for exactly this (i'rab roles on the canvas); five hues, five roles |
| **numeric significance** (÷19, prime) | `--ed-gold` |

`--ed-gold` for significance rather than `--ed-accent` is deliberate: accent means *you selected this*, gold means *the number has a property*. Conflating them would make every divisible-by-19 result look like a selection, and in a tool whose entire subject is divisibility that is a real legibility failure. The screenshot's approach: six saturated colours competing at once; is what we are moving away from.

Text colour: `--ed-fg-secondary` for anything meant to be read. Phase 7's audit established that `--ed-fg-muted` is not an AA body colour in either theme; it is for icons, rules and decorative numerals. A dense table of small numerals is the easiest place in the app to get this wrong.

### 5.3 Motion

`ui/Motion.tsx` only: `springConfig`, `springSnappy`, `fadeInUp`, `staggerContainer`. Specifically:

- `layoutId` pill on the query-pane tab switcher, as `ExplorerPanel` does
- numeric readouts **cross-fade, never count up.** A rolling-odometer animation on a research figure implies precision it does not have and delays the read.
- results stagger in at `staggerChildren: 0.04`, capped at the first ~12 rows
- no width animation on the panes. Phase 7 documented at length why that fights `react-resizable-panels`; panes snap, contents fade.

### 5.4 Modernization principles

Against the screenshot's nine simultaneous dense panels:

1. **One question at a time.** Query pane holds the active question. The old app's parallel Symmetry / DNA / CVWL / Values / Distances / C+V tab strip becomes a single result surface that changes shape with the question.
2. **Results are objects, not a scroll buffer.** Every result carries its provenance, is pinnable, comparable, and appendable to a note.
3. **Comparison is the default.** `qc_count` returns all countable modes at once, so the readout shows Simplified29 *beside* Appendix 1 rather than making the researcher toggle and remember. This is the direct product consequence of §0.3 and the module's clearest advance on the original.
4. **Progressive disclosure over density.** 19 modifiers → presets + "Custom…". Eleven navigation scopes → chapter/verse always visible, the rest behind a scope picker.
5. **Numbers are typeset, not printed.** Mono, tabular figures, thousands separators, aligned decimals. `1,368` not `1368`.
6. **Nothing is authoritative by default.** §5.6.

### 5.5 Citation into notes

`Ctrl+Shift+V` (or a row button) inserts the active finding at the cursor of whichever pane holds the active-editor slot, `mediaBus`'s registry mechanism, reused. Serialization follows the established directive form so notes stay portable Markdown outside Studio:

```
::: qcvalue {ref="33:33" system="abjad_standard" mode="simplified29" value="1368"} :::
```

A `QuranCodeFinding` Tiptap node renders it, recomputes on load, and **flags a mismatch loudly** if the stored value no longer reproduces, a note that silently drifts from its own data is worse than no note. This answers the superseded plan's open question about `/qcvalue`: yes, and the recompute-and-verify behaviour is the reason it is worth doing rather than pasting a number.

### 5.6 Provenance is a feature

Every number rendered anywhere in this module is accompanied by, or one hover from, its `text_mode`, `value_system`, `scope`, and modifier set. `ProvenanceChip` exists to make the lazy path the correct one.

Where a mode has a `known_gaps` entry touching the letters in play: today, alif under `khalifa_appendix1`, the readout marks the figure **unverified** and links to what is unresolved. That is the honest state of the data as measured in §0.3, and a tool that hid it would be producing confident numbers it cannot stand behind.

---

## 6. Feature mapping

`Model/Enums.cs`, `Features.txt` and the Statistics-header screenshot give the authoritative surface. Tiers: **A** = 9a–9e, **B** = 9f–9g, **C** = deferred with a reason.

| QuranCode | maps to | tier |
|---|---|---|
| Chapter / Verse / Word / Letter nav | `ScopeBar` | A |
| `SelectionScope`: Page, Station, Part, Group, Quarter, Bowing | `ScopeBar` scope picker | **B**: needs division metadata (§0.4) |
| `FindType.Text`: Exact, Proximity | `TextQueryPanel` → `qc_find_text` | A |
| `FindByTextSearchType.Root`, related words (F5 / Ctrl+Click) | `RootQueryPanel`, `qc_root_words`; **data now in hand**, 1,782 roots, zero words uncovered | **A** |
| Word meaning and transliteration on hover | `WordHoverCard` → `qc_word_info`; **data now in hand** | **A** |
| `FindByTextLocation` / `Wordness` | position + wordness controls | A |
| `FindType.Numbers` | `NumberQueryPanel` → `qc_count`, `qc_find_by_number` | A |
| `FindType.Similarity`: all four methods | `SimilarityQueryPanel`, Levenshtein | A |
| `FindType.Frequency`, ± duplicate letters | `FrequencyQueryPanel` | A |
| `FindType.Revelation`: Makkah/Medina | scope filter; `revelation_order` already in the chapters CSV | A |
| Value systems + 19 modifiers | `ValueCalculator` → `qc_compute_value` | A |
| Per-mark "counts as letter" checkboxes | `MarkToggleRow`, driven by `text_modes.json` toggles | A |
| `base < 10 >` radix and `÷ < 19 >` divisor controls in the Statistics header | `ReadoutPane` header | A |
| Statistics panel | `ReadoutPane` / `CountBlock` | A |
| Letter Frequency table | `LetterFrequencyTable` | A |
| Digital root, digit sum, primality | in `qc_compute_value`'s return | A |
| Radix bases 2–36 | `qc_radix` | B |
| Text modes: Simplified29 / Appendix-1 | `text_modes.json` | A |
| Simplified30, WawSimplified29, ShaddasSimplified29 | additional mode entries | B |
| Translations (15 already in the source) | translation picker in `VerseBrowser` | B |
| Subtitles, footnotes | `VerseBrowser` | B |
| Bookmarks / notes on verses | the archive is already the note system: a wiki-link, not a new store | B |
| Grammar Edition: word-part segmentation | **derived at build time**, 98.84% aligned from roots alone (§2.7) | **A** |
| Grammar Edition: POS, lemma, case, mood | optional Quranic Arabic Corpus import; no counting feature needs it | **C** |
| `FindType.Prostration`, `ProstrationType` | dropped: no prostration list, and none wanted | — |
| Symmetry / DNA / CVWL / C+V / Distances tabs | — | **C**: undocumented methods; needs a spec before a UI |
| Value drawings (squares, golden ratios, spirals) | — | **C**: decorative; and `CanvasView` is the natural host if wanted |
| Recitation audio, MP3 player, WAVMaker | — | **C**: Media Notes already owns playback; no offline recitation asset |
| Page images (tajweed scans) | — | **C**: asset set not in the repo |
| ScriptRunner (end-user C# over the object model) | — | **C**: arbitrary code execution in a Tauri app; no |
| Auto-download translations/recitations from tanzil.net | — | **C**: violates the offline charter outright |

Tier C is not a backlog. Each line has a reason, in the same spirit as CONTEXT.md's "Not done in this pass" sections.

**Four rows moved up in this revision.** Root search, related-words lookup and word-gloss-on-hover were tier C on licence grounds; the words CSV supplies all three outright, so they are tier A. Word-part segmentation went C to A because it turned out to be derivable from the roots we already have (§2.7). Only the grammatical *tagging* stays tier C, and nothing in the counting engine depends on it.

---

## 7. Phasing

Each phase lands with tests green and `verify:qurancode` passing.

**9a, Data pipeline. ✅ SHIPPED.**
[`scripts/generate/build_qurancode_index.mjs`](../scripts/generate/build_qurancode_index.mjs) over the words CSV plus the verse CSV, with the folds and the segmentation algorithm in [`scripts/lib/qurancode-text.mjs`](../scripts/lib/qurancode-text.mjs) because the Rust side reimplements the same rules. `npm run generate:qurancode` and `npm run verify:qurancode`, the latter wired into `verify:deploy`.

Emits into `studio/src-tauri/assets/qurancode/`, 7.9 MB: `words.tsv`, `verses.tsv`, `chapters.tsv`, `roots.tsv`, `segments.tsv`, `text_modes.json`, `fixtures.json`, `CREDITS.md`, and `value_systems/{abjad_standard,counts_only}.json`.

**Two departures from the plan as written, both deliberate.**

- **No `letters.bin`.** The fold depends on the active text mode *and* the user's mark toggles, both of which are runtime state, so a prebuilt letter index would have to be rebuilt the moment a checkbox moved. Rust builds it per mode behind a `OnceLock`, the way `quran.rs` already indexes the bundled CSV. Emitting a binary blob from a JS generator and parsing it in Rust would have been a format contract bought for nothing.
- **Primalogy is out of scope, and the earlier reason for that was wrong.** This plan previously said the table was not reproducible from the published description. It is: QuranCode generates it as `Simplified29_Alphabet_Primes`, the 29 letters in alphabet order valued at the primes including 1 (`ء`=1, `ا`=2, `ب`=3, `ت`=5 … `ي`=107), and the table ships in that repo's `Server/Values/Offline/` under GPL-3.0. It is excluded because the module's subject is Code 19 arithmetic over counts and classical gematria, not prime valuation. `abjad_standard`, `abjad_maghribi` and `counts_only` ship.

The generator **refuses to write** on any failed invariant rather than emitting a degraded dataset, and `--check` fails CI on file drift as well as on fixture drift.
*Accepted:* **31 fixtures verified, 7 known gaps.** Al-Fatiha 7 / 29 / 139. Corpus 114 / 6,234 / 77,401 words / 325,273 letters / 29 distinct letters. ح+م = 2,147, ص = 152, ق = 114, ن = 133, ط = 28 and 27, س = 48, ه+ة = 175 and 251, ي in sura 19 = 343, all twelve lam and mim fixtures exact, الم grand total 19,874. 1,782 roots with 30 words uncovered, those being the initial-letter groups. Segmentation 98.84%, 76,472 of 77,371.

The seven gaps are the six alif counts and ي in sura 36 (241 computed against 237 published). Each is written into `fixtures.json` with its computed and published value, and into the mode's `known_gaps`, so the UI can refuse to present an affected figure as authoritative.

**9b, Rust backend, counting. ✅ SHIPPED.**
[`src-tauri/src/qurancode.rs`](src-tauri/src/qurancode.rs), ~1,200 lines including tests, registered in `lib.rs` as `qc_metadata`, `qc_get_verse`, `qc_count` and `qc_letter_frequency`. App commands need no capability entry; only plugin permissions do.

**It reads the fold rules rather than restating them.** `text_modes.json` carries the per-mode fold tables, the toggle mappings, the always-drop set and the two structural codepoints, and the Rust side parses all of it. Nothing in the backend decides what a hamza is. Getting there needed two additions to 9a's output, because the JSON as first written was an incomplete contract: each toggle now carries the full `map` from governed codepoint to resulting letter, and `always_drop` plus `structural` are emitted instead of being restated in Rust.

**`qc_count` returns every countable mode in one call.** Because there is no single true letter count, comparison is the default view in the readout rather than something a researcher toggles between and has to remember.

**Scope note:** the phase was written as "counting only", but valuation came with it. The value systems were already bundled in 9a, an Abjad sum is an array read per letter, and without it 9c's readout would have had a permanently empty row. 9d keeps the substantial part: the 19 modifiers, the presets, the custom disclosure and user import.

*Accepted:* **48 Rust tests pass in both profiles.** Al-Fatiha 7/29/139 and the corpus 114 / 6,234 / 77,401 / 325,273 / 29 letters reproduce through the IPC path, not just the generator. Every published initial count reproduces: ح+م 2,147, ص 152, ق 114, ن 133, ط 28 and 27, س 48, ه+ة 175 and 251, and all twelve lam and mim figures with the الم grand total at 19,874. The Basmalah is 19 letters in both countable modes, excluded from corpus totals and included when scoped. Toggling hamza off drops 33:33 from 122 letters to 121; turning superscript alef on takes it to 126. Known gaps travel with the mode that has them. Whole-corpus count 13.1 ms release, inside the 16 ms bar.

**The chapter-9 inconsistency is gone**, and the fix removed a duplicated table rather than patching a number: `quran.rs` now reads verse counts from the generated chapter table through `qurancode::chapter_verse_count`, keeping its own list for names only. `search_verses("9:128")` says the sura has 127 verses in this numbering instead of "No verses found", and a test asserts the two tables agree for all 114 chapters.

**Two bugs found and fixed on the way.**

- **A gloss containing a literal newline split a TSV row in two**, so Rust loaded 77,400 words where the generator had written 77,401. The fix is at the writer, not the call site: every cell is flattened, and a width guard now makes a future one a build failure rather than an off-by-one that only shows up as a wrong total.
- **The first fold was 42 ms**, over the bar. See §2.3 for what it cost and what fixed it.

**9c, Surface shell. ✅ SHIPPED.**
`src/components/qurancode/` with `QuranCodeSurface`, `ScopeBar`, `VerseBrowser`, `ReadoutPane`, `ModeSelectors`, `MarkToggleRow`, `WordHoverCard`, `LetterFrequencyTable`, `ChapterList` and `ProvenanceChip`, plus `lib/quranCode.ts` (typed IPC) and `hooks/useQuranCode.ts`. Ribbon button under Media Notes, `Ctrl+Shift+K`, a `Research` shortcut category and a command-palette entry.

**The pseudo-file tab worked as designed.** `fileKindOf` gained one branch for the sentinel and `renderEditorPane` gained three lines; everything else — the tab strip, the history stack, the split button, per-archive pane sizes — came free. Verified in the running app: the tab opens labelled *QuranCode*, the ribbon button takes its active state, and the split control is available beside it.

**Two things the hook has to get right and does.** Requests carry a token so a fast toggle flip during a corpus count cannot paint the stale reply over the fresh one. And the mode selectors sit in the query pane's footer rather than in Settings, because §0.3 makes the mode part of every question rather than a preference.

*Accepted:* opens as a tab, splits against a note, layout persists under its own `autoSaveId`, every displayed number carries provenance, and no `--ed-*` token was added. In a browser preview the pane explains that the corpus is compiled into the Rust binary and names `npm run tauri dev`, rather than failing blank.

**Not done in this pass:** the verse embed still reads the old bundled CSV. Migrating it is a separate change with its own regression surface (the `/quran` slash command and every existing note that uses it), and folding it into the surface's first landing would have made both harder to review.

**9d, Value systems. ✅ SHIPPED.**
`qc_compute_value` walks the scope in reading order tracking each letter's index inside its word, verse and chapter and in the corpus, and adds whichever of those the active modifiers ask for. `ValueCalculator` renders the result with presets first and the matrix behind a disclosure.

**Fourteen modifiers, not nineteen, and the difference is stated rather than padded.** Four levels, each contributing an absolute index, an index within each larger container, and a distance. The remaining five in the original are keyed to the page, station, part, group, quarter and bowing divisions, which arrive with 9g's metadata and will slot in as more fields on the same struct.

**Absolute indices are only paid for when asked.** They need a corpus-wide fold, which depends on the mode and toggles and so cannot be baked into the generated data. The engine computes them on demand and skips the work entirely when no modifier needs them; a no-modifier value takes a fast path that avoids the branch chain altogether.

*Accepted:* a bare value agrees with `qc_count` for the same scope, which is the property that keeps the two engines honest. Each modifier's contribution is asserted exactly — `letter_number_in_word` adds each word's triangular number, `chapter_number` adds the chapter once per letter. The breakdown is capped at 400 rows so a corpus request cannot return 325,273. The active modifier set travels in the result and into any copied figure.

**Primalogy is out of scope**, for the reason restated in 9a. `abjad_standard`, `abjad_maghribi` and `counts_only` ship.

**9e, Search. ✅ SHIPPED.**
`qc_find_text` (exact, proximity, root, with location and wordness filters and `-`/`+` term sigils), `qc_similarity` (Levenshtein, four methods), `qc_find_by_number`, `qc_word_info` and `qc_roots`. Frontend: `QueryPane` with four tabs and a windowed `ResultsList`.

**Everything a query compares against is the folded stream, not the pointed text.** A search therefore obeys the active text mode exactly as a count does: typing a bare alef where the mushaf has an alef wasla still lands under Simplified 29, because both fold to alef. Searching for a hamza with the hamza toggle off correctly finds nothing, because that letter is not in the corpus being counted.

**Similarity prefilters on length.** A verse whose length differs from the source by more than the threshold allows cannot score above it, so the expensive comparison is skipped before it starts.

*Accepted:* an exact search returns the matching word positions, not just the verse. Excluding a term with `-` cannot widen a result. A root search on ط ه ر returns the family including 33:33. Ar-Rahman's repeated refrain scores 1.0 and sorts first, and the source verse is excluded from its own results. `find_by_number` on 122 letters returns 33:33 and every hit actually has 122 letters. Results are capped and say so. Ctrl+Click on any word loads its root into the query.

**9f, Citation. ✅ SHIPPED.**
`lib/quranCodeDirective.ts` (the format), `lib/quranCodeBus.ts` (the plumbing), `extensions/QuranCodeFinding.tsx` (the node), `Ctrl+Shift+V`, and CSV export through the dialog plugin the archive picker already uses.

**The node recomputes on load and says when the answer has changed.** That is the whole reason for a node rather than a pasted number: a figure keeps its authority long after the thing that produced it stopped agreeing, and a note that silently drifts from its own data is worse than no note. A drifted finding shows both values and takes a danger border.

**The directive module has no imports at all.** It is the contract a note carries into other editors, so it must not depend on Tauri or TipTap — and that also makes it testable outside the desktop build, which is where its eight tests live (`tests/unit/qurancode-directive.test.ts`).

**No second editor registry.** The bus reuses the active-editor slot `mediaBus` already maintains, because there is only one answer to "which editor is live". When no pane is editable the figure goes to the clipboard as prose rather than vanishing.

*Accepted:* the directive round-trips byte for byte, optional attributes are omitted when empty, the unverified flag survives, a quote injected into a value cannot break out of the directive, and a stale value is flagged on load.

**Not done in this pass:** translations, subtitles and footnotes in the verse browser. The English is there; the other fourteen languages and the per-verse sidecars are a `verses.tsv` column change plus a picker, and they belong with the reader work rather than with citation.

**9g, Extended modes. OUTSTANDING, and data-gated.** Simplified30 and the Waw/Shadda modes are `text_modes.json` entries and could land today; the division metadata (page, station, part, group, quarter, bowing) has to be imported from `quran-metadata.txt` first, and it gates both the five remaining scopes and the five remaining value modifiers. Radix conversion and live value-system editing are small and independent.

Word-part segmentation is not here: it is generated data, so it landed in 9a and has been queryable since 9b.

The alif calibration (§8 Q4) is independent of the phase order and can land in any of them; the fixtures are already written to accept it.

---

## 8. Open decisions

**Q1, licence. Settled.** Studio goes open source under a GPL-compatible licence (§0.5). QuranCode's data files are ingestible and its algorithms are readable. Root search no longer needs a decision, because the words CSV supplies the roots anyway; morphology becomes ordinary scheduled work.

**Q2, which Uthmani orthography is canonical? Settled: the words CSV.** The words CSV and `ws_quran_text_rows.csv` disagree by 261 letters over the corpus, because one carries superscript alef on a tatweel and the other does not (§0.2). It tokenizes words correctly (`37:130:3`), carries the roots and glosses, and reproduces Al-Fatiha at 7/29/139. The verse CSV stays for translations and footnotes only, and the generator asserts the two agree on chapter, verse and word counts even where they differ on glyphs.

**Q3, which mode is default?** `simplified29` is verified end to end. `khalifa_appendix1` matches the figures researchers here will actually cite, and has three open gaps (§0.3). Recommendation: **default `simplified29`**, with Appendix-1 always shown beside it in the readout. Comparison as the default view makes the choice low-stakes.

**Q4, populate `alif_overrides`.** No longer a research question. The rule is per word: a hamza that reads as an alif in one word reads as one in every occurrence of that word and its derivatives (§0.3). The table needs roughly 39% of a 2,907-occurrence hamza pool to resolve to alif across the six الم suras, spanning 948 distinct forms there and 3,749 corpus-wide. The cheapest way to populate it is a word-by-word diff of QuranCode's own Simplified29 letter stream against ours. The sura-30 lam discrepancy is already resolved and the ya residual in sura 36 is four letters, so alif is the only one left. **Not blocking**; 9a shipped with the gaps encoded rather than hidden.

**Q5, is `qc_*` reachable from the editor without the surface?** A `/qcvalue 1:1 abjad_standard` slash command is a natural extension of the existing directive machinery. Recommendation: **not before 9f.** The surface has to teach what a value *is* before a slash command can be used responsibly.

---

## 9. What this plan changes from its predecessors

| superseded plan | this plan | why |
|---|---|---|
| build on the bundled `quran.csv` | that file cannot support counting at all: double-counted Basmalah, no diacritics. The word-level Uthmani CSV is primary; `ws_quran_text_rows.csv` is secondary | measured, §0.1, §0.2 |
| `rusqlite` "worth the added dependency" | no SQLite; flat in-memory indexes | 325 k letters, predicate scans, and it would be the only native C dep in the tree, §3.1 |
| counting conventions unexamined | `text_mode` **and its per-mark toggles** are a first-class switchable axis. Simplified29 verified end to end; the published-figures mode verified on 27 of 31 fixtures with three recorded gaps | §0.3, the central finding |
| "own `WorkspaceLayout`-style arrangement", entered via palette or sidebar icon | a pseudo-file **tab**, so split-view against a note, tabs, history and layout persistence come free | §1.2 |
| 19 variables as a control surface | presets first, raw matrix behind disclosure | ~500 k combinations with no meaningfulness signal, §4.2 |
| root search, gloss and related-words deferred on licence grounds | **tier A.** The words CSV carries 1,782 roots with zero words uncovered, plus a gloss and transliteration per word | §0.4 |
| licence an open blocking question | settled: open source, GPL-compatible. Morphology becomes scheduled work, and QuranCode's algorithms are readable | §0.5 |
| verses excluded "kept as rows, never deleted" | **reversed.** 9:128–129 are absent from both datasets and stay absent. No seed text, no `excluded` status, nothing to accidentally count back in | §2.4 |
| segmentation planned, unmeasured | **shipped.** 76,472 of 77,371 rooted words aligned, 156 prefix and 198 suffix forms emitted as data | §2.7 |
| `letters.bin` in the generator's output | **dropped.** The fold depends on runtime toggle state, so the index has to be built after those are known. Folding on demand measures 13.1 ms for a whole-corpus count over both modes | §2.3 |
| `quran.rs` keeping its own verse counts | **one table.** Verse counts come from the generated chapter data; `quran.rs` keeps its list for names only, and a test asserts they agree | §7, 9b |
| 1,790 distinct roots | **1,782.** The higher figure was an artifact of not trimming: six roots carry inconsistent whitespace and the filler rows add a literal `-` | §0.2 |
| alif gap open-ended | **characterised.** The rule is per word, not per class, which is why no toggle subset fitted. `alif_overrides` is the hook and the table is sized | §0.3 |
| initial counts assumed to be over canonical verses | initial counts **include the sura's unnumbered Basmalah**. Found from the data: lam was short by exactly 4 and mim by exactly 3 in all six الم suras, which is precisely one Basmalah | §0.3 |
| morphology an external GPL import | **derived.** Root-anchored segmentation aligns 98.84% of rooted words from the roots we already have, yielding 156 prefix and 198 suffix forms as data | §2.7 |
| prostration filtering listed as tier B | **dropped.** No prostration list, and none wanted | §0.4 |
| — | provenance on every number; `known_gaps` surfaced in the UI | a numeric research tool that hides its conventions produces unfalsifiable claims, §5.6 |
