const PUBLIC_BASE_URL = (
    process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    process.env.R2_PUBLIC_BASE_URL ||
    process.env.R2_PUBLIC_URL ||
    ''
).replace(/\/+$/, '');

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
    if (!PUBLIC_BASE_URL || !key.startsWith('content/')) {
        return localPath.startsWith('/') ? localPath : `/${key}`;
    }

    return `${PUBLIC_BASE_URL}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

export function getProxiedMediaUrl(publicUrl: string) {
    if (!publicUrl || !/^https?:\/\//i.test(publicUrl)) return publicUrl;
    return `/api/proxy-media?url=${encodeURIComponent(publicUrl)}`;
}

export function getMediaAssetUrl(item: {
    type?: string;
    folder?: string;
    videoFile?: string | null;
    audioFile?: string | null;
}) {
    if (item.videoFile && item.folder) {
        return getPublicAssetUrl(`/content/video/${item.folder}/${item.videoFile}`);
    }

    if (item.audioFile && item.folder) {
        const subFolder = item.type === 'quran-study' ? 'quran-studies' : 'messenger-audios';
        return getPublicAssetUrl(`/content/audio/${subFolder}/${item.folder}/${item.audioFile}`);
    }

    return '';
}
