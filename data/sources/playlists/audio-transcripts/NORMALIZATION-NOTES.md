# Quran Study Transcripts (1–52) — Normalization Tracking

Running list of everything found while analyzing the 52 Quran Study audio
transcript CSVs against the target video-player display. Nothing in this
file has been applied to the data yet — this is the audit only. Update
this file as items get resolved or as new findings turn up.

Scope for the actual CSV normalization: `01 - ...csv` through `52 - ...csv`
in this folder. For **sourcing full names**, the search net is now the
whole repository plus the live web (see "Search scope" at the end of
Section 1) — that's a separate, wider net than the 52-file normalization
target itself.

---

## 1. Speaker full names

### Confirmed — use these when the name is brought up

| Short label(s) in CSV | Canonical full name | Evidence |
|---|---|---|
| `Dr. Sabahi` | **Dr. Mahmoud Sabahi** | Self-attributed: Speaker=`Dr. Sabahi`, Text=*"Mahmoud Sabahi: I have a question."* (x8). The `33 - ... Masud Sabahi ...csv` **filename is wrong** — it's Mahmoud, not Masud. |
| `Apamea` | **Apamea Bashar** | *"our teacher is Apamea Bashar"* |
| `Feroz` | **Feroz Karmally** | See below — corrected spelling. |
| `Farhad` | **Farhad Mo'ini** | Named directly, birthday mentioned across two files |
| `Ihsan` | **Ihsan Ramadan** | Confirmed independently in both transcripts and a 1986 newsletter |
| `Linda` | **Linda Baroni** | *"Linda Baroni is gonna give the Quranic study next"* — matches the "by Linda" credit on transcript 52 |
| `Gatut` | **Gatut Adisoma** | Confirmed independently in transcripts and a 1988 newsletter |
| `Shakira` (492 rows) | **Shakira Karipineni** | `sp-html/1990/feb/page2.html` — not findable in the transcripts themselves |
| `Parivash` (427 rows) | **Parivash Ettefagh** | `sp-html/1986/nov/page3.html` — not findable in the transcripts themselves |

**Explicitly not normalizing:** `Ahmad`/`Ahmed` (Rayan) — per instruction, too common a name to force onto one canonical spelling.

### ⚠️ Correction: Feroz's surname is "Karmally," not "Kermali"

Per your rule — **transcription is the interpretation of what the audio sounds like; the written form tells us how it's actually spelled** — the written sources settle this:

