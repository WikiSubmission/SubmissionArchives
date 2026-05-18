
// CP437 characters from 0x80 to 0xFF
// This string maps index+128 to the character
// NOTE: Must NOT end with a space!
const CP437_HIGH = "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■";

export interface Segment {
    id: number;
    segment_index: number;
    start_time: number;
    end_time: number;
    content: string;
    speaker: string;
    isTransition: boolean;
}

export function parseTimestamp(timestamp: string): number {
    if (!timestamp) return 0;
    const parts = timestamp.trim().split(':');
    let seconds = 0;
    if (parts.length === 3) {
        seconds += parseInt(parts[0]) * 3600;
        seconds += parseInt(parts[1]) * 60;
        seconds += parseFloat(parts[2]);
    } else if (parts.length === 2) {
        seconds += parseInt(parts[0]) * 60;
        seconds += parseFloat(parts[1]);
    }
    return seconds;
}

export function recoverMojibake(text: string): string {
    const escapedHigh = CP437_HIGH.replace(/[\]\-\^]/g, '\\$&');
    // Regex matches sequences of High characters, possibly separated by spaces.
    // This allows us to capture "broken" words like "┘à æ" while ignoring surrounding spaces.
    const pattern = new RegExp(`[${escapedHigh}]+(?:\\s+[${escapedHigh}]+)*`, 'g');

    return text.replace(pattern, (match) => {
        // 1. Convert string to bytes based on CP437 mapping
        const bytes: number[] = [];
        for (let i = 0; i < match.length; i++) {
            const char = match[i];

            // Skip spaces (0x20) in the byte stream - they are likely OCR artifacts breaking up the UTF-8 sequence
            if (/\s/.test(char)) continue;

            const index = CP437_HIGH.indexOf(char);
            if (index !== -1) {
                bytes.push(index + 128);
            }
        }

        // 2. Attempt to decode as UTF-8
        try {
            const buffer = new Uint8Array(bytes);
            // using fatal: true to ensure we only accept valid UTF-8 sequences
            const decoded = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
            return decoded;
        } catch {
            // If decoding fails, return original garbled text
            return match;
        }
    });
}

export function cleanText(text: string): string {
    let cleaned = text
        // HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        // Mojibake fixes for Latin text (UTF-8 interpreted as Windows-1252)
        .replace(/├ú/g, 'ā')           // ā (a with macron)
        .replace(/├®/g, 'ī')           // ī (i with macron)
        .replace(/├╗/g, 'ū')           // ū (u with macron)
        .replace(/ΓÇÿ/g, "'")          // ' (right single quote)
        .replace(/ΓÇÖ/g, "'")          // ' (right single quote variant)
        .replace(/ΓÇô/g, "–")          // – (en-dash)
        .replace(/ΓÇö/g, "—")          // — (em-dash)
        .replace(/ΓÇ£/g, '"')          // " (left double quote)
        .replace(/ΓÇ¥/g, '"')          // " (right double quote)
        .replace(/├®/g, "é")           // é 
        .replace(/├¿/g, "è")           // è
        .replace(/├í/g, "á")           // á
        .replace(/├│/g, "ó")           // ó
        // Remove VTT tags
        .replace(/<[^>]*>/g, '');

    // Attempt to recover garbled text (both Arabic and other UTF-8 chars like ș, â)
    cleaned = recoverMojibake(cleaned);

    return cleaned.trim();
}

function normalizeSpeaker(name: string): string {
    const lower = name.toLowerCase();

    // Dr. Khalifa variations
    if (lower.includes('khalifa') || lower.includes('khlaifa') || lower.includes('khalfia') || lower === 'rashad') {
        return 'Dr. Khalifa';
    }
    // Catherine variations
    if (lower === 'kathryn' || lower === 'cathy' || lower === 'kathy') {
        return 'Catherine';
    }
    // Ismail Barakat variations
    if (lower.includes('ismail') || lower.includes('isamil') || lower.includes('ismali') || lower.includes('isamail')) {
        if (lower.includes('barakat') || lower.includes('barakt')) {
            return 'Ismail Barakat';
        }
    }
    // Mahmood Abib variations
    if (lower.includes('mahmood') && lower.includes('abib')) {
        return 'Mahmood Abib';
    }
    // Parivash variations
    if (lower.includes('parivash') || lower.includes('parviash') || lower.includes('praivash')) {
        return 'Parivash';
    }
    // Muhtesem variations
    if (lower.includes('muhtesem') || lower.includes('muhteshem')) {
        return 'Muhtesem';
    }
    // Dr. Sabahi variations
    if (lower.includes('sabahi') || lower.includes('sabahai')) {
        return 'Dr. Sabahi';
    }
    // Laurie/Lori
    if (lower === 'laurie' || lower === 'lauri') {
        return 'Lori';
    }
    // Leila/Laila
    if (lower === 'laila') {
        return 'Leila';
    }
    // The Messenger
    if (lower === 'the messenger') {
        return 'Dr. Khalifa';
    }

    return name;
}

