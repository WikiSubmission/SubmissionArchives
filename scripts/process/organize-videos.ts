import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CSV_PATH = 'c:\\Users\\Jonathan\\Desktop\\search media\\media\\videos\\khalifa_playlist_transcripts.csv';
const TARGET_DIR = 'c:\\Users\\Jonathan\\Desktop\\SA\\public\\content\\videos';

const videos = [
    { id: '3Hn1zD5z6Cg', title: 'Witness a Miracle & World News Bulletin' },
    { id: 'NWUt_bESl0c', title: 'Mathematical Miracle of Quran' },
    { id: 'U31-USHFRZM', title: 'Essentials of Submission (Islam)' },
    { id: 'tbxOH3KNOvA', title: 'Principles of Contact Prayers Salat' },
    { id: 'K7suTQM7fno', title: 'Principles of Friday Prayer' },
    { id: 'f7doI2Z4o4M', title: 'Old Message, New Messenger' },
    { id: 'cAvmtN9gUU4', title: 'King of Chaos' },
    { id: 'GQE2xUWudR4', title: 'The Great Debate: Dr. Rashad Khalifa vs Dr. Abdel Rahman' },
    { id: '4GWZfsL97cU', title: 'In Defense of the Bible' },
    { id: 'yXOlRXDdbbo', title: 'Evolution or Creation: The Final Argument by Dr. Rashad Khalifa' },
    { id: 'OSLo75uochY', title: 'City Council Al-Fatiha Recitation by Dr. Rashad Khalifa' },
    { id: '8RMX5y_ekEU', title: 'Excerpts From a Radio Debate With Dr. Rashad Khalifa' },
    { id: 'olqh4qUiLMU', title: 'World News Bulletin' },
    { id: 'utI1q7zHKD0', title: 'The Creators Signature' },
    { id: '2Z7j7dqe6gQ', title: 'Arabic Language Lessons By Dr. Rashad Khalifa' },
    { id: 'pHVYKB7wnCY', title: 'Friday Sermon: Knowing GOD: GOD is Doing Everything (06/05/1987)' },
    { id: 'Kk-DvqUSJ1M', title: 'Friday Sermon: Rearranging Our Priorities (07/1987)' },
    { id: 'MR6UI5rp8OM', title: 'Friday Sermon: God is Doing Everything - Part 2 (07/1987)' },
    { id: '_Ll4qVZof-8', title: 'Friday Sermon: Universal Unity Through Devotion to GOD Alone' },
    { id: '2Wy8xnVvyX8', title: 'Friday Sermon: The Mathematical Miracle Proves the Quran to be the Word of GOD (10/16/1987)' },
    { id: 'IosZLCyLshg', title: 'Friday Sermon: Evidence is Increasing, This Life is a School for the Eternal Life (11/1987)' },
    { id: 'r--5GDUhUn8', title: 'Friday Sermon: Quran is the Only Book in the World That is Mathematically Composed (11/1987)' },
    { id: 'WoKgh6SA7uk', title: 'Friday Sermon: More Evidence - Memorize This Supplication For Divine Protection (11/1987)' },
    { id: 'eV39kJ4M28g', title: 'Friday Sermon: The Muhammadans Worship Muhammad, Discoveries by Atef and Lisa (12/04/1987)' },
    { id: 'SkZHcXGbIL4', title: 'Friday Sermon: The Power of Repentance, The Secret of Happiness (01/01/1988)' },
    { id: 'TjuvAGtg0F4', title: 'Friday Sermon: GOD is Doing Everything, Story About Ahmed Subhy Mansour (1/22/1988)' },
    { id: 'hnLrKHqOs18', title: 'Friday Sermon: Our Purpose, GOD\'s Kingdom vs Satan\'s Kingdom, Abraham\'s Dream (03/04/1988)' },
    { id: 'BSkLONbBXp8', title: 'Friday Sermon: Seek GOD\'s Kingship Over You and Everything Else Follows (03/25/1988)' },
    { id: 'KPGPbbkGsw4', title: 'Friday Sermon: Marriage Importance of Love, Muhammad\'s Example (04/08/1988)' },
    { id: 'n5Xflm_Z4jA', title: 'Friday Sermon: Proclaiming Messengership, Abraham\'s Religion (04/15/1988)' },
    { id: 'xouJtIryZ5w', title: 'Friday Sermon: Rashad Explains His Messengership Details (05/16/1988)' },
    { id: 'HW9pLxDpNKk', title: 'Friday Sermon: Natural Instinct - Who is The Real You? How to Find Perfect Happiness (05/27/1988)' },
    { id: 'vx22QER90B4', title: 'Friday Sermon: The Meaning of Life, Discovering the Miracle (07/15/1988)' },
    { id: 'hqNE7n4fRs0', title: 'Friday Sermon: Who is GOD? (04/08/1988)' },
    { id: 'mw2PxMFm6r4', title: 'Friday Sermon: Who is Your GOD? Majority of Believers Are Going to Hell (10/28/1988)' },
    { id: '2sydJIGEp1I', title: 'Friday Sermon: Classification of Creatures, Loving GOD, Hell is not Enough (12/09/1988)' },
    { id: 'WZpZHLONMeM', title: 'Friday Sermon: What About Previous Generations? (12/30/1988)' },
    { id: 'Giya8_xs2iE', title: 'Friday Sermon: Remember GOD Constantly, Submitter vs Objector (01/13/1989)' },
    { id: 'zQLIUjxFIRw', title: 'Friday Sermon: Revelation of Quran to Revelation of Miracle, Importance of Dawn Prayer (02/03/1989)' },
    { id: 'TjVsEBcoQro', title: 'Friday Sermon: Original Sin, Only GOD Guides, Majority of Believers Are Going to Hell (03/03/1989)' },
    { id: 'ykEO0HzdgvM', title: 'Friday Sermon: Purpose of Messengers, The Advent of the Pure Quran (03/17/1989)' },
    { id: 'SjLp8919uQo', title: 'Friday Sermon: Why Announce Messengership? (08/11/1989)' },
    { id: 'z-T6559DUFc', title: 'Friday Sermon: Proving Every Verse, Word, Letter, with Irrefutable Evidence (11/09/1989)' },
    { id: 'wGjIUItMBs4', title: 'Friday Sermon: The Heavenly Feud, The Importance of Killing the Ego (11/29/1989)' },
    { id: 'jKQBiifiywo', title: 'Friday Sermon: Proving Salat al-Jummah, The Righteous Go Straight to Heaven (11/26/1989)' },
    { id: 'giPezcvmffA', title: 'Friday Sermon: Miracle of Miracles - Al-Fatiha, Proving the Five Salat (12/08/1989)' },
    { id: 'P-G9Y2ayqkM', title: 'United Submitters International Conference: Friday Sermon (1989)' },
    { id: 'NaMA9rybg5Y', title: 'United Submitters International Conference: Explaining the Fulfillment of the Covenant (1988)' },
    { id: 'oLFyMIlEPRM', title: 'United Submitters International Conference: Final Speech by Dr. Rashad Khalifa (1989)' }
];

