
import https from 'https';

const API_KEY = "f78c6f5417ce45e285eebdfc6f0d321f";
const MODEL_ID = "DeepSeek-OCR";
const MODEL_VERSION_ID = "86b122666c2548f88d04dd998ccfbd70";

const IMG_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/200px-Wikipedia-logo-v2.svg.png";

async function main() {
    const data = JSON.stringify({
        "user_app_id": {
            "user_id": "deepseek-ai",
            "app_id": "deepseek-ocr"
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "url": IMG_URL
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

    console.log("Sending Native Clarifai Request via HTTPS...");

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => {
            console.log("Status:", res.statusCode);
            console.log("Body:", body.substring(0, 5000));
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
