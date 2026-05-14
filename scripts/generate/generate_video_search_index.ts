import fs from 'fs';
import path from 'path';

const VIDEOS_DIR = path.join(process.cwd(), 'public', 'content', 'video');
const OUTPUT_FILE = path.join(process.cwd(), 'public', 'data', 'generated_indices', 'ALL_VIDEO_PROGRAMS.json');

type VideoMetadata = {
    id: string;
    title: string;
};

type VttSegment = {
    startTime: number;
    text: string;
};

type VideoSearchIndexItem = {
    id: string;
    title: string;
    segments: VttSegment[];
};

type VideoListItem = {
    id: string;
    title: string;
    displayTitle: string;
    type: 'video-program';
    author: string;
    thumbnailOverride: string | null;
    folder: string;
    vttFile: string;
    videoFile: string | undefined;
};

const videos: VideoMetadata[] = [
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
    { id: 'P-G9Y2ayqkM', title: 'Friday Sermon: United Submitters International Conference (1989)' },
    { id: 'NaMA9rybg5Y', title: 'United Submitters International Conference: Explaining the Fulfillment of the Covenant (1988)' },
    { id: 'oLFyMIlEPRM', title: 'United Submitters International Conference: Final Speech by Dr. Rashad Khalifa (1989)' }
];

const splitVideos: VideoMetadata[] = [
    { id: 'split1', title: 'What is Life All About?' },
    { id: 'split2', title: 'Who is GOD?' }
];

function sanitizeTitle(title: string) {
    return title.replace(/[:"&'?*<>|\/\\]/g, '').replace(/\s+/g, '_');
}

function parseTimestamp(timestamp: string): number {
    const parts = timestamp.trim().split(':');
    let seconds = 0;
    if (parts.length === 3) {
        seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2].replace(',', '.'));
    } else if (parts.length === 2) {
        seconds = parseInt(parts[0]) * 60 + parseFloat(parts[1].replace(',', '.'));
    }
    return seconds;
}

function parseVTT(content: string) {
    const segments: VttSegment[] = [];
    const blocks = content.split('\n\n');
    
    for (const block of blocks) {
        if (block.includes('-->')) {
            const lines = block.split('\n');
            const timeLine = lines[0].includes('-->') ? lines[0] : lines[1];
            const textLine = lines.slice(lines.indexOf(timeLine) + 1).join(' ');
            
            const [start] = timeLine.split(' --> ');
            segments.push({
                startTime: parseTimestamp(start),
                text: textLine.replace(/<[^>]*>/g, '').trim()
            });
        }
    }
    return segments;
}

function generateIndex() {
    const folders = fs.readdirSync(VIDEOS_DIR, { withFileTypes: true });
    const index: VideoSearchIndexItem[] = [];
    const list: VideoListItem[] = [];

    for (const folder of folders) {
        if (!folder.isDirectory()) continue;

        const folderPath = path.join(VIDEOS_DIR, folder.name);
        const files = fs.readdirSync(folderPath);
        const vttFile = files.find(f => f.endsWith('.vtt'));
        const thumbFile = files.find(f => f.startsWith('thumbnail.'));
        
        if (vttFile) {
            const content = fs.readFileSync(path.join(folderPath, vttFile), 'utf-8');
            const segments = parseVTT(content);
            
            // Find the original title from our metadata
            const allMetadata = [...videos, ...splitVideos];
            const match = allMetadata.find(v => sanitizeTitle(v.title).toLowerCase() === folder.name.toLowerCase());
            const title = match ? match.title : folder.name.replace(/_/g, ' ');
            
            const videoId = `video-program/${folder.name}`;
            const videoFile = files.find(f => f.endsWith('.mp4'));
            
            index.push({
                id: `${videoId}/${vttFile}`,
                title: title,
                segments: segments
            });

            list.push({
                id: videoId,
                title: title,
                displayTitle: title,
                type: 'video-program',
                author: 'Dr. Rashad Khalifa',
                thumbnailOverride: thumbFile ? `/content/video/${folder.name}/${thumbFile}` : null,
                folder: folder.name,
                vttFile: vttFile,
                videoFile: videoFile
            });
        } else {
            console.log(`Skipping folder ${folder.name}: No VTT found.`);
        }
    }

    if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
        fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    }
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
    
    const LIST_FILE = path.join(path.dirname(OUTPUT_FILE), 'VIDEO_PROGRAMS_LIST.json');
    
    // Sort the list based on the original order in 'splitVideos' and 'videos'
    const sortedList = list.sort((a, b) => {
        const allMetadata = [...splitVideos, ...videos];
        const indexA = allMetadata.findIndex(v => v.title.toLowerCase() === a.title.toLowerCase());
        const indexB = allMetadata.findIndex(v => v.title.toLowerCase() === b.title.toLowerCase());
        return indexA - indexB;
    });

    fs.writeFileSync(LIST_FILE, JSON.stringify(sortedList, null, 2));
    
    console.log(`Index generated at ${OUTPUT_FILE} with ${index.length} videos.`);
    console.log(`List generated at ${LIST_FILE}.`);
}

generateIndex();
