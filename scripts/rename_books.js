import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const booksListPath = path.join(__dirname, '../public/data/generated_indices/BOOKS_LIST.json');
const booksJson = JSON.parse(fs.readFileSync(booksListPath, 'utf8'));

const publicDir = path.join(__dirname, '../public');

for (const book of booksJson) {
    const id = book.id;
    
    // PDF
    if (book.pdfLink) {
        const oldPdfLink = book.pdfLink;
        const oldPdfLocal = path.join(publicDir, oldPdfLink);
        const oldPdfGit = `public${oldPdfLink}`;
        
        const ext = path.extname(oldPdfLocal) || '.pdf';
        const newPdfLink = `/content/written/books/${id}${ext}`;
        const newPdfGit = `public${newPdfLink}`;
        
        if (oldPdfLink !== newPdfLink && fs.existsSync(oldPdfLocal)) {
            console.log(`Renaming PDF: ${oldPdfGit} -> ${newPdfGit}`);
            try {
                execSync(`git mv "${oldPdfGit}" "${newPdfGit}"`);
                book.pdfLink = newPdfLink;
                book.filename = `${id}${ext}`;
            } catch (err) {
                console.error(`Failed to git mv ${oldPdfGit}:`, err.message);
            }
        }
    }
    
    // Thumbnail
    if (book.thumbnailOverride) {
        const oldThumbLink = book.thumbnailOverride;
        const oldThumbLocal = path.join(publicDir, oldThumbLink);
        const oldThumbGit = `public${oldThumbLink}`;
        
        const ext = path.extname(oldThumbLocal) || '.png';
        const newThumbLink = `/content/written/books/thumbnails/${id}${ext}`;
        const newThumbGit = `public${newThumbLink}`;
        
        if (oldThumbLink !== newThumbLink && fs.existsSync(oldThumbLocal)) {
            console.log(`Renaming Thumbnail: ${oldThumbGit} -> ${newThumbGit}`);
            try {
                execSync(`git mv "${oldThumbGit}" "${newThumbGit}"`);
                book.thumbnailOverride = newThumbLink;
            } catch (err) {
                console.error(`Failed to git mv ${oldThumbGit}:`, err.message);
            }
        }
    }
}

fs.writeFileSync(booksListPath, JSON.stringify(booksJson, null, 2) + '\n', 'utf8');
console.log('BOOKS_LIST.json updated successfully.');