- Submitters Perspective newsletters (1986 Jul, 1989 Mar, 1989 Jul): **"Feroz Karmally"** — 3 independent hits, zero for "Kermali."
- The Quran 1989 translation's own text: **"Feroz Karmally"** (credited for a mathematical discovery).
- Transcripts themselves split 4-to-1 in favor of "Karmally" too (files 05, 21, 31, 34 vs. file 18's one "Kermali").

**Corrected: Feroz Karmally.** Updated in the confirmed table above.

### ⚠️ Correction: not every "Mahmoud" is Sabahi

Caught in file 18 specifically — Dr. Khalifa says: *"And Mahmoud Abib, and Abdullah Erik, and Ismail Barakat, and Feroz Kermali, and Gatut were coming with information."* ... *"Do you hear anything from Mahmoud or Abdullah? No."* That second "Mahmoud" is clearly referring back to **Mahmoud Abib**, not Mahmoud Sabahi.

There are two distinct Mahmouds in this community:
- **Mahmoud Sabahi**, mapped only from the `Dr. Sabahi` speaker label (self-attributed, solid).
- **Mahmoud Abib**, already its own separate, correctly-labeled speaker (133 rows) — a recurring early contributor/researcher, distinct person.

The generic bare `Mahmoud` speaker label (38 rows, separate from both of the above) should **not** be auto-mapped to either — context has to be checked per occurrence, since Dr. Khalifa uses "Mahmoud" alone to refer to either person depending on context.

### Medium confidence — named once, plausible but not self-confirmed

- **Robert** → *"Robert Nadib sat at the university... and delivered the message"* — third-person, not self-ID. This is still the only real candidate after the wider search (see traps below for look-alikes that turned out to be false).
- **Zari** → *"Zari's son, Zari Ibrahimi"* — reads as her **son's** name, not necessarily her own surname. Don't apply without more evidence.
- **Saeed** → *"Saeed Talari"* — confirmed independently in two newsletters (1988, 1990), fairly solid.
- **Abdullah** → *"Abdullah Arik"* / *"Abdullah Erik"* (spelling varies across files) — always in the same recurring list of early information-bringers, never self-attributed.

### Traps — do not merge these

- **"Beth Khalifa"** — hypothetical illustrative name in a soul/jinn teaching example, not the actual recurring speaker "Beth."
- **"David Dixon"** / **"David Flynn"** — two different sermon illustrations. Neither confirmed as the recurring speaker "David."
- **"Muhammad Rasulallah"** — the Prophet's honorific, unrelated to speaker "Muhammad."
- **"Barbara Bush"** — the historical/political figure, unrelated to speaker "Barbara."
- **"Ali Fazeli"** (also "Fazely," matches "Fazeli argues" from the thumbnails) and **"Ali Izadi"** are both real, distinct people — neither confirmed as *the* generic "Ali" speaker label (111 rows). Possibly more than one Ali merged under that label.
- **"Theodore Robert Bundy"** — yes, that Bundy. Appears 9 times in the Quran 1989 translation's own appendix as a gematria/19-code illustration (his full name has 19 letters). Completely unrelated to the transcripts' recurring "Robert" — a red herring the wider search surfaced.
- **"Robert Schuller"** — a televangelist, named in a list with Billy Graham/Pat Robertson/Jerry Falwell in a video transcript. Unrelated.
- **"Robert Seely"** — "director of research for Anheuser-Busch" in an anecdote in a Friday Sermon video transcript. Unrelated.

### Recurring major speakers with zero full-name evidence anywhere, after the full search

**Hamid** (407 rows), **Behrouz** (487 rows), **Atif** (291 rows), **Lori** (309 rows), **Donna** (203 rows), **Laurie** (183 rows), **Naghmeh** (276 rows). Zero hits across the entire local repository and reasonable web searches (see scope below). If full names are wanted for these, they aren't recoverable from anything currently on hand.

Also unresolved, but not from lack of trying: **which Ali** (Fazeli or Izadi or neither), **which Susan** ("Susan Ray" vs. "Susan Erisen" — the file-47 book-acknowledgments passage names Erisen; a direct exchange in file 09 has Dr. Khalifa call out "Susan Ray?" and get a reply — could be two different Susans, or the same person known both ways).

### Other names confirmed but not on your "certain" list (available if wanted)

**Douglas Brown** (self-stated twice: *"Douglas: It's Douglas. Douglas Brown."*), **Edip Yuksel**, **Keikhosrow Emami**, **Susan Ray**. Plus, from Dr. Khalifa reading a book's printed acknowledgments aloud in file 47: **Lisa Spray**, **Lydia Kelly**, **Susan Erisen**, **Emily Sterling** (none of these four are otherwise-recurring transcript speakers, for context).

### Search scope (for the name-sourcing effort specifically)

Searched, in full:
- All 52 Quran Study transcripts (this folder, files 1–52).
- 233 Submitters Perspective / Muslim Perspective newsletter pages (`data/sources/sp-html/`, 1985–1990).
- 12 book JSON files (`data/sources/books/`) — includes *Quran, Hadith, and Islam*, *The Contact Prayers*, etc.
- The Quran translation itself — both the 1989 complete JSON and the footnote/subheading/verse-index CSVs (`data/sources/quran/`).
- 53 video-transcript CSVs, a separate playlist (`data/sources/playlists/video-transcripts/`).
- 50 other audio-transcript CSVs outside the 1–52 range — Messenger Audio files, Friday Sermons, Zikr recordings (`data/sources/playlists/audio-transcripts/`, files 53–99+).
- Live web: `masjidtucson.org` (site navigation, newsletter archive going up through the 2020s — only 1985–1990 is scraped locally), `thesubmitters.org/masjid-tucson/`, and general searches pairing each unresolved name with "Rashad Khalifa"/Tucson/submitters. No hits for Hamid, Behrouz, Atif, Lori, Donna, Laurie, or Naghmeh anywhere.

360 total local documents searched, plus the web attempts above.

---

## 2. Terminology normalization — decisions locked in

| Term | Decision | Note |
|---|---|---|
| Al-Fatiha vs. Al-Fatehah/Al-Fateha | **Al-Fatiha** | Matches written-source usage well: 36 hits for "Al-Fatiha" vs. 1 for "Al-Fatehah" across newsletters+books. |
| Sura vs. Surah | **Surah** | ⚠️ Written sources actually lean the other way — "Sura" appears far more often even in the newsletters/books (853 vs. 14) and in the transcripts (1,034 vs. 5). Noting the discrepancy for the record; going with your call. |
| Quran vs. Qur'an vs. Koran | **Quran** | Dominant everywhere (2,071 vs. 1 vs. 2 in transcripts; 2,629 vs. 1,039 vs. — in written sources, where "Qur'an" is actually a lot more common than in the transcripts, but Quran still leads). |
| Rasulallah vs. Rasulullah | **Rasulallah** | ⚠️ Same caveat as Sura/Surah — written sources lean the other way here too (Rasulullah: 7, Rasulallah: 0, in newsletters+books), and transcripts split 24-to-14 in favor of Rasulullah. Noting the discrepancy; going with your call. |
| GOD vs. God capitalization | **Keep the distinction, do not normalize** | 97% of all-caps "GOD" falls inside `[chapter:verse]`-cited rows — it's Khalifa's own translation convention for direct Quranic quotation, not an inconsistency. |

### 🔴 Still the highest-priority mechanical fix: `ã` → `ā` encoding corruption

**`ã` (U+00E3) is standing in for `ā` (macron-a) throughout the corpus** — confirmed by checking actual Unicode codepoints, not just how it renders. Affects **50 of 52 files**, 64 distinct word forms, ~830+ occurrences: `Al-Fãtehah`→`Al-Fātehah` (becomes `Al-Fatihah` once the Fatiha-spelling decision above is also applied), `Mã Shã Allãh`→`Mā Shā Allāh`, `Sal[?]mun`→`Salāmun`, `Bar[?]'ah`→`Barā'ah`, `S[?]leh`→`Sāleh`, `M[?]lek`→`Mālek` (the angel Malek), `El[?]ha`→`Elāha`, `H[?]m[?]n`→`Hāmān`. Safe to bulk-replace globally — no legitimate non-corrupted use of ã found anywhere.

### Zikr, Salat, Zakat — no issue found
Each appears in exactly one spelling throughout (Zikr: 43, Salat: 136, Zakat: 107 — no variants of any of these turned up).

### Non-English script content — not corruption, real content
13 rows in file 37 contain Devanagari, Katakana, and a couple of CJK characters — genuine content, not garbage. Dr. Khalifa and Shakira are comparing words for "cup"/"book"/"world" across Japanese, Hindi, and Arabic in that session. Needs font support beyond just Arabic if the display is going to render it, but nothing to fix in the text.

---

## 3. Structural / data-normalization issues

### Metadata repeated per row
Confirmed: Video Title and Link are constant across every row within a file, never conflicting. Clean candidate for a header/sidecar split.

### Date in filename
Most titles end in a date fragment, but not all — some sessions (file 14 "Night of Destiny Zikr," file 41) have no date anywhere. Needs a nullable date field, not a guaranteed one.

### Video title truncation
The **internal `Video Title` CSV column is truncated identically to the filename** (e.g. file 04's title cell literally ends `"...Sura 3;118 129 By S"`). The true full title was already lost before the CSV was written — recovering it would require going back to the actual YouTube video via the Link column.

### Description field
Doesn't exist anywhere in the source — pure editorial content that has to be authored per video.

### Speaker normalization
86 distinct raw labels total across the 52 files. See Section 1 for what's resolved and what isn't.

### Embedded multi-line / multi-speaker cells (the biggest structural issue)
**17,091 of 46,047 rows (37%) contain an embedded `\r\n` inside the Text cell.** Two different problems disguised as one:
1. **Soft-wrap artifacts** — a single speaker's sentence broken mid-thought with a stray `\xa0\r\n`. Mechanical fix: collapse to a single space.
2. **Genuinely different speakers concatenated into one row under one Speaker label** — e.g. Speaker=`Dr. Khalifa`, Text=`"Dr. Khalifa: No.\r\nCatherine: No, absolutely not."` Distinguishing rule: if a wrapped line starts with `KnownSpeaker: `, split it into a separate row with corrected attribution; otherwise it's just a wrap and gets rejoined.

### Time format
HH:MM:SS.mmm throughout. Longest file runs to 1:32:38 — any display format needs to handle hours conditionally, not assume everything fits in MM:SS.

### Verse references — two different formats
- English citations: `[72:19]  text...` — bracket, leading, already isolated one-verse-per-row in the source. Clean.
- Arabic citations: `...phrase... (67:8)` — parenthetical, trailing. Different pattern, needs separate handling.

### Arabic flagging
Straightforward — Unicode range detection works reliably. 50/52 files contain Arabic script, no false positives.

### Empty speaker field
5 rows total across the corpus have a completely empty Speaker value.

### Thumbnails
Confirmed via pixel sampling: all 52 thumbnail images share one exact background color and one serif typeface, with only text differing. CSS + real text beats 52 image assets. (See `thumbnail-text.md` next to the thumbnails folder for the verbatim per-image text already extracted.)

### The TOC / condensed-entry structural gap
The CSV is flat, ~885 caption-rows/video, each 1–5 seconds. The target HTML display has three layers nothing in the CSV produces on its own: a synthesized **Table of Contents** (~20 topic headings/video), **condensed transcript entries** (several consecutive rows grouped into one paragraph per timestamp), and the **description** paragraph. None of this is CSV normalization — it's content curation on top of normalized data. Still an open decision: hand-authored, algorithmic, or an LLM pass with human review.

---

## 4. Status

Speaker names: 9 confirmed, 2 corrected (Feroz's spelling, the Mahmoud/Sabahi/Abib mixup), several traps identified, 7 major speakers confirmed unrecoverable after an exhaustive search. Terminology: 5 decisions locked in, 2 with a noted discrepancy against written-source frequency. Structural issues: fully catalogued, nothing applied yet. Once this is reviewed, next step is the actual normalization pass.
