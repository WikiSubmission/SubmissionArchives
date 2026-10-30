import { z } from 'zod';

// Schemas for the hand-maintained catalog sources in data/catalog. These are the files a
// person edits, so they are where a typo actually enters the system — the generated
// MASTER_INDEX is already checked by scripts/lib/archive-schema.mjs.
//
// Deliberately non-strict: unknown keys pass. These files carry editorial metadata that
// the app does not read, and failing a build over a field nobody consumes would train
// people to distrust the check.

export const ProvenanceSchema = z.object({
    originalDate: z.string().max(100).optional(),
    dateKind: z.enum(['recorded', 'published', 'uploaded', 'unknown']).optional(),
    dateConfidence: z.enum(['verified', 'catalog', 'unknown']).optional(),
    edition: z.string().max(100).optional(), sourceUrl: z.string().url().optional(),
    verification: z.enum(['verified', 'unverified', 'unknown']).optional(),
    speakerAttribution: z.enum(['verified', 'uncertain', 'unknown']).optional(),
    transcription: z.string().max(1000).optional(),
});

const ChapterSchema = z.object({
    id: z.number(),
    startTime: z.number(),
    endTime: z.number().nullish(),
    title: z.string(),
    description: z.string().optional(),
    speaker: z.string().optional(),
});

const MediaEntrySchema = z.object({
    provenance: ProvenanceSchema.optional(),
    id: z.string().min(1),
    title: z.string().min(1),
    displayTitle: z.string().min(1).optional(),
    description: z.string().nullish(),
    type: z.enum(['video-program', 'sermon', 'video', 'quran-study', 'messenger-audio', 'audio']),
    author: z.string().optional(),
    // These asset fields use explicit null to mean "this record has no such file", so
    // null is valid data rather than a mistake — nullish, not merely optional.
    thumbnailOverride: z.string().nullish(),
    folder: z.string().nullish(),
    vttFile: z.string().nullish(),
    videoFile: z.string().nullish(),
    youtubeId: z.string().nullish(),
    youtubeUrl: z.string().url().nullish(),
    duration_seconds: z.number().nonnegative().nullish(),
    chapters: z.array(ChapterSchema).optional(),
    // Filled in by enrich_media_years.mjs from the YouTube upload date for records whose
    // title states no date of its own. dateSource distinguishes that from a date read
    // directly off the title (the generator's own deriveDateFromTitle), since an upload
    // date is not always the same fact as when something was originally recorded.
    year: z.number().int().min(1960).max(2100).optional(),
    fullDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dateSource: z.enum(['youtube_upload_date']).optional(),
});

export const AudioCatalogSchema = z.array(MediaEntrySchema);
export const VideoCatalogSchema = z.array(MediaEntrySchema);

export const NewsletterCatalogSchema = z.object({
    schema_version: z.union([z.string(), z.number()]).optional(),
    issues: z.array(
        z.object({
            issue_id: z.string().min(1),
            date_label: z.string().min(1),
            year: z.number().int(),
            month_number: z.number().int().min(1).max(12),
            month_name: z.string().min(1),
            source_file: z.string().optional(),
            edition_type: z.string().optional(),
        }),
    ).min(1),
});

export const CATALOG_SCHEMAS = [
    { file: 'audios.json', schema: AudioCatalogSchema },
    { file: 'videos.json', schema: VideoCatalogSchema },
    { file: 'newsletters.json', schema: NewsletterCatalogSchema },
] as const;
