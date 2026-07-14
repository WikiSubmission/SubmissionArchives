import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT = process.cwd();
const thumbnailsDir = path.join(ROOT, 'public', 'content', 'appendix', 'thumbnails', '1982');

async function processThumbnails() {
    const files = fs.readdirSync(thumbnailsDir).filter(f => f.endsWith('.png'));
    
    for (const file of files) {
        const srcPath = path.join(thumbnailsDir, file);
        const destPath = path.join(thumbnailsDir, file.replace('.png', '.jpg'));
        
        console.log(`Converting ${file} to JPEG...`);
        
        await sharp(srcPath)
            .resize(600) // Resize to a reasonable thumbnail width
            .jpeg({ quality: 80 })
            .toFile(destPath);
            
        // Delete original large PNG
        fs.unlinkSync(srcPath);
    }
    
    console.log('Conversion complete!');
}

processThumbnails().catch(console.error);
