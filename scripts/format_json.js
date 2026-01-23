const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../public/data/newsletters/html');

// Helper to sort object keys recursively for consistent ordering
function sortObject(obj) {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
    }
    return Object.keys(obj).sort().reduce((result, key) => {
        result[key] = sortObject(obj[key]);
        return result;
    }, {});
}

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }

    files.forEach((file) => {
        if (path.extname(file) === '.json') {
            const filePath = path.join(directoryPath, file);

            try {
                const rawData = fs.readFileSync(filePath, 'utf8');
                const jsonData = JSON.parse(rawData);

                // Write back with 2-space indentation
                const formattedJson = JSON.stringify(jsonData, null, 2);

                fs.writeFileSync(filePath, formattedJson);
                console.log(`Formatted: ${file}`);
            } catch (e) {
                console.error(`Error processing ${file}:`, e);
            }
        }
    });
});
