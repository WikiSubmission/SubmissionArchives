
// @ts-nocheck
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import zlib from 'zlib';

const FILE = path.join(process.cwd(), 'public/data/newsletters/1990_01_January.pdf');
const OUT_DIR = path.join(process.cwd(), 'public/data/newsletters/test_images');

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function main() {
    console.log("Reading PDF...");
    const pdfBytes = fs.readFileSync(FILE);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    console.log(`Processing ${pages.length} pages...`);

    let totalImages = 0;

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        // @ts-ignore
        const resources = page.node.Resources();
        if (!resources) continue;

        // @ts-ignore
        const xObjects = resources.lookup(PDFName.of('XObject'));
        // @ts-ignore
        if (!xObjects) continue;

        // @ts-ignore
        const keys = xObjects.keys();
        for (const key of keys) {
            // @ts-ignore
            const ref = xObjects.get(key);
            const xObject = pdfDoc.context.lookup(ref);

            if (xObject instanceof PDFRawStream) {
                // @ts-ignore
                const subtype = xObject.dict.lookup(PDFName.of('Subtype'));
                if (subtype === PDFName.of('Image')) {
                    const data = xObject.contents;
                    const suffix = i + 1;
                    // @ts-ignore
                    const name = key.decodeText ? key.decodeText() : 'img';

                    // @ts-ignore
                    const filter = xObject.dict.lookup(PDFName.of('Filter'));
                    // @ts-ignore
                    const width = xObject.dict.lookup(PDFName.of('Width')).numberValue;
                    // @ts-ignore
                    const height = xObject.dict.lookup(PDFName.of('Height')).numberValue;
                    // @ts-ignore
                    const colorspace = xObject.dict.lookup(PDFName.of('ColorSpace'));
                    // @ts-ignore
                    const bpc = xObject.dict.lookup(PDFName.of('BitsPerComponent'))?.numberValue || 8;

                    let ext = 'bin';
                    if (filter === PDFName.of('DCTDecode')) ext = 'jpg';
                    else if (filter === PDFName.of('FlateDecode')) ext = 'png_raw';
                    else if (filter === PDFName.of('JPXDecode')) ext = 'jp2';

                    console.log(`Page ${suffix}: Image ${width}x${height}, CS: ${colorspace?.toString()}, Filter: ${filter?.toString()}`);

                    if (ext === 'jpg') {
                        fs.writeFileSync(path.join(OUT_DIR, `page_${suffix}_${name}.jpg`), data);
                        console.log(`Saved JPG directly.`);
                        totalImages++;
                    }
                    else if (ext === 'png_raw') {
                        // Decompress zlib
                        let rawValues;
                        try {
                            rawValues = zlib.unzipSync(data);
                        } catch (e) {
                            // sometimes it's inflate, sometimes unzip
                            rawValues = zlib.inflateSync(data);
                        }

                        // Determine channels
                        let channels = 1;
                        if (colorspace === PDFName.of('DeviceRGB')) channels = 3;
                        else if (colorspace === PDFName.of('DeviceGray')) channels = 1;
                        else if (colorspace === PDFName.of('DeviceCMYK')) channels = 4;
                        else {
                            console.log("Unsupported colorspace for custom extraction:", colorspace?.toString());
                            continue;
                        }

                        try {
                            await sharp(rawValues, {
                                raw: {
                                    width: width,
                                    height: height,
                                    channels: channels
                                }
                            })
                                .toFile(path.join(OUT_DIR, `page_${suffix}_${name}.png`));
                            console.log("Saved converted PNG.");
                            totalImages++;
                        } catch (e: any) {
                            console.error("Sharp conversion failed:", e.message);
                        }
                    }
                }
            }
        }
    }

    console.log(`Done. Extracted ${totalImages} images.`);
}

main().catch(console.error);
