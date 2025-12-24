
import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY = "f78c6f5417ce45e285eebdfc6f0d321f";
const MODEL_ID = "DeepSeek-OCR";
const MODEL_VERSION_ID = "86b122666c2548f88d04dd998ccfbd70";

const FILE_PATH = path.join(process.cwd(), 'public/data/newsletters/test_images/page_1_Im14.png');

async function main() {
    if (!fs.existsSync(FILE_PATH)) {
        console.error("Image not found!");
        return;
    }

    console.log("Reading Image...");
    const buffer = fs.readFileSync(FILE_PATH);
    const base64Data = buffer.toString('base64');

    console.log(`Image Size: ${buffer.length} bytes`);

    const data = JSON.stringify({
        "user_app_id": {
            "user_id": "deepseek-ai",
            "app_id": "deepseek-ocr"
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "base64": base64Data
                    },
                    "text": {
                        "raw": "OCR this page"
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

    console.log("Sending Image to Clarifai...");

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => {
            console.log("Status:", res.statusCode);
            try {
                const json = JSON.parse(body);
                if (json.outputs && json.outputs.length > 0) {
                    const output = json.outputs[0];
                    console.log("Output Status:", output.status.description);
                    if (output.data && output.data.text && output.data.text.raw) {
                        console.log("--- OCR SUCCESS ---");
                        console.log(output.data.text.raw.substring(0, 2000));
                        console.log("-------------------");
                    } else {
                        console.log("No text data found in output.");
                        console.log(JSON.stringify(output.data || output).substring(0, 500));
                    }
                } else {
                    console.log("No outputs found. Response:", body.substring(0, 500));
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
