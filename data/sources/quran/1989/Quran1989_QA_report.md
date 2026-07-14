# Quran1989 Transcription QA Report

## Coverage

- PDF pages represented: **748 of 748**.
- Sura chapters represented: **114 of 114**.
- Verse-index rows mapped to a 1989 PDF page: **6346 of 6346**.
- Numbered English verses parsed into verse rows: **6234 of 6234**.
- Arabic verse/basmalah rows populated: **6346 of 6346**.
- Quran subheadings structurally extracted: **752**.
- Quran footnotes structurally extracted: **341**.
- Appendices represented: **38 of 38**.
- Subject-index lines represented: **3851**.
- Glossary lines represented: **269**.

## OCR and image handling

The 1989 book is a scanned facsimile with a high-quality hidden English OCR layer. The output preserves the raw OCR, normalized reading text, exact line coordinates, font/style indicators, and block roles. Pages with no usable embedded OCR are: **746, 748**. PDF pages 746 and 748 were transcribed manually from their page images; PDF page 1 also has a manual cover transcription because the gold lettering OCR is defective.

The Arabic Quran is printed as photographic facsimile panels and is not represented in the PDF's hidden OCR layer. The bundle therefore supplies the Arabic verse text from the canonical Uthmani Quran text distributed with TeX Live, aligned verse-by-verse to this edition's page ranges. Sura 9:128-129 are intentionally omitted to match the 1989 edition. The source page image remains authoritative for exact calligraphic glyph shapes, ornamental verse markers, and line wrapping.

## Structural validation

- Chapter-range continuity issues: **0**.
- No chapter-range continuity errors detected.

## Accuracy status

This is a complete page-level structural transcription rather than a simple text dump. Every page, chapter heading, page header, subtitle candidate, footnote, appendix, glossary line, and subject-index line is represented with placement metadata. Rare character-level errors can remain in the scan's ordinary English OCR. For that reason, the raw OCR and cleaned reading text are both retained, and all disputed wording can be traced to an exact page and bounding box. The supplied later-edition CSVs were used only for indexing and validation, not to overwrite the 1989 English text.
