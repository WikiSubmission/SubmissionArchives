import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

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

// Map old transcript patterns to new ones (with _diarized.json.json extension)
const TRANSCRIPT_RENAMES: Record<string, string> = {
    "1) Quran Study 5⧸26⧸89  Sura 72_19 28 & 73 by Kathryn, Jinns - Rashad Khalifa_diarized.json.json": "1) Quran Study - Q.72:19-28, Q.73 - Jinns (05-26-1989).json",
    "10) Quran Study 5⧸19⧸89, Sura 71 & 72 by Afameh, Chastity, Jinns  - Rashad Khalifa_diarized.json.json": "10) Quran Study - Q.71 & Q.72 - Chastity, Jinns (05-19-1989).json",
    "11) Quran Study 1⧸23⧸90, 1⧸18⧸90, Sura 23_60-88 & Sura 16, morning before 1⧸31⧸90  - Rashad Khalifa_diarized.json.json": "11) Quran Study - Q.23:60-88, Q.16 (01-18&23&31-1990).json",
    "12) Quran study 1⧸25⧸90, Behrouz's khutba, Edip's exposure  - Rashad Khalifa_diarized.json.json": "12) Quran Study - Behrouz's Sermon & Edip's Exposure (01-25-1990).json",
    "13) Quran Study 12⧸24⧸89, Sura 7_12 by Rashad, Adam & Eve's body  - Rashad Khalifa_diarized.json.json": "13) Quran Study - Q.7:12 - Adam & Eve's Bodies (12-24-1989).json",
    "14) Quran Study - Night of Destiny Zikr by Rashad  - Rashad Khalifa_diarized.json.json": "14) Quran Study - Night of Destiny Zikr.json",
    "15) Quran Study No.2, Sura 54_23 by Rashad Khalifa, Sura 55-56, Sura 51, age 40 & 1st generations_diarized.json.json": "15) Quran Study - Q.54:23, Q.55-56, Q.51 - Age 40 & First Gen.json",
    "16) Quran Study Sura 64 by Rashad Khalifa, Nothing happens, angels are best surgeons, Sura 59..._diarized.json.json": "16) Quran Study - Q.64, Q.59, Q.70 - Nothing Happens & Angels Are The Best Surgeons.json",
    "17) Quran Study No.7, Sura 90 & 91 by Rashad 7⧸21⧸89, Sura 82-83 by Edip  - Rashad Khalifa_diarized.json.json": "17) Quran Study - Q.82-83, Q.90-91 (07-21-1989).json",
    "18) Quran Study No.8, Sura 61, 87, 94, Sura 81 by Edip  - Rashad Khalifa_diarized.json.json": "18) Quran Study - Q.61, Q.87, Q.94, Q.81.json",
    "19) Quran Study No.13, Sura 2_89-119 witchcraft, reverting, Intro to Blue Quran - Rashad Khalifa_diarized.json.json": "19) Quran Study - Q.2:89 - Witchcraft, Reverting, Intro To Blue Quran.json",
    "2) Quran Study 8⧸4⧸89, Sura 95 & 96 by M. Sabahi, 2 verses of Sura 95 ... - Rashad Khalifa_diarized.json.json": "2) Quran Study - Q.95 & Q.96 - Quran Is Not Ink & Paper (08-04-1989).json",
    "20) Quran Study Sura 3 by M. Sabahi, Insurance-fear-worry - Rashad Khalifa_diarized.json.json": "20) Quran Study - Q.3 - Insurance, Worry, Fear.json",
    "21) Quran Study Sura 9_52 by Rashad Khalifa, the Hypocrites, apology to Parivash, Sura 56_75 by Lisa_diarized.json.json": "21) Quran Study - Q.9:52, Q.56:75 - The Hypocrites.json",
    "22) Quran Study Sura 39_11 by Rashad Khalifa, Admission Test-I don't compromise with a little ins ....json.json": "22) Quran Study - Q.39:11, Q.37:164, Q.28 - Admission Test, No Insurance Compromise.json",
    "23) Quran Study Sura 51 by Douglas, New Era, believers protected from accident ... - Rashad Khalifa_diarized.json.json": "23) Quran Study - Q.51 - New Era, Believers Protected From Accidents & Diseases.json",
    "24) Quran Study Sura 55 by Lori - Alfatehe, Sura 56 by Naghmeh  - Rashad Khalifa_diarized.json.json": "24) Quran Study - Q.55 & Q.56.json",
    "25) Quran Study Sura 58 by Robert - Rashad Khalifa_diarized.json.json": "25) Quran Study - Q.58.json",
    "26) Quran Study Sura 67 by Gatut, Hamid argues with Rashad  - Rashad Khalifa_diarized.json.json": "26) Quran Study - Q.67 - Hamid Argues With Rashad.json",
    "27) Quran Study Sura 14_19, Chastity-premar pregnancy, Sura 17_47, we are allow ... - Rashad Khalifa_diarized.json.json": "27) Quran Study - Q.14:18, Q.17:47 - Chastity, Salat As A Gift, DOJ, Quran Traps.json",
    "28) Quran Study 45_33 Parivash's Home 19 Math  - Rashad Khalifa_diarized.json.json": "28) Quran Study - Q.45:33 - 19 Math.json",
    "29) Quran Study 1985 Tucson, Mehri's questions, Admission Test & Final Test - Rashad Khalifa_diarized.json.json": "29) Quran Study - 1985 Tucson, Mehri's Questions, Admission Test & Final Test.json",
    "3) Quran Study 1⧸19⧸90, 1⧸26⧸90,  Sura10_79-92,  Sura 23 by Rashad Khalifa, Rashad's Khutba ..._diarized.json.json": "3) Quran Study - Q.10:79-92, Q.73, Q.3:110-117, RK Sermon (01-19&26-1990).json",
    "30) Quran Study Jan 1990, Sura 28, Sura 57 Insurance w⧸GOD, Sura 45_33- Rashad Khalifa was told..._diarized.json.json": "30) Quran Study - Q.28, Q.57, Q.45:33 - Insurance, Rashad Told To Devote All Time To God (01-1990).json",
    "31) Quran study Nov⧸4⧸89, Sura 18_98, Sura 81-Edip, Azan & Salat by Rashad  - Rashad Khalifa_diarized.json.json": "31) Quran Study - Q.18:98, Q.81 - Azan & Salat (11-04-1989).json",
    "32) Quran Study (YouTube) - Rashad Khalifa.json.json": "32) Quran Study - Q.22:15 - Which Masjids To Pray In.json",
    "33) Quran Study 6⧸2⧸89, Sura 74 by Mahmoud Sabahi - Rashad Khalifa_diarized.json.json": "33) Quran Study - Q.74 (06-02-1989).json",
    "34) Quran Study 6⧸5⧸89, Sura 33 -GOD is physical, Innovations⧸praying & prostra ... - Rashad Khalifa_diarized.json.json": "34) Quran Study - Q.33 - God Is Physical Innovations-Praying & Prostrating After Salat.json",
    "35) Quran Study  9⧸8⧸89, after Fajr prayer- I make deliberate mistake to destroy...- Rashad Khalifa_diarized.json.json": "35) Quran Study - Rashad Makes Deliberate Mistakes To Destroy Idols (11-09-1989).json",
    "36) Quran Study 9⧸7⧸89, Sura 30_25 - Miracle coming out of biggest brewery, Inter...- Rashad Khalifa_diarized.json.json": "36) Quran Study - Q.30:25 - Miracle From Biggest Brewery, Intercession, Allegory.json",
    "37) Quran Study 11⧸4⧸89 Shakira's Home, Sura 10_68  - Rashad Khalifa_diarized.json.json": "37) Quran Study - Q.11:68 (11-04-1989).json",
    "38) Quran Study 11⧸29, Certainty, Aqiqa - Rashad Khalifa_diarized.json.json": "38) Quran Study - Certainty (11-29).json",
    "39) Quran Study 12⧸28⧸89, Sura 60-61 Rich Believer, Certainty, Insurance...- Rashad Khalifa_diarized.json.json": "39) Quran Study - Q.60-61 - Rich Believer, Certainty, Insurance (12-28-1989).json",
    "4) Quran Study 1⧸21⧸90, 1⧸22⧸90 @ fajr Sura 37 by Rashad Khalifa, Shakira present, Astroid, ..._diarized.json.json": "4) Quran Study - Q.37, Q.3:118-129 - Asteroid (01-21&22-1990).json",
    "40) Quran Study 12⧸29⧸89, Sura 3_59 - Rashad Khalifa_diarized.json.json": "40) Quran Study - Q.3:59 (12-29-1989).json",
    "41) Quran Study Sura 54 by Rashad Khalifa, Alfateha for anything you wish, extreme liber ..._diarized.json.json": "41) Quran Study - Al-Fatiha For Everything You Wish, Extreme Libertarianism.json",
    "42) Interview with Rashad by Ray Catton, Insurance-Interest ... - Rashad Khalifa_diarized.json.json": "42) Quran Study - Interview W-Rashad by Ray Caton, Insurance, Interest.json",
    "43) Third International conf Sept 1988 Tucson, Rashad Khalifa speech, Sura 17_39 -Insurance based..._diarized.json.json": "43) Quran Study - Q.17:39 - 3rd Intl Conf, Rashad Speech, Insurance Based On Fear (11-1988).json",
    "44) Quran Study No.5, Sura 64 by Rashad Khalifa, Nothing happen except, Sura 70 by Edip, worry, ..._diarized.json.json": "44) Quran Study - Q.64, Q.70 - Nothing Happens, Worry, Chastity.json",
    "45) Quran Study Sura 40 by Rashad Khalifa @ Firoz's home, Deja Vu, Believers usually 95 yrs old .._diarized.json.json": "45) Quran Study - Q.40 - Deja Vu, Old Believers Usually Finish All Affairs Before Departing.json",
    "46) Quran Study Sura 37_159-38_25, Sura 9_50, Sura 39_11 Admission Test - I don't compromise ..._diarized.json.json": "46) Quran Study - Q.37:159, Q.38:25, Q.9:50, Q.39:11 - Admission Test, No Insurance Compromise, Jinns, Hypocrites, Apology.json",
    "47)  Introduction to Blue Quran  Sura 1 & begining of Sura 2 - Rashad Khalifa_diarized.json.json": "47) Quran Study - Q.1, Q.2 - Intro to Blue Quran.json",
    "48) Quran Study 1-11-89, Rashad Khalifa speech - Parivash's Home - Salat, Zakat, Fazeli argues.._diarized.json.json": "48) Quran Study - Rashad's Speech - Salat, Zakat, Fazeli Argues (01-11-1989).json",
    "49) Quran Study 11⧸5⧸89 Speech of Rashad, Parivash's Home, 19 Math - Rashad Khalifa_diarized.json.json": "49) Quran Study - Rashad's Speech, 19 Math (11-05-1989).json",
    "5) Quran Study  2⧸17⧸89, Sura 56_75 & 57 by Lisa  - Rashad Khalifa_diarized.json.json": "5) Quran Study - Q.56:75 & Q.57 (02-17-1989).json",
    "50) Quran Study 7⧸27⧸89, Sura 92, 93 & 94 by Kathryn- Zakat not limited to earned money_diarized.json.json": "50) Quran Study - Q.92-94 - Zakat Not Limited To Earned Income.json",
    "51) Quran Study Sura 17_59, Rashad 1990 - Rashad Khalifa_diarized.json.json": "51) Quran Study - Q.17:59 (1990).json",
    "52) Quran Study 5⧸8⧸89 by Linda Sura 1 & 2 partial_diarized.json.json": "52) Quran Study - Q.1-2 (05-09-1989).json",
    "6) Quran Study  3⧸10⧸89 Sura 59 by Donna, PRA , Invisible giants, Hypocrites  - Rashad Khalifa_diarized.json.json": "6) Quran Study - Q.59 - PRA, Invisible Giants, Hypocrites (03-10-1989).json",
    "7) Quran Study 3⧸24⧸89, Sura 62 & 63 by Kathryn- GOD's religion dominate in 20 to 50 -Rashad Khalifa_diarized.json.json": "7) Quran Study - Q.62 & Q.63 - God's Religion Will Dominate (03-24-1989).json",
    "8) Quran Study 4⧸7⧸89, Sura 65 & 66 by Lori, enjoin children for Salat, Hamid argues- Rashad Khalifa_diarized.json.json": "8) Quran Study - Q.65 & Q.66 - Enjoin Kids To Do Salat, Hamid Argues (04-07-1989).json",
    "9) Quran Study 5⧸12⧸89, Sura 70 by Edip, Chastity, worry, Edip wanted Rashad Khalifa to change ..._diarized.json.json": "9) Quran Study - Q.70 - Chastity, Worry, Edip's Translation Request (05-12-1989).json"
};

