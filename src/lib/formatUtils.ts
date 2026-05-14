
export interface FormattedMedia {
    displayTitle: string;
    displayDate: string;
    author: string;
    sortValue: number; // Timestamp for date-based, or number for numeric
}

import { STUDY_TITLES, STUDY_TITLES_BY_INDEX } from './studyTitles';
import { PLAYLIST_ORDER } from './playlistOrder';

export function formatMedia(item: { title: string; date?: string; type: string; created_at?: string; id?: string }): FormattedMedia {
    const rawTitle = item.title;
    let displayTitle = rawTitle;
    let displayDate = item.date || '';
    const author = 'Dr. Rashad Khalifa';
    let sortValue = item.created_at ? new Date(item.created_at).getTime() : 0;

    // --- Quran Study ---
    // Sort: Numerical (Chronological Numerical Order)
    if (item.type === 'quran-study') {
        const rawTitle = item.title;

        // RESET sortValue to 0. We do NOT want the timestamp (default) to be used as the index 
        // if no number is found in the title.
        sortValue = 0;

        // 1. ALWAYS Extract Sort Value from Title First (e.g. "1) ...")
        const sortMatch = rawTitle.match(/^(\d+)[).]/);
        if (sortMatch) {
            sortValue = parseInt(sortMatch[1]);
        } else {
            // Fallback: Try #Number
            const hashMatch = rawTitle.match(/#(\d+)/);
            if (hashMatch) {
                sortValue = parseFloat(hashMatch[1]);
            }
        }

        // 2. Determine Display Title

        // A. Primary Strategy: Index-Based Lookup (User Provided 1-52 list)
        if (sortValue > 0 && STUDY_TITLES_BY_INDEX[sortValue]) {
            displayTitle = STUDY_TITLES_BY_INDEX[sortValue];
        }
        // B. Fallback: Old Strategy (String Lookup / Clean Raw)
        else {
            // Normalize for lookup
            const normalizedTitle = rawTitle
                .toLowerCase()
                .replace(/\.(mp3|m4a|wav)$/i, '')
                .replace(/&amp;/g, '&')
                .replace(/⧸/g, '/')
                .replace(/\u00A0/g, ' ')
                .replace(/['’‘]/g, "'")
                .replace(/["“”]/g, '"')
                .replace(/[-–—]/g, '-')
                .replace(/\s+/g, ' ')
                .trim();

            let foundTitle = null;
            if (STUDY_TITLES[normalizedTitle]) {
                foundTitle = STUDY_TITLES[normalizedTitle];
            } else if (STUDY_TITLES[rawTitle]) {
                foundTitle = STUDY_TITLES[rawTitle];
            } else if (item.id && STUDY_TITLES[item.id]) {
                foundTitle = STUDY_TITLES[item.id];
            }

            if (foundTitle) {
                displayTitle = foundTitle;
                // Ensure format "N) Title"
                if (sortValue > 0 && !displayTitle.match(/^\d+[).]/)) {
                    displayTitle = `${sortValue}) ${displayTitle}`;
                }
            } else {
                // Clean up raw logic...
                let clean = rawTitle.replace(/\.(mp3|m4a|wav)$/i, '');
                clean = clean.replace(/^(\d+)[). -]+/, '');
                // Preserve "Quran Study" in title - only STUDY_TITLES_BY_INDEX lookup should control format
                // clean = clean.replace(/Quran\s*Study/i, '');
                clean = clean.replace(/Audio/i, '');
                clean = clean
                    .replace(/_/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                if (clean.length > 0) {
                    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
                }
                if (sortValue > 0) {
                    displayTitle = `${sortValue}) ${clean || 'Quran Study'}`;
                } else {
                    displayTitle = clean || rawTitle;
                }
            }
        }
    }

    // --- Sermons ---
    // Sort:  Chronological Date Order
    // Title: Date in Title
    // --- Sermons & Video Programs (Mapped from Playlist) ---
    else if (item.type === 'sermon' || item.type === 'video-program') {
        // Clean the input title to match the map keys (filename without extension)
        const cleanName = rawTitle.replace(/\.(mp4|mp3)$/i, '');

        if (PLAYLIST_ORDER[cleanName]) {
            sortValue = PLAYLIST_ORDER[cleanName];
            displayTitle = cleanName;
        } else {
            // Fallback for unmapped items (shouldn't happen for the main playlist, but useful for others)
            displayTitle = rawTitle
                .replace(/^temp_\d+_\d+\s*/i, '') // Legacy cleanup
                .replace(/Friday\s+Sermon\s+(?:by\s+(?:dr\.?\s+)?Rashad\s+Khalifa)?/i, '')
                .replace(/\.(mp4|mp3)$/i, '')
                .replace(/^\d+\)\s*/, '')
                .trim();

            // Try to extract date for unmapped sermons as fallback sort
            if (item.type === 'sermon') {
                const textDateMatch = rawTitle.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}/i);
                if (textDateMatch) {
                    const ts = Date.parse(textDateMatch[0]);
                    if (!isNaN(ts)) sortValue = ts;
                    displayDate = textDateMatch[0];
                }
            }
        }

        // Remove YouTube IDs in brackets from display title (e.g., [j6WwnOk44MU])
        displayTitle = displayTitle.replace(/\s*\[([a-zA-Z0-9_-]{11})\]\s*/g, '').trim();
    }

    // --- Audio ---
    // Sort: Chronological Numerical Order
    else if (item.type === 'audio' || item.type === 'messenger-audio') {
        // Handle both standard '|' and full-width '｜'
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

    // --- Video Programs (NEW) ---


    return {
        displayTitle,
        displayDate,
        author,
        sortValue
    };
}

function toTitleCase(str: string) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
