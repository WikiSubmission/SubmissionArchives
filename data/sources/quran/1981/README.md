# Quran1981 Transcription Bundle

- `Quran1981_complete.json`: one consolidated JSON object containing the manifest and all 562 page records.
- `Quran1981_pages_layout.jsonl`: one page per line, with OCR blocks, block coordinates, estimated line coordinates, roles, and manual visual additions.
- `Quran1981_full_transcription.md`: readable page-by-page transcription preserving block breaks and structural labels.
- `Quran1981_pages.csv`: one row per PDF page with page metadata and full text.
- `Quran1981_chapters.csv`: the 114 chapter starts, titles, verse counts, and page ranges in this edition.
- `Quran1981_verse_index.csv`: all 6,346 supplied verse-index rows mapped to their 1981 PDF and printed pages, including verse-0 opening-formula rows.
- `Quran1981_subheadings.csv`: extracted 1981 subheadings with the verse before which each is printed and its page coordinates.
- `Quran1981_footnotes.csv`: extracted Quran footnotes with labels, text, pages, and coordinates.
- `Quran1981_appendices.csv`: Appendix 1-19 page ranges.
- `Quran1981_subject_index_lines.csv`: line-level transcription and placement for the printed subject index.
- `Quran1981_sura_index.csv`: the front-matter sura index in structured form.
- `Quran1981_QA_report.md`: coverage, validation, and accuracy notes.
- `build_quran1981_transcription.py`: reproducible builder.

The later-edition CSVs were used only for alignment and validation. Their wording was not substituted for the 1981 text.
