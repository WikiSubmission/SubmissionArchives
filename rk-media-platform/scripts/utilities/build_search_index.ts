
import fs from 'fs';
import path from 'path';

const METADATA_PATH = path.join(process.cwd(), 'public/data/newsletters/metadata.json');
const HTML_DIR = path.join(process.cwd(), 'public/data/newsletters/html');
const OUT_PATH = path.join(process.cwd(), 'public/data/newsletters/search_index.json');

async function main() {
    if (!fs.existsSync(METADATA_PATH)) {
        console.error("Metadata missing");
        return;
    }

    const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
    const index = [];

    console.log("Building search index...");

    for (const item of metadata) {
        const htmlPath = path.join(HTML_DIR, `${item.filename}.json`);
        let fullText = "";

        if (fs.existsSync(htmlPath)) {
            try {
                const htmlData = JSON.parse(fs.readFileSync(htmlPath, 'utf-8'));
                const textParts: string[] = [];

                // Handle both document.sections and document.pages.sections structures
                let sections: any[] = [];

                if (htmlData.document) {
                    if (htmlData.document.sections && Array.isArray(htmlData.document.sections)) {
                        // Flat structure: document.sections
                        sections = htmlData.document.sections;
                    } else if (htmlData.document.pages && Array.isArray(htmlData.document.pages)) {
                        // Nested structure: document.pages.sections
                        for (const page of htmlData.document.pages) {
                            if (page.sections && Array.isArray(page.sections)) {
                                sections.push(...page.sections);
                            }
                        }
                    }
                }

                // Extract text from sections
                for (const section of sections) {
                    // Add title and subtitle
                    if (section.title) textParts.push(section.title);
                    if (section.subtitle) textParts.push(section.subtitle);

                    // Add content array items
                    if (section.content && Array.isArray(section.content)) {
                        textParts.push(...section.content);
                    }

                    // Add quote blocks
                    if (section.quote_block) {
                        if (Array.isArray(section.quote_block.text)) {
                            textParts.push(...section.quote_block.text);
                        } else if (typeof section.quote_block.text === 'string') {
                            textParts.push(section.quote_block.text);
                        }
                    }

                    // Add center blocks
                    if (section.center_block && section.center_block.content && Array.isArray(section.center_block.content)) {
                        textParts.push(...section.center_block.content);
                    }
                }

                fullText = textParts.join(' ');
            } catch (e) {
                console.error(`Error reading HTML JSON for ${item.filename}:`, e);
            }
        }

        index.push({
            id: item.id,
            title: item.title,
            displayDate: item.displayDate,
            fullDate: item.fullDate,
            filename: item.filename,
            content: fullText
        });
    }

    fs.writeFileSync(OUT_PATH, JSON.stringify(index, null, 2));
    console.log(`Search index built with ${index.length} items.`);
    console.log(`Size: ${(fs.statSync(OUT_PATH).size / 1024 / 1024).toFixed(2)} MB`);
}

main();
