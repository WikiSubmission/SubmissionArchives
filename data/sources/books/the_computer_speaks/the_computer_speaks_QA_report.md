# QA Report - The Computer Speaks: God's Message to the World

- Source PDF: `The Computer Speaks God's Message to the World.pdf`
- PDF pages represented: **280 of 280**
- Blank/nearly blank pages recorded: **10**
- Pages with Arabic segments: **44**
- Arabic segments matched to canonical Quran verses: **1**
- Arabic segments retained as unverified OCR: **46**
- Mean English OCR confidence (where OCR was run): **73.66**
- Low-confidence/sparse pages flagged: **94**

## Accuracy policy

1. No PDF page is omitted. Blank pages are explicitly recorded.
2. Embedded text is preferred for born-digital or previously OCRed pages.
3. Image-only pages are transcribed with bilingual OCR and retain line/block coordinates in JSON.
4. Quranic Arabic is replaced with verified Unicode verse text only when an OCR/reference match supports it.
5. Non-Quranic or unresolved Arabic is not silently invented. It remains in the Arabic audit CSV with its OCR confidence and `ocr_unverified_arabic` status.
6. The Markdown is optimized for reading. The JSONL and layout text retain placement/order information for detailed checking.
