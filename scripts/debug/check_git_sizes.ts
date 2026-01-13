
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REPO_ROOT = 'C:\\Users\\Jonathan\\Desktop\\RKM';

try {
    const output = execSync('git status --porcelain', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    if (!output) {
        console.log("No pending files.");
    } else {
        const lines = output.split('\n');
        console.log(`Found ${lines.length} pending files.`);

        // Check first 20 lines for size
        for (let i = 0; i < Math.min(20, lines.length); i++) {
            let file = lines[i].substring(3).trim();
            // Handle quotes
            if (file.startsWith('"') && file.endsWith('"')) file = file.slice(1, -1);

            const fullPath = path.join(REPO_ROOT, file);
            try {
                const stat = fs.statSync(fullPath);
                console.log(`${file}: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
            } catch (e) {
                console.log(`${file}: Error reading stats`);
            }
        }
    }
} catch (e) {
    console.error(e);
}
