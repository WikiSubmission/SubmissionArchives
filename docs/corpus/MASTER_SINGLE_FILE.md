# AskArchives Complete Corpus

This package combines the hand-transcribed spoken archive with the written works and the selected final 1992 Quran edition.

## Corpus contents

### Spoken corpus

- 122 canonical transcript CSV files
- 121 recording-level source groups
- Video, audio, and one parallel debate transcript track
- Draft section enrichment and retrieval evaluation files where available

### Written corpus

- 11 page-by-page transcribed written works
- 1,295 written pages
- 1973 through 1983 publications, plus an undated ritual booklet
- Exact page transcription indexes and exact-text retrieval chunks

### Three Quran editions

- 1981 `Quran: The Final Scripture`
- 1989 `Quran: The Final Testament`, with Arabic
- 1992 final authorized English edition

The 1981 and 1989 editions are historical layers for studying translation, subtitle, footnote, appendix, and canon development. The 1992 English text remains the final-edition authority.

## Begin with

1. `guides/01_MASTER_GUIDE.md`
2. `guides/02_WRITTEN_GUIDE.md`
3. `guides/03_SOURCE_HIERARCHY.md`
4. `guides/04_CHRONOLOGY.md`
5. `guides/05_RAG_ARCHITECTURE.md`
6. `guides/06_SURA9_128_129.md`
7. `guides/07_QURAN_EDITION_EVOLUTION.md`

## Canonical evidence

- Spoken evidence comes from the original transcript CSV text.
- Written evidence comes from the exact page `transcription_text` with its PDF page.
- Final Quran wording comes from the English fields in the 1992 CSV files.
- Generated guides, summaries, concepts, and questions are navigation metadata.


---

# Master Guide: What the Combined Corpus Shows

## The written works materially change the archive

The spoken corpus showed how the movement developed through lectures, study sessions, objections, corrections, and community discussion.

The written corpus now shows which ideas were formally published, how they were organized for readers, and which positions became stable enough to appear in books, booklets, journals, or the final Quran edition.

The two corpora should remain connected but distinct.

## A sharper developmental sequence

### 1973: numerical research comes first

`Miracle of the Quran: Significance of the Mysterious Alphabets` represents the earliest major publication in this collection. The project begins as a study of the Quranic initials and their letter frequencies.

At this stage, the numerical research precedes the later integrated system of Quran alone, the Messenger of the Covenant, ritual reform, and the pure Quran.

### 1974–1975: Rashad remains inside a broad Islamic intellectual network

The three `ISLAM` journal issues are especially valuable because they place Rashad among a large international editorial network and alongside many other contributors.

They must not be treated as books authored entirely by Rashad.

The separate `English Meanings of the Quran` installment shows an early translation stage. It is historically important but does not represent the final wording of his Quran translation.

### Mid-1970s to 1982: the numerical discovery becomes a public proof system

`The Perpetual Miracle of Muhammad`, `The Computer Speaks`, and `Quran: Visual Presentation of the Miracle` turn the numerical study into a public apologetic system.

The works overlap, though each serves a different function:

- concise public demonstration
- large numerical compilation
- visual and tabular presentation

They belong to one developing evidence family and should not be counted as three independent discoveries.

### 1982: Quran alone becomes a formal published doctrine

`Quran, Hadith, and Islam` is one of the most important written works in the corpus.

The audio sermons show the argument being discussed. This book presents it as an organized official position.

For questions about the movement's published 1982 Quran-alone doctrine, the book should normally outrank an informal discussion.

### 1983: theology enters a creative narrative form

`ETERNITY` is evidence of themes, imagination, and public presentation. It is a screenplay, so its fictional characters and dialogue cannot automatically be treated as formal rulings.

### Ritual codification

`The Contact Prayers` gives a dedicated step-by-step procedure. It should receive procedural priority over casual answers in general studies.

### 1992: the final edition becomes the apex source