function sanitizeTitle(title: string) {
    // Remove leading number (e.g. "02 ")
    let s = title.replace(/^\d+\s+/, '');
    // Remove characters not allowed in filenames
    s = s.replace(/[:"&'?*<>|]/g, '').replace(/\s+/g, '_');
    return s;
}

function getFileName(title: string) {
    // Keep spaces for filename as per user example
    return title.replace(/^\d+\s+/, '');
}

function extractTranscriptFromCSV(title: string) {
    const content = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = content.split('\n');
    const matches: string[] = [];
    
    // Simplistic CSV parsing (titles might have commas, but they are usually quoted)
    // Actually, let's just find lines where the 3rd column (index 2) matches the title
    for (const line of lines) {
        if (line.includes(title)) {
            const parts = line.split(',');
            // CSV structure: index,category,title,transcript,youtube_id,...
            // We want parts[3] which is transcript. 
            // Note: parts[3] might be quoted and contain commas.
            // This is getting complex for a quick script.
            // I'll use a better regex.
            const regex = /[^,]+,[^,]+,"?([^",]+)"?,"?([^"]+)"?,[^,]+/;
            const match = line.match(new RegExp(`[^,]+,[^,]+,"?${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"?,"?([^"]+)"?`));
            if (match) {
                matches.push(match[1]);
            }
        }
    }
    return matches.join(' ');
}

// Better CSV line parser for VTT generation
function parseCSVLine(line: string) {
    const parts = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') inQuotes = !inQuotes;
        else if (c === ',' && !inQuotes) {
            parts.push(current);
            current = '';
        } else {
            current += c;
        }
    }
    parts.push(current);
    return parts;
}

function generateVTT(title: string) {
    const content = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = content.split('\n');
    let vtt = 'WEBVTT\n\n';
    
    const normalize = (t: string) => t.trim().replace(/\s+/g, ' ');
    const normalizedTitle = normalize(title);

    for (let i = 1; i < lines.length; i++) {
        const parts = parseCSVLine(lines[i]);
        if (parts[2] && normalize(parts[2]) === normalizedTitle) {
            const text = parts[3];
            const start = parts[6]; // start_timestamp (e.g. 0:42)
            const end = parts[7];   // end_timestamp (e.g. 0:48)
            
            if (start && end) {
                // Convert 0:42 to 00:00:42.000
                const formatTime = (t: string) => {
                    const bits = t.split(':');
                    if (bits.length === 2) return `00:0${bits[0]}:${bits[1].padStart(2, '0')}.000`;
                    if (bits.length === 3) return `0${bits[0]}:${bits[1].padStart(2, '0')}:${bits[2].padStart(2, '0')}.000`;
                    return t;
                };
                vtt += `${formatTime(start)} --> ${formatTime(end)}\n${text}\n\n`;
            }
        }
    }
    return vtt;
}

async function processVideos() {
    const videoProgramsDir = 'c:\\Users\\Jonathan\\Desktop\\SA\\public\\images\\video-programs';
    const sermonsDir = 'c:\\Users\\Jonathan\\Desktop\\SA\\public\\images\\sermons';
    
    // Get lists of existing images
    const programImages = fs.readdirSync(videoProgramsDir);
    const sermonImages = fs.readdirSync(sermonsDir);

    for (const video of videos) {
        const folderName = sanitizeTitle(video.title);
        const fileName = getFileName(video.title);
        const folderPath = path.join(TARGET_DIR, folderName);
        
        console.log(`Processing ${video.title}...`);
        
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
        
        const videoFilePath = path.join(folderPath, `${fileName}.mp4`);
        const vttFilePath = path.join(folderPath, `${fileName}.en-US.vtt`);
        const thumbnailPath = path.join(folderPath, `thumbnail.jpg`);
        
        // 1. Download Video
        if (fs.existsSync(videoFilePath)) {
            console.log(`  Video already exists.`);
        } else {
            try {
                console.log(`  Downloading video...`);
                execSync(`yt-dlp -f 18 -o "${videoFilePath}" "https://www.youtube.com/watch?v=${video.id}"`, { stdio: 'inherit' });
            } catch (err) {
                console.error(`  Error downloading video ${video.id}:`, err);
            }
        }
        
        // 2. Handle Thumbnail
        if (fs.existsSync(thumbnailPath)) {
            console.log(`  Thumbnail already exists.`);
        } else {
            console.log(`  Finding thumbnail...`);
            let foundLocal = false;
            
            // Try to match in video-programs
            // Super robust normalization: keep only letters and numbers
            const normalizeForMatch = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            const targetNorm = normalizeForMatch(video.title.replace(/^[\d.]+\s*/, ''));
            
            const programMatch = programImages.find(img => {
                const imgNorm = normalizeForMatch(img.replace(/\.[^/.]+$/, ""));
                return imgNorm.includes(targetNorm) || targetNorm.includes(imgNorm);
            });
            
            if (programMatch) {
                console.log(`  Found in video-programs: ${programMatch}`);
                fs.copyFileSync(path.join(videoProgramsDir, programMatch), thumbnailPath);
                foundLocal = true;
            } else {
                // Try sermons if it's a sermon
                if (video.title.toLowerCase().includes('sermon')) {
                    // Try to match by date or key phrases
                    const sermonMatch = sermonImages.find(img => {
                        const imgLower = img.toLowerCase();
                        // Extract date if present in title (e.g. 1987 06 05)
                        const dateMatch = video.title.match(/(\d{4}\s\d{2}\s\d{2})/);
                        if (dateMatch) {
                            const dateStr = dateMatch[1].replace(/\s/g, '');
                            if (imgLower.includes(dateStr)) return true;
                        }
                        return false;
                    });
                    
                    if (sermonMatch) {
                        console.log(`  Found in sermons: ${sermonMatch}`);
                        fs.copyFileSync(path.join(sermonsDir, sermonMatch), thumbnailPath);
                        foundLocal = true;
                    }
                }
            }
            
            if (!foundLocal) {
                console.log(`  Grabbing from YouTube...`);
                try {
                    execSync(`yt-dlp --write-thumbnail --skip-download -o "${path.join(folderPath, 'thumbnail')}" "https://www.youtube.com/watch?v=${video.id}"`, { stdio: 'inherit' });
                    // yt-dlp might save as .webp or .jpg, let's check and rename to thumbnail.jpg
                    const files = fs.readdirSync(folderPath);
                    const downloadedThumb = files.find(f => f.startsWith('thumbnail.') && f !== 'thumbnail.jpg');
                    if (downloadedThumb) {
                        const ext = path.extname(downloadedThumb);
                        fs.renameSync(path.join(folderPath, downloadedThumb), path.join(folderPath, `thumbnail${ext}`));
                    }
                } catch (err) {
                    console.error(`  Error downloading thumbnail:`, err);
                }
            }
        }
        
        // 3. Generate VTT
        console.log(`  Generating VTT...`);
        const vttContent = generateVTT(video.title);
        fs.writeFileSync(vttFilePath, vttContent);
        
        // 4. Generate TXT
        const txtFilePath = path.join(folderPath, `${fileName}.txt`);
        const txtContent = vttContent
            .split('\n')
            .filter(line => !line.includes('-->') && line !== 'WEBVTT' && line.trim() !== '')
            .join('\n');
        fs.writeFileSync(txtFilePath, txtContent);
    }
}

processVideos();
