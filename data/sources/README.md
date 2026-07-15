# Canonical transcription sources

This directory contains private build inputs. Nothing here is served directly by Next.js.
The public PDFs remain in `public/content/written/books`; search data is generated into
`public/data/generated_indices` by `npm run generate:catalog`.

## Layout

- `books/`: the nine-volume Rashad Khalifa transcription corpus, its corpus manifest,
  QA reports, page JSON, and supporting CSV files.
- `quran/1992/`: the primary 1992 verse-level Quran CSVs used by the Quran reader.
- `quran/1989/`: the 1989 edition bundle. `Quran1989_verse_index.csv` supplies exact
  verse text; the complete JSON also supplies page-level search for the book reader.
- `quran/1981/`: the 1981 facsimile bundle. This source is complete and searchable by
  PDF page, but it intentionally remains page-level because its scan does not retain
  trustworthy English text boundaries for every individual verse.

## Source precedence

The catalog generator requires these canonical sources; duplicate public transcription
copies are intentionally not maintained. If a canonical source is missing or the 1989
verse index does not cover every numbered
verse in the 1992 base edition, generation fails instead of silently substituting text.
