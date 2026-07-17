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