The selected 1992 Quran is the highest-priority source for:

- Rashad's final English verse wording
- chapter titles
- verse subtitles
- footnote commentary

The 1974 translation installment remains useful for development. It does not compete with the final edition for final-position questions.

The 1981 and 1989 editions are now included as historical translation layers. The archive can therefore trace changes from the 1981 `Final Scripture`, through the 1989 `Final Testament`, to the 1992 final edition. The most conspicuous canon change is visible directly: 9:128–129 appear in the 1981 main text, are removed and rejected in 1989, and remain absent in 1992.

## Overall conclusion

The combined corpus now supports three different kinds of research:

1. **Final doctrine** through the 1992 Quran and dedicated published works.
2. **Historical development** through the 1973–1983 written sequence and dated spoken archive.
3. **Community process** through the audio discussions, disagreements, corrections, and personal interpretations.

The most reliable AskArchives answer will often use all three layers:

- final wording
- earlier development
- spoken explanation or disagreement


---

# Written Corpus Guide

## Document inventory

| ID | Date | Work | Genre | Pages | Role |
|---|---|---|---|---:|---|
| W01 | 1973 | Miracle of the Quran: Significance of the Mysterious Alphabets | research monograph | 216 | earliest major numerical-code publication |
| W02 | 1974-04 | ISLAM, Volume 1, Number 1 | multi-author journal issue | 90 | early institutional and intellectual context |
| W03 | 1974-07 | ISLAM, Volume 1, Number 2 | multi-author journal issue | 92 | early institutional and intellectual context |
| W04 | 1975-01 | ISLAM, Volume 1, Numbers 3 and 4 | multi-author journal issue | 139 | early institutional and intellectual context |
| W05 | 1974 | English Meanings of the Quran | early Quran translation installment | 16 | historical translation development |
| W06 | undated | The Perpetual Miracle of Muhammad | lecture booklet or presentation text | 16 | concise public presentation of the numerical miracle |
| W07 | 1981 | The Computer Speaks: God's Message to the World | numerical research compilation | 280 | large data-rich presentation of the Quranic code |
| W08 | 1982 | Quran, Hadith, and Islam | doctrinal monograph | 92 | formal published Quran-alone argument |
| W09 | 1982 | Quran: Visual Presentation of the Miracle | visual numerical research monograph | 252 | published visual presentation of Code 19 evidence |
| W10 | 1983 | ETERNITY | screenplay | 94 | creative narrative expression of theological themes |
| W11 | undated | The Contact Prayers | ritual instruction booklet | 8 | dedicated published Salat procedure |

## Critical handling rules

- The three `ISLAM` issues are mixed-author journals.
- The 1974 `English Meanings` installment is historical and is superseded by the 1992 final edition.
- Numerical books overlap heavily and belong to a developing evidence family.
- `ETERNITY` is creative writing.
- `The Contact Prayers` is a dedicated procedural source.
- Low-confidence OCR pages require visual review before exact quotation.
- Page JSON files retain raw OCR, layout data, Arabic segments, and coordinates where available.

## Ingestion files

- `data/written_pages.jsonl` contains one canonical transcription record per page.
- `data/written_chunks.jsonl` contains mechanical exact-text chunks for retrieval.
- Neither file contains generated paraphrases in the canonical text field.

---

# Source Hierarchy

## Final Quran questions

Use the 1992 English edition first.

A response about the final translation should cite the verse row and include the relevant final subtitle or footnote when necessary.

Do not substitute the 1974 translation installment, the 1981 edition, or the 1989 edition when the question asks for final wording.

For translation development, however, compare the 1974 installment, 1981 edition, 1989 edition, and 1992 final wording in chronological order.

## Published doctrine

Use the dedicated publication closest to the question:

- Quran alone: `Quran, Hadith, and Islam`
- numerical evidence: the relevant exact table in the numerical books
- prayer procedure: `The Contact Prayers`
- final Quran commentary: 1992 footnotes
- creative or dramatic themes: `ETERNITY`, labeled as a screenplay

