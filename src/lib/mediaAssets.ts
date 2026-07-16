export function getAssetKey(localPath: string | null | undefined) {
    if (!localPath) return '';
    return localPath
        .replace(/\\/g, '/')
        .replace(/^https?:\/\/[^/]+\//i, '')
        .replace(/^\/?public\//, '')
        .replace(/^\/+/, '');
}

export function getPublicAssetUrl(localPath: string | null | undefined) {
    if (!localPath) return '';
    if (/^https?:\/\//i.test(localPath)) return localPath;

    const key = getAssetKey(localPath);
    const encodedKey = key
        .split('/')
        .map((segment) => {
            let decoded = segment;
            try {
                decoded = decodeURIComponent(segment);
            } catch {
                // Preserve malformed legacy escapes as literal filename text.
            }
            return encodeURIComponent(decoded).replace(/[!'()*]/g, (character) =>
                `%${character.charCodeAt(0).toString(16).toUpperCase()}`
            );
        })
        .join('/');
    return `/${encodedKey}`;
}

function parseTimeValue(value: string | null | undefined) {
    if (!value) return 0;

    const time = decodeURIComponent(value).trim().toLowerCase();
    if (!time) return 0;

    if (/^\d+(?:\.\d+)?$/.test(time)) {
        return Number(time);
    }

    const colonParts = time.split(':');
    if (colonParts.length > 1 && colonParts.every((part) => /^\d+(?:\.\d+)?$/.test(part))) {
        return colonParts.reduce((total, part) => total * 60 + Number(part), 0);
    }

    const unitMatch = time.match(/^(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?$/);
    if (unitMatch && unitMatch.slice(1).some(Boolean)) {
        return (
            Number(unitMatch[1] || 0) * 3600 +
            Number(unitMatch[2] || 0) * 60 +
            Number(unitMatch[3] || 0)
        );
    }

    return 0;
}

function getUrlTimeParam(url: string | null | undefined) {
    if (!url) return 0;

    try {
        const parsed = new URL(url);
        return parseTimeValue(parsed.searchParams.get('t') || parsed.searchParams.get('start'));
    } catch {
        const match = url.match(/[?&](?:t|start)=([^&]+)/i);
        return parseTimeValue(match?.[1]);
    }
}

function getFiniteTime(value: number | null | undefined) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

export function getMediaPlaybackWindow(item: {
    youtubeUrl?: string | null;
    youtubeStartTime?: number | null;
    youtubeEndTime?: number | null;
}) {
    return {
        startTime: getFiniteTime(item.youtubeStartTime) || getUrlTimeParam(item.youtubeUrl),
        endTime: getFiniteTime(item.youtubeEndTime),
    };
}

export function getMediaAssetUrl(item: {
    type?: string;
    displayTitle?: string;
    id?: string;
    youtubeUrl?: string | null;
    youtubeId?: string | null;
}) {
    if (item.youtubeId) {
        return `https://www.youtube.com/watch?v=${item.youtubeId}`;
    }
    if (item.youtubeUrl) {
        return item.youtubeUrl;
    }

    console.error(`[mediaAssets] "${item.displayTitle}" (${item.id}) is missing a youtubeId. Playback requires YouTube.`);
    return '';
}
