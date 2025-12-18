
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SEARCH_DIR = 'C:\\Users\\Jonathan\\Desktop\\RKM';
const THUMBNAIL_DIR = path.join(SEARCH_DIR, 'thumbnails');

// Create thumbnails directory if it doesn't exist
if (!fs.existsSync(THUMBNAIL_DIR)) {
    fs.mkdirSync(THUMBNAIL_DIR);
}

function findFiles(dir, extensions, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'rk-media-platform' && file !== 'thumbnails') {
                findFiles(filePath, extensions, fileList);
            }
        } else {
            const ext = path.extname(file).toLowerCase();
            if (extensions.includes(ext)) {
                fileList.push(filePath);
            }
        }
    });

    return fileList;
}

const videos = findFiles(SEARCH_DIR, ['.mp4', '.mkv', '.mov']);

console.log(`Found ${videos.length} videos. Generating thumbnails...`);

let count = 0;
videos.forEach(videoPath => {
    const filename = path.basename(videoPath);
    const thumbnailName = filename + '.jpg'; // e.g. "video.mp4.jpg" to avoid collisions
    const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnailName);

    if (fs.existsSync(thumbnailPath)) {
        console.log(`Skipping existing: ${thumbnailName}`);
        return;
    }

    try {
        // Extract frame at 10% of duration or fixed 10s? 
        // 10s is safer. If video is shorter than 10s, ffmpeg might fail or grab last frame?
        // Let's try 30 seconds to skip intros, or 5 seconds if safe. Let's do 10s.
        const cmd = `ffmpeg -y -i "${videoPath}" -ss 00:00:10 -vframes 1 -q:v 2 "${thumbnailPath}"`;
        execSync(cmd, { stdio: 'ignore' });
        console.log(`Generated: ${thumbnailName}`);
        count++;
    } catch (e) {
        console.error(`Failed to generate for: ${filename}`);
    }
});

console.log(`\nDone! Generated ${count} new thumbnails.`);
