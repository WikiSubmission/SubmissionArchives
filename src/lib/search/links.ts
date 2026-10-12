// Compose query parameters without discarding a query or fragment already present.
export function withSearchParams(href: string, values: Record<string, string | number | undefined>) {
    const url = new URL(href, 'https://archive.invalid');
    for (const [key, value] of Object.entries(values)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
    }
    return url.pathname + url.search + url.hash;
}
