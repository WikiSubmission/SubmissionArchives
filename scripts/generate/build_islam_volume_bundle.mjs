import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function csvEscape(value) {
  if (value === undefined || value === null) return '';
  const text = String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(filePath, headers, rows) {
  const lines = [headers.join(','), ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(','))];
  fs.writeFileSync(filePath, lines.join('\n') + '\n');
}

function buildBundle({ slug, title, sourcePdf, chunkDir, chunkFiles, outDir, pdfPageCount }) {
  fs.mkdirSync(outDir, { recursive: true });

  const pages = [];
  for (const file of chunkFiles) {
    const chunkPath = path.join(chunkDir, file);
    const chunk = JSON.parse(fs.readFileSync(chunkPath, 'utf-8'));
    pages.push(...chunk);
  }
  pages.sort((a, b) => a.pdf_page - b.pdf_page);

  // Validate contiguous coverage
  const missing = [];
  for (let i = 1; i <= pdfPageCount; i++) {
    if (!pages.find((p) => p.pdf_page === i)) missing.push(i);
  }
  if (missing.length) {
    throw new Error(`${slug}: missing pages ${missing.join(', ')}`);
  }

  // pages.csv
  writeCsv(
    path.join(outDir, `${slug}_pages.csv`),
    ['pdf_page', 'printed_page', 'blank_page', 'transcription_text', 'arabic_text'],
    pages.map((p) => ({
      pdf_page: p.pdf_page,
      printed_page: p.printed_page ?? '',
      blank_page: p.blank_page ? 'True' : 'False',
      transcription_text: p.transcription_text || '',
      arabic_text: (p.arabic_segments || []).map((s) => s.raw_text).join('\n\n'),
    }))
  );

  // layout_transcription.txt
  const layoutLines = [];
  for (const p of pages) {
    layoutLines.push(`===== PDF PAGE ${p.pdf_page} =====`);
    if (p.transcription_text) layoutLines.push(p.transcription_text);
    if (p.arabic_segments && p.arabic_segments.length) {
      layoutLines.push('[ARABIC BLOCKS]');
      for (const seg of p.arabic_segments) {
        const ref = seg.quran_reference ? `[${seg.quran_reference}] ` : '';
        layoutLines.push(`${ref}${seg.raw_text}`);
      }
    }
    layoutLines.push('');
  }
  fs.writeFileSync(path.join(outDir, `${slug}_layout_transcription.txt`), layoutLines.join('\n'));

  // page_by_page_transcription.md
  const mdLines = [`# ${title}`, '', `**Source PDF:** \`${sourcePdf}\``, `**PDF pages:** ${pdfPageCount}`, '', '**Transcription note:** Every PDF page is represented below. Text was transcribed directly from the rendered page image (no OCR engine was available in this environment). Quranic Arabic is retained as read from the page and matched to a canonical verse reference only when confidently identified; unverified Arabic is marked as such.', '', '---', ''];
  for (const p of pages) {
    mdLines.push(`## PDF Page ${p.pdf_page}`, '');
    if (p.blank_page) {
      mdLines.push('_This page is blank or near-blank._', '');
    }
    if (p.arabic_segments && p.arabic_segments.length) {
      mdLines.push('### Arabic text', '');
      for (const seg of p.arabic_segments) {
        if (seg.quran_reference) mdLines.push(`**Quran ${seg.quran_reference}**`);
        mdLines.push('<div dir="rtl" lang="ar">', '', seg.raw_text, '', '</div>', '');
      }
    }
    if (p.transcription_text) {
      mdLines.push('### Page transcription', '', p.transcription_text, '');
    }
    if (p.notes) {
      mdLines.push(`### Notes`, '', p.notes, '');
    }
    mdLines.push('---', '');
  }
  fs.writeFileSync(path.join(outDir, `${slug}_page_by_page_transcription.md`), mdLines.join('\n'));

  // arabic_segments.csv
  const arabicRows = [];
  let quranMatches = 0;
  let unverified = 0;
  for (const p of pages) {
    (p.arabic_segments || []).forEach((seg, idx) => {
      const status = seg.quran_reference ? 'canonical_quran_match' : 'unverified_arabic';
      if (seg.quran_reference) quranMatches++;
      else unverified++;
      arabicRows.push({
        pdf_page: p.pdf_page,
        printed_page: p.printed_page ?? '',
        segment: idx + 1,
        raw_text: seg.raw_text,
        quran_reference: seg.quran_reference ?? '',
        confidence: seg.confidence ?? '',
        status,
      });
    });
  }
  writeCsv(
    path.join(outDir, `${slug}_arabic_segments.csv`),
    ['pdf_page', 'printed_page', 'segment', 'raw_text', 'quran_reference', 'confidence', 'status'],
    arabicRows
  );

  // low_confidence_pages.csv
  const lowConfRows = pages
    .filter((p) => (p.notes && /illegible|difficult to read|could not|low.confidence|hard to read|not.*disambiguat/i.test(p.notes)))
    .map((p) => ({
      pdf_page: p.pdf_page,
      printed_page: p.printed_page ?? '',
      reason: p.notes,
    }));
  writeCsv(path.join(outDir, `${slug}_low_confidence_pages.csv`), ['pdf_page', 'printed_page', 'reason'], lowConfRows);

  // complete.json
  const complete = {
    metadata: {
      title,
      source_pdf: sourcePdf,
      pdf_page_count: pdfPageCount,
      transcription_method: 'visual transcription from rendered page images (PyMuPDF render, no OCR engine or bounding-box data available in this environment); Quranic Arabic matched to canonical references only when confidently identified',
      arabic_policy: 'Quranic Arabic retained as read from the page image and matched to a verse reference only when confidently identified. Other Arabic, or uncertain matches, are retained as unverified and explicitly flagged.',
    },
    pages: pages.map((p) => ({
      document_slug: slug,
      pdf_page: p.pdf_page,
      printed_page: p.printed_page,
      blank_page: p.blank_page,
      transcription_text: p.transcription_text || '',
      arabic_segments: p.arabic_segments || [],
      notes: p.notes || null,
    })),
  };
  fs.writeFileSync(path.join(outDir, `${slug}_complete.json`), JSON.stringify(complete, null, 2));

  // QA_report.md
  const blankCount = pages.filter((p) => p.blank_page).length;
  const arabicPageCount = pages.filter((p) => p.arabic_segments && p.arabic_segments.length).length;
  const lowConfCount = lowConfRows.length;
  const qa = [
    `# QA Report - ${title}`,
    '',
    `- Source PDF: \`${sourcePdf}\``,
    `- PDF pages represented: **${pages.length} of ${pdfPageCount}**`,
    `- Blank/nearly blank pages recorded: **${blankCount}**`,
    `- Pages with Arabic segments: **${arabicPageCount}**`,
    `- Arabic segments matched to canonical Quran verses: **${quranMatches}**`,
    `- Arabic segments retained as unverified OCR/reading: **${unverified}**`,
    `- Mean English OCR confidence (where OCR was run): **n/a — no OCR engine available; pages were transcribed directly from rendered images by visual reading**`,
    `- Low-confidence/sparse pages flagged: **${lowConfCount}**`,
    '',
    '## Accuracy policy',
    '',
    '1. No PDF page is omitted. Blank pages are explicitly recorded.',
    '2. This bundle was produced by rendering each PDF page to an image (via PyMuPDF, since this environment lacked `pdftoppm`/`tesseract`) and transcribing it directly through visual reading rather than an OCR engine, so no per-word bounding-box or OCR-confidence data is included.',
    '3. Quranic Arabic is retained as read from the page and matched to a verified verse reference only when confidently identified.',
    '4. Non-Quranic or unresolved Arabic is not silently invented. It remains in the Arabic audit CSV with an `unverified_arabic` status.',
    '5. Pages with illegible portions, stray/misplaced content, or other scan artifacts are flagged in per-page notes and surfaced in the low-confidence CSV where applicable.',
    '',
  ];
  fs.writeFileSync(path.join(outDir, `${slug}_QA_report.md`), qa.join('\n'));

  console.log(`${slug}: built bundle from ${pages.length} pages (${quranMatches} Quran matches, ${unverified} unverified Arabic, ${lowConfCount} low-confidence pages) -> ${outDir}`);
}

