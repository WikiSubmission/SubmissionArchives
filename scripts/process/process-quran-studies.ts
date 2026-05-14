import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

// Actual YouTube titles, in playlist order
const videos = [
    { id: 'XKeWeiYcQOA', title: '01 Quran Study From Azhar 1 Sura 72;19 28 & Sura 73 By Kathryn Jinns 05 26 1989' },
    { id: '7UVcPz5KQDY', title: '02 Quran Study From Azhar 2 Sura 95 & Sura 96 By M Sabahi Two Verses Of Sura 9 Dropped Out To Demons' },
    { id: 'jEnqB7QfaB4', title: '03 Quran Study From Azhar 3 Sura 10;79 92 & Sura 23 By Rashad\'s Khutba 01 19 1990 Sura 3;110 117 By' },
    { id: 'F-SIuoPwqbs', title: '04 Quran Study From Azhar 4 Sura 37 By Rashad Shakira Present Astroid 01 21 1990 Sura 3;118 129 By S' },
    { id: 'Qbd1u9ngqPY', title: '05 Quran Study From Azhar 5 Sura 56;75 & Sura 57 By Lisa 02 17 1989' },
    { id: 'GnBtwwvgjPk', title: '06 Quran Study From Azhar 6 Sura 59 By Donna PRA Invisible Giants Hypocrites 03 10 1989' },
    { id: 'aJUK9hsqmeQ', title: '07 Quran Study From Azhar 7 Sura 62 & Sura 63 By Kathryn God\'s Religion Will Dominate In 20 To 50 Yr' },
    { id: 'D5EfbKdo8F8', title: '08 Quran Study From Azhar 8 Sura 65 & Sura 66 By Lori Encourage Children To Do Salat Hamid Argues 04' },
    { id: '_ssb0acolWQ', title: '09 Quran Study From Azhar 9 Sura 70 By Edip Chastity Worry Edip Wanted Rashad To Change Rich Believe' },
    { id: 'eAmafeIMbeI', title: '10 Quran Study From Azhar 10 Sura 71 & Sura 72 By Afameh Chastity Jinns 05 19 1989' },
    { id: '6O6brIx2BtE', title: '11 Quran Study From Behrouz 111 Sura 23;60 88 & Sura 16 01 18 199001 23 1990 Morning Before 01 31 19' },
    { id: 'jYTRnyx-9L0', title: '12 Quran Study From Behrouz 212 Behrouz\'s Khutba Edip  Yuksel\'s Exposure 01 25 1990' },
    { id: 'FE-6av2KRP4', title: '13 Quran Study From Behrouz 313 Sura 7;12 By Rashad Adam & Eve\'s Body 12 24 1989' },
    { id: '_m-_aeqgaXA', title: '14 Quran Study From Behrouz 414 Night Of Destiny Zikr By Rashad' },
    { id: 'dkW9QphWF3Y', title: '15 Quran Study From Behrouz 515 Sura 54;23 By Rashad Sura 55 & Sura 56 & Sura 51 Age  40 & First Gen' },
    { id: 'Lrqb3N6b6gY', title: '16 Quran Study From Behrouz 616 Sura 64 By Rashad Nothing Happens Except Sura 70 By Edip Worry Chast' },
    { id: 'ZGqIH1KtgQk', title: '17 Quran Study From Behrouz 717 Sura 90 & Sura 91 By Rashad Sura 82 & Sura 83 By Edip 07 21 1989No 7' },
    { id: 'wjDFBR6vWlA', title: '18 Quran Study From Behrouz 818 Sura 61 & Sura 87 & Sura 94 By Rashad Sura 81 By Edip No 8' },
    { id: 'qgNByS6nWbM', title: '19 Quran Study From Behrouz 919 Sura 2;89 119 Witchcraft Reverting Intro To Blue Quran No 13' },
    { id: 'jlYvG8mSkGs', title: '20 Quran Study From Behrouz 1020 Sura 3 By M Sabahi Insurance Fear Worry' },
    { id: 'wdA8HlLLe3U', title: '21 Quran Study From Behrouz 1121 Sura 9;52 By Rashad The Hypocrites Apology To Parivash Sura 56;75 B' },
    { id: '-ApTJpCzxso', title: '22 Quran Study From Behrouz 1222 Sura 39;11 By Rashad Admission Test I Don\'t Compromise With A Littl' },
    { id: '33ZgjUWYZ_8', title: '23 Quran Study From Behrouz 1323 Sura 51 By Douglas New Era Believers Are Protected From Accidents &' },
    { id: 'Q8ZsD-FMhJU', title: '24 Quran Study From Behrouz 1424 Sura 55 By Lori Alfatehe Sura 56 By Naghmeh' },
    { id: 'Qr_e-6xqbD4', title: '25 Quran Study From Behrouz 1525 Sura 58 By Robert' },
    { id: 'CGfev9VS4Mw', title: '26 Quran Study From Behrouz 1626 Sura 67 By Gatut Hamid Argues With Rashad' },
    { id: 'NPb1hfwEpRo', title: '27 Quran Study From Behrouz 1727 Sura 14;19 Chastity Premarital Pregnancy Sura 17;47 We Are Allowed' },
    { id: '2wJituk57Ho', title: '28 Quran Study From Parivash 128 Sura 45;33 Parivash\'s Home 19 Math' },
    { id: 'H4C4mkPtoO8', title: '29 Quran Study From Parivash 229 Mehri\'s Questions Admission Test & Final Test Tucson 1985' },
    { id: 'q1snri6J2w4', title: '30 Quran Study From Parivash 330 Sura 28 & Sura 57 Insurance With GOD Sura 45;33 Rashad Was Told To' },
    { id: 'o5IqOX9zwzo', title: '31 Quran Study From Parivash 431 Sura 18;98 & Sura 81 Edip Azan & Salat By Rashad 11 04 1989' },
    { id: 'jpTj9DAzZO4', title: '32 Quran Study From Parivash 532 Sura 60 & Sura 61 Rich Believer Certainty Insurance 114 Min 12 28 8' },
    { id: 'cMoTZEsn7Iw', title: '33 Quran Study From Parivash 633 Sura 74 Masud Sabahi 06 02 1989' },
    { id: 'dH2WDuFNJyI', title: '34 Quran Study From Parivash 734 Sura 33 GOD Is Physical Innovations Praying & Prostrating After Sal' },
    { id: 'GOZ5pXt-0pU', title: '35 Quran Study From Parivash 835 Sura 30;25 Miracle Coming Out Of Biggest Brewery Intercession Alleg' },
    { id: 'F0UVvvE92-E', title: '36 Quran Study From Parivash 936 After Fajr Prayer I Make Deliberate Mistakes To Destroy Idols Origi' },
    { id: 'EiTW2MhEtTc', title: '37 Quran Study From Parivash 1037 Shakira\'s Home Sura 11;68 11 04 1989' },
    { id: 'OElDY5TJ2ZE', title: '38 Quran Study From Parivash 1138 Certainty 11 29 1989' },
    { id: '9YlP1msrWIM', title: '39 Quran Study From Parivash 1239 Sura 60 & Sura 61 Rich Believer Certainty Insurance 114 Min 12 28' },
    { id: '9tNeF2RTA9A', title: '40 Quran Study From Parivash 1340 Sura 3;59 12 29 1989' },
    { id: 'N-DjyN6a0tc', title: '41 Quran Study From Parivash 1441 Sura 54 By Rashad Alfateha For Anything You Wish Extreme Libertari' },
    { id: 'zHnerwexwN8', title: '42 Quran Study From Roxana 142 Interview With Rashad By Ray Caton Insurance Interest' },
    { id: 'KceHeCtRxcw', title: '43 Quran Study From Roxana 243 Third International Conference Tucson Rashad\'s Speech Sura 17;39 Insu' },
    { id: 'k-8tDovGWsM', title: '44 Quran Study From Roxana 344 Sura 64 By Rashad Nothing Happens Angels Are Best Surgons Sura 59 By' },
    { id: 'MBNuPXwnXew', title: '45 Quran Study From Roxana 445 Sura 40 By Rashad Firoz\'s Home Deja Vu Believers Usually 95 Yrs Old F' },
    { id: '9bsMcVdmSqk', title: '46 Quran Study From Roxana 546 Sura 37;159 To 38;25 Sura 9;50 & Sura 39;11 Admission Test I Don\'t Co' },
    { id: 'H7gWUeJB-_4', title: '47 Quran Study From Roxana 647 Introduction To Blue Quran Sura 1 & Beginning Of Sura 2' },
    { id: 'NZXuGdG_NzM', title: '48 Quran Study 48 Rashad\'s Speech Parivash\'s Home Salat Zakat Fazeli A Muhamaden Argues 01 11 1989' },
    { id: 'FYaZpRU4LZs', title: '49 Quran Study 49 Speech Of Rashad Parivash\'s Home 19 Math 11 05 1989' },
    { id: 'N5tt8GfiiYk', title: '50 Quran Study 50 Sura 92 & Sura 93 & Sura 94 By Kathryn Zakat Not Limited To Earned Money 07 27 198' },
    { id: 'PFxoFm1F3PQ', title: '51 Quran Study 51 Sura 17;59 Rashad 1990' },
    { id: '4vzFRGPYqRQ', title: '52 Quran Study 5889 by Linda Sura 1 & 2 partial' },
];

