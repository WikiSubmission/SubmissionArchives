
export interface FormattedMedia {
    displayTitle: string;
    displayDate: string;
    author: string;
    topics: string[];
    sortValue: number; // Timestamp for date-based, or number for numeric
}

export function formatMedia(item: { title: string; date?: string; type: string; created_at?: string }): FormattedMedia {
    const rawTitle = item.title;
    let displayTitle = rawTitle;
    let displayDate = item.date || '';
    let author = 'Dr. Rashad Khalifa';
    let topics: string[] = [];
    let sortValue = item.created_at ? new Date(item.created_at).getTime() : 0;

    // --- Quran Study ---
    // Sort: Numerical (Chronological Numerical Order)
    if (item.type === 'quran-study') {
        // 1. Extract Number
        const numberMatch = rawTitle.match(/^(\d+)\)/);
        const numberPrefix = numberMatch ? numberMatch[1] : '';
        if (numberPrefix) {
            sortValue = parseFloat(numberPrefix);
        }

        // 2. Extract Surah
        const suraMatch = rawTitle.match(/Sura\s+([\d_]+(?:,\s*[\d_]+)*)/i);
        const suraRef = suraMatch ? `Surah ${suraMatch[1].replace(/_/g, ':')}` : '';

        // 3. Extract Topics
        let cleanText = rawTitle
            .replace(/^(\d+\))/, '')
            .replace(/Quran\s+Study/i, '')
            .replace(/\d{1,2}[/⧸-]\d{1,2}[/⧸-]\d{2,4}/, '') // Handle both slash types
            .replace(/Sura\s+[\d_,]+/i, '')
            .replace(/by\s+[\w\s]+(?:,|$)/i, '')
            .replace(/Rashad\s+Khalifa/i, '')
            .replace(/-/, '')
            .trim();

        const rawTopics = cleanText.split(',').map(t => t.trim()).filter(t => t.length > 2);
        topics = rawTopics
            .filter(t => !t.toLowerCase().startsWith('edip wanted') && !t.includes('...'))
            .slice(0, 3)
            .map(t => toTitleCase(t));

        // Construct Display Title
        displayTitle = `${numberPrefix ? numberPrefix + ') ' : ''}Quran Study`;
        if (suraRef) displayTitle += `: ${suraRef}`;
        if (topics.length > 0) {
            displayTitle += ` - ${topics.join(', ')}`;
        }

        // Extract Date
        if (!displayDate) {
            const dateMatch = rawTitle.match(/(\d{1,2}[/⧸-]\d{1,2}[/⧸-]\d{2,4})/);
            if (dateMatch) displayDate = dateMatch[1].replace(/⧸/g, '/');
        }
    }

    // --- Sermons ---
    // Sort:  Chronological Date Order
    // Title: Date in Title
    else if (item.type === 'sermon') {
        // Patterns: 
        // 1. "N) FS Date"
        // 2. "FS Date"
        // Date formats: "Dec 4 1987", "Nov 1987.3", "12/21/89"

        // Attempt to find date string
        let foundDate = '';
        let part = 0;

        // Regex for standard textual date: (Jan|Feb...) D, Y
        const textDateMatch = rawTitle.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}/i);

        // Regex for Month Year (part) e.g. Nov 1987.3
        const monthYearMatch = rawTitle.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}(?:\.(\d+))?/i);

        // Regex for numeric date 12/21/89
        const numDateMatch = rawTitle.match(/(\d{1,2}[/⧸-]\d{1,2}[/⧸-]\d{2,4})/);

        if (textDateMatch) {
            foundDate = textDateMatch[0];
        } else if (monthYearMatch) {
            foundDate = monthYearMatch[0].split('.')[0]; // Nov 1987
            if (monthYearMatch[1]) part = parseInt(monthYearMatch[1]);
        } else if (numDateMatch) {
            foundDate = numDateMatch[1].replace(/⧸/g, '/');
        }

        if (foundDate) {
            displayDate = foundDate;
            // Parse to timestamp
            const ts = Date.parse(foundDate.replace(/,/g, '')); // Basic parse
            if (!isNaN(ts)) {
                sortValue = ts + (part * 1000); // Add seconds for parts to keep order
            }
        }

        // --- Specific Renames (User Request) ---
        // Check raw title or found date to map to specific titles
        const lowerTitle = rawTitle.toLowerCase();

        // "June 5, 1987" -> "God Is Running Everything 1"
        if (lowerTitle.includes('jun') && lowerTitle.includes('5') && lowerTitle.includes('1987')) {
            displayTitle = "God Is Running Everything 1";
        }
        // "July 1987" -> "God Is Running Everything 2"
        // Handle duplicates: 2) and 3)
        else if (lowerTitle.includes('jul') && lowerTitle.includes('1987')) {
            displayTitle = "God Is Running Everything 2";
            // Heuristic to distinguish duplicate files
            if (rawTitle.startsWith('3)')) {
                displayTitle += " (Part 2)";
            } else if (rawTitle.startsWith('2)')) {
                displayTitle += " (Part 1)";
            }
            if (part > 0) displayTitle += ` (Part ${part})`; // Persist parsed part if exists
        }
        // "August 1987" -> "Universal Unity"
        else if (lowerTitle.includes('aug') && lowerTitle.includes('1987')) {
            displayTitle = "Universal Unity";
            if (part > 0) displayTitle += ` (Part ${part})`;
        }
        // Default: Just the Date (No "Friday Sermon" prefix)
        else if (foundDate) {
            displayTitle = foundDate;
            if (part > 0) displayTitle += ` (Part ${part})`;

            // Append extra text if it's substantial
            let extraText = rawTitle
                .replace(/^\d+\)\s*/, '')
                .replace(/^FS\s+/, '')
                .replace(foundDate, '')
                .replace(monthYearMatch ? monthYearMatch[0] : '', '')
                .replace(/^\s*[-,]\s*/, '')
                .trim();

            if (extraText.length > 2 && !extraText.match(/^\d+$/)) {
                displayTitle += `: ${toTitleCase(extraText)}`;
            }
        } else {
            // Fallback if no date found title
            displayTitle = rawTitle.replace(/^\d+\)\s*/, '').replace(/^FS\s*/, 'Sermon: ');
        }
    }

    // --- Audio ---
    // Sort: Chronological Numerical Order
    else if (item.type === 'audio' || item.type === 'messenger-audio') {
        // Handle both standard '|' and fullwidth '｜'
        const pipeMatch = rawTitle.match(/[\|｜]\s*(\d+(?:\.\d+)?)/);
        const prefixMatch = rawTitle.match(/^(\d+)\)/); // "43) Third International"

        if (pipeMatch) {
            sortValue = parseFloat(pipeMatch[1]);
            displayTitle = `Messenger Audio ${pipeMatch[1]}`;
        } else if (prefixMatch) {
            sortValue = parseFloat(prefixMatch[1]);
            // Keep original title or clean it?
            // "43) Third International" -> "Third International"
            displayTitle = rawTitle.replace(/^\d+\)\s*/, '');
        }
    }

    return {
        displayTitle,
        displayDate,
        author,
        topics,
        sortValue
    };
}

function toTitleCase(str: string) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
