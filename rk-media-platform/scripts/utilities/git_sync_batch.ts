
import { execSync } from 'child_process';

const REPO_ROOT = 'C:\\Users\\Jonathan\\Desktop\\RKM';
const BATCH_SIZE = 10;

function run(cmd: string, ignoreError = false) {
    console.log(`> ${cmd}`);
    try {
        return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e: any) {
        if (!ignoreError) {
            console.error(`Command failed: ${cmd}`);
            if (e.stdout) console.log("STDOUT:", e.stdout.toString());
            if (e.stderr) console.error("STDERR:", e.stderr.toString());
            throw e;
        }
    }
}

function getPendingFiles(): string[] {
    try {
        const output = run('git status --porcelain');
        if (!output) return [];
        return output.trim().split('\n').map(line => {
            // Regex to capture everything after the first 3 characters (status + space)
            // git status --porcelain is always 2 chars status + 1 space + path
            // e.g. "M  .gitignore" -> "M ", " ", ".gitignore"
            // e.g. "?? newfile.txt" -> "??", " ", "newfile.txt"

            // However, handle the case where it might be quoted
            const match = line.match(/^.{2}\s+(.*)$/);
            return match ? match[1].trim() : null;
        }).filter(f => f);
    } catch (e) {
        console.error("Error reading git status", e);
        return [];
    }
}

function main() {
    console.log(`Starting Batched Git Sync in ${REPO_ROOT}`);
    console.log(`Batch Size: ${BATCH_SIZE}`);

    let loop = 0;
    while (true) {
        loop++;
        const allFiles = getPendingFiles();
        if (allFiles.length === 0) {
            console.log("\n✅ All files synced! Git status is clean.");
            break;
        }

        const batch = allFiles.slice(0, BATCH_SIZE);
        console.log(`\n--- Batch ${loop} ---`);
        console.log(`Processing ${batch.length} files (Remaining: ${allFiles.length - batch.length})`);

        const fileArgs = batch.map(f => {
            // Check if already quoted (e.g. "file name.txt")
            if (f.startsWith('"') && f.endsWith('"')) {
                return f;
            }
            return `"${f}"`; // Quote safely
        }).join(' ');

        try {
            // Use -- to prevent treating filenames starting with - as flags
            run(`git add -- ${fileArgs}`);
            run(`git commit -m "Batch sync ${loop}: ${batch.length} files"`);
            console.log("Pushing to remote...");
            run(`git push origin main`);
        } catch (e) {
            console.error("❌ Batch failed.");
            // Print the first few files to debug
            console.log("Failed content sample:", batch.slice(0, 5));
            process.exit(1);
        }
    }
}

main();
