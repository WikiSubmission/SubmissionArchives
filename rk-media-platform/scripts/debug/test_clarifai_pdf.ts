
import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY = "f78c6f5417ce45e285eebdfc6f0d321f";
const MODEL_ID = "DeepSeek-OCR";
const MODEL_VERSION_ID = "86b122666c2548f88d04dd998ccfbd70";

const FILE_PATH = path.join(process.cwd(), 'public/data/newsletters/1990_01_January.pdf');

async function main() {
    if (!fs.existsSync(FILE_PATH)) {
        console.error("PDF not found!");
        return;
    }

    console.log("Reading PDF...");
    const pdfBuffer = fs.readFileSync(FILE_PATH);
    const base64Data = pdfBuffer.toString('base64');

    console.log(`PDF Size: ${pdfBuffer.length} bytes`);

    const data = JSON.stringify({
        "user_app_id": {
            "user_id": "deepseek-ai",
            "app_id": "deepseek-ocr"
        },
        "inputs": [
            {
                "data": {
                    "document": { // Try 'document' instead of 'image'
                        "base64": base64Data
                    },
                    "text": {
                        "raw": "OCR this document"
                    }
                }
            }
        ]
    });

    const options = {
        hostname: 'api.clarifai.com',
        path: `/v2/models/${MODEL_ID}/versions/${MODEL_VERSION_ID}/outputs`,
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Key ' + API_KEY,
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    console.log("Sending PDF as Base64 to Clarifai...");

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => {
            console.log("Status:", res.statusCode);
            try {
                const json = JSON.parse(body);
                console.log("Clarifai Status:", JSON.stringify(json.status, null, 2));
                if (json.outputs && json.outputs.length > 0) {
                    const output = json.outputs[0];
                    console.log("Output Status:", JSON.stringify(output.status, null, 2));
                    if (output.data) {
                        // DeepSeek OCR usually returns 'text' object or 'regions' or 'concepts'
                        if (output.data.text && output.data.text.raw) {
                            console.log("--- TEXT FOUND ---");
                            console.log(output.data.text.raw.substring(0, 1000));
                        } else {
                            console.log("Data keys:", Object.keys(output.data));
                            console.log("Data preview:", JSON.stringify(output.data).substring(0, 500));
                        }
                    } else {
                        console.log("Output data is empty!");
                    }
                } else {
                    console.log("No outputs found.");
                }
            } catch (e) {
                console.log("Failed to parse JSON", e);
            }
        });
    });

    req.on('error', (e) => {
        console.error('Error:', e);
    });

    req.write(data);
    req.end();
}

main();
export { };
