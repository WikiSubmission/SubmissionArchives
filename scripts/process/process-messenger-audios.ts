import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

// Videos 53-69 from the playlist (skipping private/unavailable)
const videos = [
    { index: 53, id: '6-yFshRBpcQ', title: '53 Quran Study 22 Oct 1982 By Dr  Rashad Khalifa - Original' },
    { index: 54, id: 'x-FTCj3EPPI', title: '54 Quran Study 22 Oct 1982 By Dr Rashad Khalifa' },
    { index: 55, id: 'GqnPazpDQ-Y', title: '55 Zikr 23 Oct 1982 By Dr Rashad Khalifa' },
    { index: 56, id: 'RJlRdRd-ZfY', title: '56 Friday Sermon 29 Oct 1982 By Dr Rashad Khalifa' },
    { index: 57, id: 'vFWMZvAfqkw', title: '57 Quran Study 05 Nov 1982 By Dr Rashad Khalifa' },
    { index: 58, id: 'rjuCvRFSHLo', title: '58 Friday Sermon 12 Nov 1982 By Dr Rashad Khalifa' },
    { index: 59, id: 'A1dhuhdFtvA', title: '59 Friday Sermon 19 Nov 1982 By Dean Mahmoud' },
    { index: 60, id: 'VF4oOE0raI0', title: '60 Friday Sermon 19 Nov 1982 By Dr Rashad Khalifa' },
    { index: 61, id: 'NZVf3Y97icc', title: '61 Friday Sermon 1982 By Dr Rashad Khalifa' },
    { index: 62, id: 'VngUt0JThE0', title: '62 Friday Sermon 26 Nov 1982 By Dr Rashad Khalifa' },
    { index: 63, id: 'vx8Ct06xnjU', title: '63 Friday Sermon 03 Dec. 1982 By Dr Rashad Khalifa' },
    { index: 64, id: 'vcUtTX5rQPs', title: '64 Friday Sermon 26 Nov 1982 By Dr Rashad Khalifa' },
    { index: 65, id: 'AxFWjNWKFno', title: '65 Friday Sermon 03 Dec. 1982 & 10 Dec. 1982 By Dr Rashad Khalifa' },
    { index: 66, id: 'VD4-XQbvnSs', title: '66 Friday Sermon 10 Dec. 1982 By Dr Rashad Khalifa' },
    { index: 67, id: '7wP_-BUP1Lg', title: '67 Friday Sermon 10 Dec. 1982 By Dr. Rashad Khalifa' },
    // 68 & 69 are private/removed — skipped
];

const targetBaseDir = 'c:\\Users\\Jonathan\\Desktop\\SA\\public\\content\\messenger-audios';
const csvPath = 'c:\\Users\\Jonathan\\Desktop\\search media\\media\\audios\\audio_playlist_transcripts.csv';
const ffmpegPath = 'c:\\Users\\Jonathan\\Desktop\\SA\\node_modules\\ffmpeg-static\\ffmpeg.exe';

// Folder name = YouTube title, made Windows-safe
function toFolderName(title: string): string {
    return title
        .replace(/[/\\:*?"<>|]/g, '-')
        .replace(/\s+/g, ' ')
        .trim();
}

// Short filename e.g. MA53, MA54...
function shortName(index: number): string {
    return `MA${index}`;
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
                    if (b.length === 2) return `00:${b[0].padStart(2, '0')}:${b[1].padStart(2, '0')}.000`;
                    if (b.length === 3) return `${b[0].padStart(2, '0')}:${b[1].padStart(2, '0')}:${b[2].padStart(2, '0')}.000`;
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

    for (const { index, id, title } of videos) {
        const folderName = toFolderName(title);
        const folderPath = path.join(targetBaseDir, folderName);
        const sn = shortName(index);

        console.log(`\n[${index}] ${title}`);

        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

        const mp3Path = path.join(folderPath, `${sn}.mp3`);
        const vttPath = path.join(folderPath, `${sn}.en-US.vtt`);
        const txtPath = path.join(folderPath, `${sn}.txt`);

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
    }

    console.log('\n✓ All done!');
}

process();