export function parseVttToSegments(vttContent: string): Segment[] {
    const segments: Segment[] = [];
    const normalized = vttContent.replace(/\r\n/g, '\n');
    const blocks = normalized.split('\n\n');

    // Combined pattern - matches anonymous speakers and named speakers
    const allSpeakerPattern = /(?:^|\s)((?:[Aa]\s+woman\s+and\s+a\s+group\s+of\s+children)|(?:[Tt]he\s+messenger)|(?:[Aa]\s+(?:man|woman|child|person|kid))|(?:(?:[Dd]r\.?\s+)?(?:[Tt]he\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)):\s*/g;

    // Known speakers for validation
    const knownSpeakerPrefixes = [
        'dr.', 'dr', 'a man', 'a woman', 'a child', 'a person', 'a kid',
        'the messenger', 'the footnote', 'audience', 'people'
    ];

    let currentSpeaker = 'Dr. Khalifa';
    let segmentId = 0;
    let lastSpeaker = '';

    function isValidSpeaker(name: string): boolean {
        const lower = name.toLowerCase();
        // Filter out false positives
        if (lower.match(/^\d/)) return false;
        if (lower.match(/^\[/)) return false;
        if (lower === 'say' || lower === 'said' || lower === 'says') return false;
        if (lower.match(/^verse/i)) return false;
        if (lower.match(/^ok\./i)) return false;
        if (lower.match(/^chapter/i)) return false;
        if (lower.match(/^sura/i)) return false;
        if (lower.match(/^iron$/i)) return false;
        if (lower.match(/^unity$/i)) return false;
        if (lower.match(/^believers$/i)) return false;
        if (lower.includes('order')) return false;
        if (lower.includes('miracle')) return false;
        if (lower.includes('quran')) return false;
        if (lower.length > 50) return false;

        // Check if it's a known speaker pattern
        const isKnown = knownSpeakerPrefixes.some(p => lower.startsWith(p));
        // Or it's an anonymous speaker pattern
        const isAnonymous = /^a\s+(man|woman|child|person|kid)$/i.test(name);
        // Or it's a single capitalized name (proper noun)
        const isProperNoun = /^[A-Z][a-z]+$/.test(name) || /^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(name);
        // Or it's "Dr. Something"
        const isDrTitle = /^Dr\.?\s+/i.test(name);
        return isKnown || isAnonymous || isProperNoun || isDrTitle;
    }

    for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) continue;
        if (lines[0].startsWith('WEBVTT')) continue;
        if (lines[0].startsWith('NOTE')) continue;
        if (lines[0].startsWith('Kind:')) continue;
        if (lines[0].startsWith('Language:')) continue;

        const timeLineIdx = lines.findIndex(l => l.includes('-->'));
        if (timeLineIdx === -1) continue;

        const timeLine = lines[timeLineIdx];
        const [startStr, endStrPart] = timeLine.split('-->').map(s => s.trim());
        const endStr = endStrPart ? endStrPart.split(' ')[0] : startStr;

        const startTime = parseTimestamp(startStr);
        const endTime = parseTimestamp(endStr);
        const totalDuration = endTime - startTime;

        let content = lines.slice(timeLineIdx + 1).join(' ');
        content = cleanText(content);

        if (!content) continue;

        // Find all speaker mentions in this cue
        const matches = [...content.matchAll(allSpeakerPattern)];
        const validMatches = matches.filter(m => isValidSpeaker(m[1].trim()));

        if (validMatches.length === 0) {
            // No speaker label - use current speaker (continuation)
            const isTransition = currentSpeaker !== lastSpeaker;
            lastSpeaker = currentSpeaker;

            segments.push({
                id: segmentId++,
                segment_index: segmentId - 1,
                start_time: startTime,
                end_time: endTime,
                content: content,
                speaker: currentSpeaker,
                isTransition: isTransition
            });
        } else {
            // Split by speakers
            const subSegments: { speaker: string; content: string }[] = [];

            // Check if there's text before the first speaker
            const firstMatchStart = validMatches[0].index!;
            if (firstMatchStart > 0) {
                const preText = content.substring(0, firstMatchStart).trim();
                if (preText) {
                    subSegments.push({ speaker: currentSpeaker, content: preText });
                }
            }

            // Process each speaker mention
            for (let i = 0; i < validMatches.length; i++) {
                const match = validMatches[i];
                const speakerName = normalizeSpeaker(match[1].trim());
                const contentStart = match.index! + match[0].length;
                const contentEnd = (i < validMatches.length - 1)
                    ? validMatches[i + 1].index!
                    : content.length;

                const speechText = content.substring(contentStart, contentEnd).trim();
                if (speechText) {
                    subSegments.push({ speaker: speakerName, content: speechText });
                }
            }

            // Create segments with proportional timing
            const totalLength = subSegments.reduce((acc, s) => acc + s.content.length, 0) || 1;
            let currentTimeCursor = startTime;

            for (const sub of subSegments) {
                const ratio = sub.content.length / totalLength;
                const subDuration = totalDuration * ratio;

                currentSpeaker = sub.speaker;
                const isTransition = currentSpeaker !== lastSpeaker;
                lastSpeaker = currentSpeaker;

                segments.push({
                    id: segmentId++,
                    segment_index: segmentId - 1,
                    start_time: currentTimeCursor,
                    end_time: currentTimeCursor + subDuration,
                    content: sub.content,
                    speaker: currentSpeaker,
                    isTransition: isTransition
                });

                currentTimeCursor += subDuration;
            }
        }
    }

    return segments;
}
