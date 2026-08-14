export const ARCHIVE_RECORD_TYPES = [
    'video-program',
    'sermon',
    'video',
    'quran-study',
    'messenger-audio',
    'audio',
    'perspective',
    'appendix',
    'other',
    'quran',
] as const;

export type ArchiveRecordType = (typeof ARCHIVE_RECORD_TYPES)[number];

export type ArchiveTranscriptStatus = 'available' | 'empty' | 'missing';

export interface ArchiveSegment {
    start: number;
    end: number;
    text: string;
    speaker?: string;
    page?: number;
    label?: string;
}

export interface ArchiveRecord {
    id: string;
    title: string;
    displayTitle?: string;
    type: ArchiveRecordType;
    category: string;
    author?: string;
    date?: string;
    fullDate?: string;
    year?: number;
    thumbnailOverride?: string;
    folder?: string;
    filename?: string;
    pdfLink?: string;
    videoFile?: string;
    vttFile?: string;
    primaryNumber?: number;
    alternateNumbers?: string[];
    alternateNumberLabel?: string;
    youtubeId?: string;
    youtubeUrl?: string;
    youtubeStartTime?: number;
    youtubeEndTime?: number;
    aliases?: string[];
    transcriptionSource?: string;
    transcriptionMethod?: string;
    transcriptionQuality?: {
        meanOcrConfidence?: number;
        lowConfidencePages?: number;
        unverifiedArabicSegments?: number;
    };
    editionYear?: number;
    transcriptStatus: ArchiveTranscriptStatus;
    segmentCount: number;
    segments: ArchiveSegment[];
}

export interface ArchiveBookSummary {
    id: string;
    title: string;
    displayTitle: string;
    type: 'other';
    author: string;
    filename: string;
    pdfLink: string;
    thumbnailOverride?: string;
    transcriptionSource?: string;
    transcriptionMethod?: string;
    transcriptionQuality?: ArchiveRecord['transcriptionQuality'];
    editionYear?: number;
    transcriptStatus: ArchiveTranscriptStatus;
    segmentCount: number;
}