const target = process.argv[2];

if (target === 'islam_volume_2' || !target) {
  buildBundle({
    slug: 'islam_volume_2',
    title: 'ISLAM - Volume 1, Number 2 (July 1974)',
    sourcePdf: 'ISLAM - Volume 1, Number 2 (July 1974).pdf',
    chunkDir: path.join(ROOT, 'tmp', 'pdf_render', 'islam_v2_transcripts'),
    chunkFiles: ['chunk_01_19.json', 'chunk_20_38.json', 'chunk_39_57.json', 'chunk_58_76.json', 'chunk_77_92.json'],
    outDir: path.join(ROOT, 'data', 'sources', 'books', 'islam_volume_2'),
    pdfPageCount: 92,
  });
}

if (target === 'islam_volume_3_4' || !target) {
  buildBundle({
    slug: 'islam_volume_3_4',
    title: 'ISLAM - Volume 1, Number 3 & 4 (January 1975)',
    sourcePdf: 'ISLAM - Volume 1, Number 3 & 4 (January 1975).pdf',
    chunkDir: path.join(ROOT, 'tmp', 'pdf_render', 'islam_v34_transcripts'),
    chunkFiles: ['chunk_001_020.json', 'chunk_021_040.json', 'chunk_041_060.json', 'chunk_061_080.json', 'chunk_081_100.json', 'chunk_101_120.json', 'chunk_121_139.json'],
    outDir: path.join(ROOT, 'data', 'sources', 'books', 'islam_volume_3_4'),
    pdfPageCount: 139,
  });
}
