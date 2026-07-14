export interface Media {
    id: string;
    title: string;
    displayTitle: string;
    type: string; // Keeping broad for now, can narrow specific types if needed: 'sermon' | 'quran-study' | 'audio' | 'messenger-audio' | 'video-program'
    author: string;
    duration_seconds?: number;
    sortValue: number;
    displayDate: string;
    date?: string;
    description?: string;
    filename?: string;
    thumbnailOverride?: string;
    folder?: string;
    youtubeId?: string;
    youtubeUrl?: string;
    youtubeStartTime?: number;
    youtubeEndTime?: number;
    primaryNumber?: number;
    alternateNumbers?: string[];
    alternateNumberLabel?: string;
}

export interface Newsletter {
    id: string;
    title: string;
    description: string;
    date: string;
    fullDate: string;
    filename: string;
    pdfLink?: string;
}

export interface ThemeColors {
    bg: string;
    card: string;
    border: string;
    borderHover: string;
    text: string;
    textMuted: string;
    textVeryMuted: string;
    input: string;
    header: string;
    statsBar: string;
    button: string;
    highlight?: string;
    yearHeader?: string;
}