async function getAllFiles(): Promise<string[]> {
    let allKeys: string[] = [];
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
    const encodedOldKey = encodeURIComponent(oldKey);

    await client.send(new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${encodedOldKey}`,
        Key: newKey
    }));

    await client.send(new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: oldKey
    }));
}

async function main() {
    console.log("Fetching all files from R2...\n");
    const allFiles = await getAllFiles();

    const jsonFiles = allFiles.filter(k => k.endsWith('.json'));

    console.log(`Found ${jsonFiles.length} JSON files\n`);

    let renamed = 0;
    let notFound = 0;

    for (const [oldName, newName] of Object.entries(TRANSCRIPT_RENAMES)) {
        const oldKey = `${PREFIX}${oldName}`;
        const newKey = `${PREFIX}${newName}`;

        if (jsonFiles.includes(oldKey)) {
            console.log(`Renaming: ${oldName}`);
            console.log(`      To: ${newName}`);

            try {
                await renameFile(oldKey, newKey);
                console.log(`  ✓ Renamed\n`);
                renamed++;
            } catch (error: any) {
                console.error(`  ✗ FAILED: ${error.message}\n`);
            }
        } else {
            console.log(`⚠️  Not found: ${oldName}\n`);
            notFound++;
        }
    }

    console.log("=".repeat(50));
    console.log(`Transcript rename complete!`);
    console.log(`Renamed: ${renamed}`);
    console.log(`Not found: ${notFound}`);
    console.log("=".repeat(50));
}

main().catch(console.error);
