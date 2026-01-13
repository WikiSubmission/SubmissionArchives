import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { S3Client, CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command, ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";

const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PREFIX = "media/messenger_quran_studies/";

// Mapping of current file numbers to new titles
const RENAME_MAP: Record<number, string> = {
    1: "Q.72:19-28, Q.73 - Jinns (05-26-1989)",
    2: "Q.95 & Q.96 - Quran Is Not Ink & Paper (08-04-1989)",
    3: "Q.10:79-92, Q.73, Q.3:110-117, RK Sermon (01-19&26-1990)",
    4: "Q.37, Q.3:118-129 - Asteroid (01-21&22-1990)",
    5: "Q.56:75 & Q.57 (02-17-1989)",
    6: "Q.59 - PRA, Invisible Giants, Hypocrites (03-10-1989)",
    7: "Q.62 & Q.63 - God's Religion Will Dominate (03-24-1989)",
    8: "Q.65 & Q.66 - Enjoin Kids To Do Salat, Hamid Argues (04-07-1989)",
    9: "Q.70 - Chastity, Worry, Edip's Translation Request (05-12-1989)",
    10: "Q.71 & Q.72 - Chastity, Jinns (05-19-1989)",
    11: "Q.23:60-88, Q.16 (01-18&23&31-1990)",
    12: "Behrouz's Sermon & Edip's Exposure (01-25-1990)",
    13: "Q.7:12 - Adam & Eve's Bodies (12-24-1989)",
    14: "Night of Destiny Zikr",
    15: "Q.54:23, Q.55-56, Q.51 - Age 40 & First Gen",
    16: "Q.64, Q.59, Q.70 - Nothing Happens & Angels Are The Best Surgeons",
    17: "Q.82-83, Q.90-91 (07-21-1989)",
    18: "Q.61, Q.87, Q.94, Q.81",
    19: "Q.2:89 - Witchcraft, Reverting, Intro To Blue Quran",
    20: "Q.3 - Insurance, Worry, Fear",
    21: "Q.9:52, Q.56:75 - The Hypocrites",
    22: "Q.39:11, Q.37:164, Q.28 - Admission Test, No Insurance Compromise",
    23: "Q.51 - New Era, Believers Protected From Accidents & Diseases",
    24: "Q.55 & Q.56",
    25: "Q.58",
    26: "Q.67 - Hamid Argues With Rashad",
    27: "Q.14:18, Q.17:47 - Chastity, Salat As A Gift, DOJ, Quran Traps",
    28: "Q.45:33 - 19 Math",
    29: "1985 Tucson, Mehri's Questions, Admission Test & Final Test",
    30: "Q.28, Q.57, Q.45:33 - Insurance, Rashad Told To Devote All Time To God (01-1990)",
    31: "Q.18:98, Q.81 - Azan & Salat (11-04-1989)",
    32: "Q.22:15 - Which Masjids To Pray In",
    33: "Q.74 (06-02-1989)",
    34: "Q.33 - God Is Physical Innovations-Praying & Prostrating After Salat",
    35: "Rashad Makes Deliberate Mistakes To Destroy Idols (11-09-1989)",
    36: "Q.30:25 - Miracle From Biggest Brewery, Intercession, Allegory",
    37: "Q.11:68 (11-04-1989)",
    38: "Certainty (11-29)",
    39: "Q.60-61 - Rich Believer, Certainty, Insurance (12-28-1989)",
    40: "Q.3:59 (12-29-1989)",
    41: "Al-Fatiha For Everything You Wish, Extreme Libertarianism",
    42: "Interview W-Rashad by Ray Caton, Insurance, Interest",
    43: "Q.17:39 - 3rd Intl Conf, Rashad Speech, Insurance Based On Fear (11-1988)",
    44: "Q.64, Q.70 - Nothing Happens, Worry, Chastity",
    45: "Q.40 - Deja Vu, Old Believers Usually Finish All Affairs Before Departing",
    46: "Q.37:159, Q.38:25, Q.9:50, Q.39:11 - Admission Test, No Insurance Compromise, Jinns, Hypocrites, Apology",
    47: "Q.1, Q.2 - Intro to Blue Quran",
    48: "Rashad's Speech - Salat, Zakat, Fazeli Argues (01-11-1989)",
    49: "Rashad's Speech, 19 Math (11-05-1989)",
    50: "Q.92-94 - Zakat Not Limited To Earned Income",
    51: "Q.17:59 (1990)",
    52: "Q.1-2 (05-09-1989)"
};

async function getAllFiles(): Promise<string[]> {
    const allKeys: string[] = [];
    let continuationToken;

    do {
        const cmd = new ListObjectsV2Command({
            Bucket: BUCKET,
            Prefix: PREFIX,
            ContinuationToken: continuationToken
        });
        const res: ListObjectsV2CommandOutput = await client.send(cmd);
        if (res.Contents) {
            allKeys.push(...res.Contents.map((c) => c.Key!));
        }
        continuationToken = res.NextContinuationToken;
    } while (continuationToken);

    return allKeys;
}

async function renameFile(oldKey: string, newKey: string): Promise<void> {
    // URL encode the CopySource to handle special characters
    const encodedOldKey = encodeURIComponent(oldKey);

    // Copy to new location
    await client.send(new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${encodedOldKey}`,
        Key: newKey
    }));

    // Delete old file
    await client.send(new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: oldKey
    }));
}

async function main() {
    console.log("Fetching all files from R2...\n");
    const allFiles = await getAllFiles();

    const mp3Files = allFiles.filter(k => k.endsWith('.mp3')).sort();
    const jsonFiles = allFiles.filter(k => k.endsWith('.json'));

    console.log(`Found ${mp3Files.length} MP3 files and ${jsonFiles.length} JSON files\n`);

    let renamed = 0;
    let failed = 0;

    for (const mp3File of mp3Files) {
        const filename = mp3File.split('/').pop()!;

        // Extract number from filename (e.g., "1)" -> 1)
        const match = filename.match(/^(\d+)\)/);
        if (!match) {
            console.log(`⚠️  Skipping ${filename} - no number found`);
            continue;
        }

        const num = parseInt(match[1]);
        const newTitle = RENAME_MAP[num];

        if (!newTitle) {
            console.log(`⚠️  No mapping found for #${num}`);
            continue;
        }

        const newFilename = `${num}) Quran Study - ${newTitle}.mp3`;
        const newKey = `${PREFIX}${newFilename}`;

        console.log(`[${num}] Renaming...`);
        console.log(`  Old: ${filename}`);
        console.log(`  New: ${newFilename}`);

        try {
            // Find matching transcript BEFORE renaming MP3
            const possibleTranscripts = [
                mp3File.replace('.mp3', '_diarized.json'),
                mp3File.replace('.mp3', '.json'),
                mp3File.replace('.mp3', '-tagged.json')
            ];

            let foundTranscript: string | null = null;
            for (const transcriptKey of possibleTranscripts) {
                if (jsonFiles.includes(transcriptKey)) {
                    foundTranscript = transcriptKey;
                    break;
                }
            }

            // Rename MP3
            await renameFile(mp3File, newKey);
            console.log(`  ✓ MP3 renamed`);

            // Rename transcript if found
            if (foundTranscript) {
                const newTranscriptKey = newKey.replace('.mp3', '.json');
                await renameFile(foundTranscript, newTranscriptKey);
                console.log(`  ✓ Transcript renamed`);
            } else {
                console.log(`  ⚠️  No transcript found`);
            }

            renamed++;
        } catch (error: any) {
            console.error(`  ✗ FAILED: ${error.message}`);
            failed++;
        }

        console.log();
    }

    console.log("=".repeat(50));
    console.log(`Rename complete!`);
    console.log(`Renamed: ${renamed}`);
    console.log(`Failed: ${failed}`);
    console.log("=".repeat(50));
}

main().catch(console.error);
