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
