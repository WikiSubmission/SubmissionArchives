const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// Disable worker for Node.js environment
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

async function generateThumbnail() {
    const pdfPath = path.join(process.cwd(), 'public/other/quran_visual_presentation.pdf');
    const outputPath = path.join(process.cwd(), 'public/images/other/quran_visual_presentation.jpg');

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Load PDF
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    // Get first page
    const page = await pdf.getPage(1);

    // Set scale for good quality
    const scale = 2.0;
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    // Render PDF page to canvas
    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };

    await page.render(renderContext).promise;

    // Save as JPEG
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    fs.writeFileSync(outputPath, buffer);

    console.log(`✓ Thumbnail created: ${outputPath}`);
}

generateThumbnail().catch(console.error);