## Development questions

Use the earliest source and show later stages.

Example sequence:

1. 1973 numerical-initial study
2. later numerical compilations
3. 1982 Quran-alone monograph
4. 1982–1990 spoken development
5. 1992 final Quran wording and commentary

## Mixed-author caution

The `ISLAM` journal issues contain many authors.

Before attributing a statement to Rashad:

1. identify the article title
2. identify the byline
3. retain the page
4. avoid relying on his editorial membership as proof of authorship

## OCR caution

The JSON page transcription is the working canonical transcription layer, but the scanned page remains the final visual authority.

When OCR confidence is low, avoid exact Arabic, numerical, or table quotations until the page is checked.


---

# Combined Chronology

## 1973

The numerical project is published as a focused study of the mysterious Quranic alphabets.

## 1974–1975

Rashad participates in a broad international Islamic journal. Early English Quran renderings appear during this period. The institutional setting is still recognizably wider than the later Submitter movement.

## Mid-1970s to 1982

The numerical discovery expands into public demonstrations, large data tables, and claims of physical proof.

## 1982

Two developments are visible together:

- exploratory communal Quran study in the audio archive
- formal Quran-alone publication in `Quran, Hadith, and Islam`

## 1983

`ETERNITY` expresses theological and eschatological ideas through a screenplay.

## 1985–1987

The spoken corpus shows consolidation of God alone, Quran alone, the heavenly feud, ritual reform, physical proof, and the admission-test framework.

## 1988

The Messenger of the Covenant claim becomes central.

## 1989–1990

The Blue Quran, Quran 9:128–129, the pure Quran, finalized ritual reform, certainty, and the messenger system become integrated.

## 1992

The final authorized English Quran edition becomes the apex source for final verse wording, subtitles, chapter titles, and footnotes.


## 1981 Quran edition

The complete `Final Scripture` represents an early full translation stage. It still prints 9:128–129 as part of Sura 9.

## 1989 Quran edition

The title changes to `The Final Testament`. The main text ends Sura 9 at 9:127, and Appendix 24 argues that 9:128–129 were later additions.

## 1992 Quran edition

The final authorized English edition preserves the removal and supplies the final wording, chapter titles, subtitles, and footnotes used by the corpus.


---

# RAG Architecture for the Combined Corpus

## Preserve three separate canonical units

### Spoken unit

One timestamped transcript segment.

### Written unit

One page transcription, split mechanically only for retrieval.

### Quran unit

One 1992 verse record, connected to its chapter title, subtitle, and footnote.

## Retrieval flow

1. Search approved metadata and exact canonical text.
2. Deduplicate related source families.
3. Resolve every hit back to the exact transcript segment, written page, or 1992 verse row.
4. Rerank according to the user's question type.
5. Quote only the canonical field.
6. Display date, speaker or author, page or timestamp, edition, and source class.

## Required filters

- date range
- source class
- speaker or author
- genre
- final versus historical
- procedural priority
- low-confidence OCR
- duplicate family
- creative versus doctrinal
- mixed-author journal status

## Written-source chunking

The included `written_chunks.jsonl` uses exact mechanical chunks. It does not create semantic summaries.

Later human enrichment may add:

- chapter headings
- article titles
- bylines
- table captions
- claim types
- cross-media parallels

Those additions must remain metadata and must never replace the exact page text.

## Quran 1992 retrieval

The preferred file is `data/quran1992_combined.jsonl`.

It gives each verse:

- final English text
- Arabic
- transliteration
- chapter title
- subtitle
- footnote
- exact source-file locations

The other language columns remain preserved in the source CSVs but do not outrank the final English edition.


## Multi-edition Quran retrieval

Store the three Quran editions as separate edition records.

