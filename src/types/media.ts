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
    primaryNumber?: number;
    alternateNumbers?: string[];
    alternateNumberLabel?: string;
    chapters?: Chapter[];
}

export interface Chapter {
    id: number;
    startTime: number;
    endTime?: number;
    title: string;
    description?: string;
    speaker?: string;
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
