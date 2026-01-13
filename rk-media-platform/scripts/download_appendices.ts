
import fs from 'fs';
import path from 'path';
import https from 'https';

const downloadFile = (url: string, dest: string) => {
    return new Promise<void>((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${path.basename(dest)}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            console.error(`Error downloading ${url}:`, err.message);
            reject(err);
        });
    });
};

const main = async () => {
    const links = {
        "introduction": "https://library.wikisubmission.org/file/quran-the-final-testament-introduction",
        "proclamation": "https://library.wikisubmission.org/file/quran-the-final-testament-proclamation",
    };

    for (let i = 1; i <= 38; i++) {
        // @ts-ignore
        links[`appendix_${i}`] = `https://library.wikisubmission.org/file/quran-the-final-testament-appendix-${i}`;
    }

    const outputDir = path.join(process.cwd(), 'public', 'appendices');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const [name, url] of Object.entries(links)) {
        const fileName = `${name}.pdf`;
        const dest = path.join(outputDir, fileName);
        await downloadFile(url, dest);
    }
};

main();
