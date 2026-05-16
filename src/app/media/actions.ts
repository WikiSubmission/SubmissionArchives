'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getMediaHref } from '@/lib/utils';
import {
    checkRateLimit,
    getClientIp,
    hasAdminAccess,
    jsonByteLength,
    resolvePathWithin,
} from '@/lib/security';

const MAX_TRANSCRIPT_SEGMENTS = 5000;
const MAX_TRANSCRIPT_BYTES = 5 * 1024 * 1024;

type LocalMediaItem = {
    id: string;
    folder: string;
    type?: string;
};

// Helper to read local indices without relative path issues
function getLocalIndex(filename: string): LocalMediaItem[] {
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as LocalMediaItem[];
}

function getAudioCatalog() {
    const audios = getLocalIndex('AUDIOS_LIST.json');
    if (audios.length > 0) return audios;

    const masterAudios = getLocalIndex('MASTER_INDEX.json')
        .filter((item) => item.type === 'quran-study' || item.type === 'messenger-audio' || item.type === 'audio');
    if (masterAudios.length > 0) return masterAudios;

    return getLocalIndex('ALL_AUDIOS.json');
}

export async function updateTranscript(mediaId: string, segments: unknown[]) {
    try {
        const requestHeaders = await headers();
        if (!hasAdminAccess(requestHeaders)) {
            return { success: false, error: 'Forbidden' };
        }

        const rateLimit = checkRateLimit(`update-transcript:${getClientIp(requestHeaders)}`, 10);
        if (rateLimit.limited) {
            return { success: false, error: 'Too many transcript updates. Please try again shortly.' };
        }

        if (!Array.isArray(segments) || segments.length > MAX_TRANSCRIPT_SEGMENTS) {
            return { success: false, error: 'Invalid transcript payload' };
        }

        if (jsonByteLength(segments) > MAX_TRANSCRIPT_BYTES) {
            return { success: false, error: 'Transcript payload is too large' };
        }

        console.log(`[Server Action] Updating local transcript for ${mediaId}`);

        // 1. Load local indices
        const allVideos = getLocalIndex('VIDEO_PROGRAMS_LIST.json');
        const allAudios = getAudioCatalog();

        let item = allVideos.find((video) => video.id === mediaId);
        let isVideo = true;

        if (!item) {
            item = allAudios.find((audio) => audio.id === mediaId);
            isVideo = false;
        }

        if (!item) {
            throw new Error(`Media record not found in local index for ID: ${mediaId}`);
        }

        // 2. Resolve Local Save Path
        const publicDir = path.join(process.cwd(), 'public');
        let targetPath: string | null = "";

        if (isVideo) {
            targetPath = resolvePathWithin(publicDir, 'content', 'video', item.folder, `${item.folder}.json`);
        } else {
            const subFolder = item.type === 'quran-study' ? 'quran-studies' : 'messenger-audios';
            targetPath = resolvePathWithin(publicDir, 'content', 'audio', subFolder, item.folder, `${item.folder}.json`);
        }

        if (!targetPath) {
            throw new Error('Resolved transcript path is outside the public content directory');
        }

        // 3. Write to Local File System
        const body = JSON.stringify(segments, null, 2);

        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(targetPath, body, 'utf8');

        console.log(`[Server Action] Successfully saved transcript to ${targetPath}`);

        revalidatePath(getMediaHref(mediaId));
        return { success: true };
    } catch (error: unknown) {
        console.error("[Server Action] Error updating local transcript:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown transcript update error',
        };
    }
}
