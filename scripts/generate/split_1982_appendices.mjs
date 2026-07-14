import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

const ROOT = process.cwd();
const masterPdfPath = path.join(ROOT, '1981 appendix', '1981_Appendices.pdf');
const outDir = path.join(ROOT, 'public', 'content', 'appendix', 'pdfs', '1982');

const pageMapping = [
  { name: 'introduction.pdf', start: 1, end: 1 },
  { name: 'appendix_1.pdf', start: 2, end: 14 }
];

async function splitPdf() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`Loading master PDF: ${masterPdfPath}`);
  const masterBytes = fs.readFileSync(masterPdfPath);
  const masterDoc = await PDFDocument.load(masterBytes);

  for (const { name, start, end } of pageMapping) {
    const newDoc = await PDFDocument.create();
    
    // Page indices in pdf-lib are 0-based
    const indices = [];
    for (let i = start; i <= end; i++) {
      indices.push(i - 1);
    }
    
    const copiedPages = await newDoc.copyPages(masterDoc, indices);
    copiedPages.forEach((page) => newDoc.addPage(page));
    
    const pdfBytes = await newDoc.save();
    const outputPath = path.join(outDir, name);
    fs.writeFileSync(outputPath, pdfBytes);
    console.log(`Created ${outputPath} (${end - start + 1} pages)`);
  }
}

splitPdf().catch(console.error);
