
import OpenAI from 'openai';

const client = new OpenAI({
    baseURL: "https://api.clarifai.com/v2/ext/openai/v1",
    apiKey: "f78c6f5417ce45e285eebdfc6f0d321f",
});

// Test image (Wikipedia logo)
const IMG_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/200px-Wikipedia-logo-v2.svg.png";

async function main() {
    try {
        console.log("Sending Vision request to Clarifai...");
        const response = await client.chat.completions.create({
            model: "https://clarifai.com/deepseek-ai/deepseek-ocr/models/DeepSeek-OCR/versions/86b122666c2548f88d04dd998ccfbd70",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "What text is in this image?" },
                        { type: "image_url", image_url: { url: IMG_URL } }
                    ]
                },
            ],
            max_tokens: 300,
        });

        console.log("Response received:");
        console.log(JSON.stringify(response, null, 2));
    } catch (e: any) {
        console.error("--- REQUEST FAILED ---");
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Data:", JSON.stringify(e.response.data, null, 2));
        } else {
            console.error("Error:", e.message);
        }
    }
}

main();
