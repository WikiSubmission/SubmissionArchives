// Turns one sampled cover color into the CSS needed for a book's procedural
// spine and top/bottom edge faces, since none of the site's books have real
// spine or back-cover photography.
interface Rgb {
    r: number;
    g: number;
    b: number;
}

export interface BookSpinePalette {
    spineGradient: string;
    textColor: string;
}

export const PAGE_EDGE_GRADIENT =
    'repeating-linear-gradient(90deg, #ede4cd 0px, #ede4cd 1px, #d9cbaa 1px, #d9cbaa 2px)';

// Matches --ed-accent-soft (light theme) in globals.css; used when a book id
// is missing from the generated spine-color map.
export const FALLBACK_SPINE_COLOR = '#525252';

function hexToRgb(hex: string): Rgb {
    const value = parseInt(hex.replace('#', ''), 16);
    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255,
    };
}

function rgbToHex({ r, g, b }: Rgb): string {
    const channelHex = (channel: number) =>
        Math.round(Math.min(255, Math.max(0, channel))).toString(16).padStart(2, '0');
    return `#${channelHex(r)}${channelHex(g)}${channelHex(b)}`;
}

function mix(base: Rgb, target: Rgb, amount: number): Rgb {
    return {
        r: base.r + (target.r - base.r) * amount,
        g: base.g + (target.g - base.g) * amount,
        b: base.b + (target.b - base.b) * amount,
    };
}

function relativeLuminance({ r, g, b }: Rgb): number {
    const channel = (value: number) => {
        const normalized = value / 255;
        return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function getBookSpinePalette(baseColorHex: string): BookSpinePalette {
    const base = hexToRgb(baseColorHex);
    const highlight = rgbToHex(mix(base, { r: 255, g: 255, b: 255 }, 0.22));
    const shadow = rgbToHex(mix(base, { r: 0, g: 0, b: 0 }, 0.3));

    return {
        spineGradient: `linear-gradient(100deg, ${highlight} 0%, ${baseColorHex} 45%, ${shadow} 100%)`,
        textColor: relativeLuminance(base) > 0.4 ? '#1a1208' : '#f5f0e6',
    };
}
