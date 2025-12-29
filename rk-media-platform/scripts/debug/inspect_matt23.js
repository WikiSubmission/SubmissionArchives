
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'public/data/web_nt.json');

try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);

    // Find Matthew
    const mat = data.find(b => b.abbrev === 'MAT');
    if (!mat) {
        console.log("Matthew not found");
        return;
    }

    // Chapter 1 (index 0)
    const ch1 = mat.chapters[0];
    if (!ch1) {
        console.log("Chapter 1 not found");
        return;
    }

    // Verse 23
    const v23 = ch1.find(v => v.num === 23);
    console.log("Verse 23 Data:");
    console.log(JSON.stringify(v23, null, 2));

} catch (e) {
    console.error("Error:", e);
}