const targetBaseDir = 'c:\\Users\\Jonathan\\Desktop\\SA\\public\\Audios\\quran-studies';
const thumbSourceDir = 'c:\\Users\\Jonathan\\Desktop\\SA\\public\\images\\quran-studies';
const csvPath = 'c:\\Users\\Jonathan\\Desktop\\search media\\media\\audios\\audio_playlist_transcripts.csv';
const ffmpegPath = 'c:\\Users\\Jonathan\\Desktop\\SA\\node_modules\\ffmpeg-static\\ffmpeg.exe';

// Folder name = YouTube title, made Windows-safe (replace forbidden chars)
function toFolderName(title: string): string {
    return title
        .replace(/[/\\:*?"<>|]/g, '-')  // replace forbidden chars with dash
        .replace(/\s+/g, ' ')            // collapse whitespace
        .trim();
}

// Files inside the folder use short QS01..QS52 to avoid MAX_PATH
function shortName(index: number): string {
    return `QS${String(index + 1).padStart(2, '0')}`;
}

function parseCSV(content: string) {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    for (let i = 0; i < content.length; i++) {
        const c = content[i];
        if (c === '"') {
            if (inQuotes && content[i + 1] === '"') { currentCell += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
            currentRow.push(currentCell); currentCell = '';
        } else if ((c === '\n' || c === '\r') && !inQuotes) {
            if (c === '\r' && content[i + 1] === '\n') i++;
            currentRow.push(currentCell);
            rows.push(currentRow);
            currentRow = []; currentCell = '';
        } else {
            currentCell += c;
        }
    }
    if (currentRow.length > 0 || currentCell !== '') { currentRow.push(currentCell); rows.push(currentRow); }
    return rows;
}

let csvRows: string[][] | null = null;

function generateVTT(youtubeId: string): string {
    if (!csvRows) {
        console.log('  Loading transcript CSV...');
        csvRows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
    }
    let vtt = 'WEBVTT\n\n';
    let count = 0;
    for (const row of csvRows) {
        if (row[4]?.trim() === youtubeId) {
            count++;
            const text = row[3];
            const start = row[6]?.trim();
            const end = row[7]?.trim();
            if (start && end) {
                const fmt = (t: string) => {
                    const b = t.split(':');
                    if (b.length === 2) return `00:${b[0].padStart(2,'0')}:${b[1].padStart(2,'0')}.000`;
                    if (b.length === 3) return `${b[0].padStart(2,'0')}:${b[1].padStart(2,'0')}:${b[2].padStart(2,'0')}.000`;
                    return t;
                };
                vtt += `${fmt(start)} --> ${fmt(end)}\n${text}\n\n`;
            }
        }
    }
    console.log(`    Found ${count} transcript segments`);
    return vtt;
}

async function process() {
    if (!fs.existsSync(targetBaseDir)) fs.mkdirSync(targetBaseDir, { recursive: true });

    for (let i = 0; i < videos.length; i++) {
        const { id, title } = videos[i];
        const folderName = toFolderName(title);
        const folderPath = path.join(targetBaseDir, folderName);
        const sn = shortName(i);

        console.log(`\n[${i + 1}/52] ${title}`);

        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

        const mp3Path  = path.join(folderPath, `${sn}.mp3`);
        const vttPath  = path.join(folderPath, `${sn}.en-US.vtt`);
        const txtPath  = path.join(folderPath, `${sn}.txt`);
        const thumbPath = path.join(folderPath, 'thumbnail.jpg');
        const thumbPngPath = path.join(folderPath, 'thumbnail.png');

        // 1. Audio
        if (!fs.existsSync(mp3Path)) {
            console.log('  Downloading audio...');
            const r = spawnSync('yt-dlp', [
                '-f', 'bestaudio',
                '--extract-audio', '--audio-format', 'mp3',
                '--ffmpeg-location', ffmpegPath,
                '-o', mp3Path,
                `https://www.youtube.com/watch?v=${id}`
            ], { stdio: 'inherit' });
            if (r.error) console.error('  yt-dlp error:', r.error);
        } else {
            console.log('  Audio already exists, skipping.');
        }

        // 2. Transcript
        console.log('  Generating transcript...');
        const vtt = generateVTT(id);
        fs.writeFileSync(vttPath, vtt);
        const txt = vtt.split('\n').filter(l => !l.includes('-->') && l !== 'WEBVTT' && l.trim() !== '').join('\n');
        fs.writeFileSync(txtPath, txt);

        // 3. Thumbnail  (QS1.jpg / QS1.png  -> thumbnail.jpg / thumbnail.png)
        const qsNum = i + 1;
        if (!fs.existsSync(thumbPath) && !fs.existsSync(thumbPngPath)) {
            const srcJpg = path.join(thumbSourceDir, `QS${qsNum}.jpg`);
            const srcPng = path.join(thumbSourceDir, `QS${qsNum}.png`);
            if (fs.existsSync(srcJpg)) {
                fs.copyFileSync(srcJpg, thumbPath);
                console.log('  Thumbnail copied (jpg).');
            } else if (fs.existsSync(srcPng)) {
                fs.copyFileSync(srcPng, thumbPngPath);
                console.log('  Thumbnail copied (png).');
            } else {
                console.log('  No local thumbnail found.');
            }
        } else {
            console.log('  Thumbnail already exists, skipping.');
        }
    }
    console.log('\n✓ All done!');
}

process();
