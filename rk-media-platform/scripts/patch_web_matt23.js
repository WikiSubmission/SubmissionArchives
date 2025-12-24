
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
    if (v23) {
        console.log("Found corrupt verse:", v23.text);
        // Correct WEB text
        v23.text = "Behold, the virgin shall be with child, and shall bring forth a son. They shall call his name Immanuel; which is, being interpreted, \"God with us.\"";
        console.log("Replaced with:", v23.text);
    } else {
        console.log("Verse 23 not found to patch.");
    }

    // Save back
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log("Successfully patched web_nt.json");

} catch (e) {
    console.error("Error:", e);
}