- `edition_year = 1981`
- `edition_year = 1989`
- `edition_year = 1992`
- `edition_role = historical` for 1981 and 1989
- `edition_role = final` for 1992

A final-wording query should route to 1992.

An evolution query should retrieve aligned records from all available editions and display transcription confidence. The 1981 and 1989 comparison fields are candidate extractions until visually reviewed.

Never allow absence caused by failed OCR segmentation to be mistaken for deliberate deletion. The 9:128–129 dossier is an exception because the relevant pages were directly verified within the transcriptions.


---

# Sura 9:128–129 Across the Three Editions

## Archival finding

The edition sequence is clear.

### 1981

The 1981 `Quran: The Final Scripture` prints both passages as numbered verses in the main Sura 9 text on PDF page 149 and printed page 137.

**9:128 transcription candidate**

> A messenger has come to you from among you, who is careful not to

impose any hardship on you, and cares about you, and is tolerant and merciful towards the believers.

**9:129 transcription candidate**

> If they turn away, then say, “God suffices me; there is no god except He; 1

trust in Him; and He is the Lord of the great dominion.

### 1989

The 1989 `Quran: The Final Testament` main text ends at 9:127 on PDF page 226, printed page 207.

The same page states that two verses were added to Sura 9, and Appendix 24 develops the argument for removing 9:128–129.

### 1992

The final 1992 verse dataset ends Sura 9 at 9:127. It contains no records for 9:128 or 9:129.

## Interpretation

This provides a concrete, datable translation and canon-development sequence:

1. Present in the 1981 main text.
2. Removed and explicitly rejected by the 1989 edition.
3. Still absent from the final 1992 edition.

The archive should describe this as **Rashad Khalifa's changing treatment of the passages**. Historical analysis may call them the verses he later classified as false insertions.

## Caution

The 1981 and 1989 texts are transcriptions from scanned editions. The scanned pages remain the authority for exact punctuation, typography, Arabic, and numerical claims.


---

# Quran Translation Evolution: 1981, 1989, and 1992

## Edition roles

### 1981 — *Quran: The Final Scripture*

- 562 scanned PDF pages
- 469 printed Quran pages
- 114 chapters
- 459 extracted subheadings
- 387 extracted Quran footnotes
- 19 appendices
- Prints 9:128–129 in the main Quran text

This is the earliest complete English edition in the present corpus.

### 1989 — *Quran: The Final Testament*, with Arabic

- 748 scanned PDF pages
- 604 printed Quran pages
- 114 chapters
- 752 extracted subheadings
- 341 extracted Quran footnotes
- 38 appendices
- Main Sura 9 text ends at 9:127
- Appendix 24 argues for removal of 9:128–129

This edition already reflects the canon change.

### 1992 — final authorized edition

The 1992 CSV corpus remains the final authority for Rashad's last English wording, chapter titles, subtitles, and footnotes.

## How the archive should answer questions

### Final wording

Use 1992 first.

### Evolution of wording

Show 1981, then 1989, then 1992, with page and verse provenance.

### Canon history

Use the dedicated Sura 9 dossier. Do not silently project the 1989 or 1992 position backward into 1981.

### Appendices and commentary

Compare appendix number, title, and content by edition. The appendix systems expanded substantially from 1981 to 1989 and again changed by 1992.

## Machine-readable comparison

- `data/quran_three_edition_comparison.jsonl`
- `data/quran_three_edition_comparison.csv`
- `data/quran1981_verse_candidates.jsonl`
- `data/quran1989_verse_candidates.jsonl`
- `data/sura9_128_129_dossier.json`

The comparison is deliberately labeled as a **candidate layer** because 1981 and 1989 were mechanically segmented from page transcriptions. It is suitable for locating likely changes, not for publishing unreviewed exact differences.

## Extraction coverage

- 1981 numbered-verse candidate coverage: 84.17%
- 1989 numbered-verse candidate coverage: 99.36%

Missing 1981 candidates remain accessible through the exact page transcription index.
