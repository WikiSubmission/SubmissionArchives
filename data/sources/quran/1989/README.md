# Quran1989 Transcription Bundle

- `Quran1989_complete.json`: consolidated manifest and all 748 page records.
- `Quran1989_pages_layout.jsonl`: one page per line with exact OCR block/line coordinates, styles, roles, chapter segments, and Arabic verse alignment.
- `Quran1989_full_transcription.md`: readable page-by-page English and Arabic transcription.
- `Quran1989_pages.csv`: one row per PDF page.
- `Quran1989_chapters.csv`: all 114 chapter titles, counts, and PDF ranges.
- `Quran1989_verse_index.csv`: all 6,346 numbered-verse/basmalah rows mapped to the 1989 pages, with English and Arabic text.
- `Quran1989_subheadings.csv`: extracted subheadings and placement before verses.
- `Quran1989_footnotes.csv`: extracted 1989 footnotes with labels, wording, pages, and coordinates.
- `Quran1989_appendices.csv` and `Quran1989_appendix_contents.csv`: Appendix 1-38 titles and ranges.
- `Quran1989_subject_index_lines.csv`: line-level index transcription and placement.
- `Quran1989_glossary_lines.csv`: line-level glossary transcription and placement.
- `Quran1989_contents_suras.csv`: structured sura contents table.
- `Quran1989_QA_report.md`: coverage and validation details.
- `build_quran1989_transcription.py`: reproducible builder.

The supplied later-edition CSVs were used only for indexing, chapter counts, and cross-edition checks. Their English wording was not substituted for the 1989 text. Arabic facsimile panels are transcribed with canonical Uthmani verse text and aligned to the 1989 page ranges.
