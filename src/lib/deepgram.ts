import { createClient } from "@deepgram/sdk";

let deepgram: ReturnType<typeof createClient> | null = null;

const getDeepgram = () => {
    if (deepgram) return deepgram;
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

    if (!deepgramApiKey) {
        throw new Error("DEEPGRAM_API_KEY is missing. Transcription features will not work.");
    }

    deepgram = createClient(deepgramApiKey);
    return deepgram;
};

export const transcribeFile = async (buffer: Buffer, mimetype: string) => {
    const { result, error } = await getDeepgram().listen.prerecorded.transcribeFile(
        buffer,
        {
            mimetype,
            model: "nova-2",
            smart_format: true,
            punctuate: true,
            diarize: true,
        }
    );

    if (error) {
        throw error;
    }

    return result;
};

export const transcribeUrl = async (url: string) => {
    const { result, error } = await getDeepgram().listen.prerecorded.transcribeUrl(
        { url },
        {
            model: "nova-2",
            smart_format: true,
            punctuate: true,
            diarize: true,
        }
    );

    if (error) {
        throw error;
    }

    return result;
};
