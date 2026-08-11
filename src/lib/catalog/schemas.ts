import { z } from 'zod';

// Schemas for the hand-maintained catalog sources in data/catalog. These are the files a
// person edits, so they are where a typo actually enters the system — the generated
// MASTER_INDEX is already checked by scripts/lib/archive-schema.mjs.
//
// Deliberately non-strict: unknown keys pass. These files carry editorial metadata that
// the app does not read, and failing a build over a field nobody consumes would train
// people to distrust the check.

const MediaEntrySchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    displayTitle: z.string().min(1).optional(),
    type: z.enum(['video-program', 'sermon', 'video', 'quran-study', 'messenger-audio', 'audio']),
    author: z.string().optional(),
    // These asset fields use explicit null to mean "this record has no such file", so
    // null is valid data rather than a mistake — nullish, not merely optional.
    thumbnailOverride: z.string().nullish(),
    folder: z.string().nullish(),
    vttFile: z.string().nullish(),
    audioFile: z.string().nullish(),
    videoFile: z.string().nullish(),
    youtubeId: z.string().nullish(),
    youtubeUrl: z.string().url().nullish(),
    duration_seconds: z.number().nonnegative().nullish(),
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

const AppendixEditionConfigSchema = z.object({
    sharedPdf: z.string().optional(),
    splitPdfs: z.boolean().optional(),
    startPages: z.record(z.string(), z.number().int().positive()).optional(),
});

export const AppendixCatalogSchema = z.object({
    primaryEdition: z.enum(['1981', '1989', '1992']),
    editions: z.record(z.string(), AppendixEditionConfigSchema),
});

export const CATALOG_SCHEMAS = [
    { file: 'audios.json', schema: AudioCatalogSchema },
    { file: 'videos.json', schema: VideoCatalogSchema },
    { file: 'newsletters.json', schema: NewsletterCatalogSchema },
    { file: 'appendix-editions.json', schema: AppendixCatalogSchema },
] as const;
