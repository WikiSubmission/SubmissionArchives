import {
    Amiri,
    Cinzel,
    Crimson_Text,
    Inter,
    JetBrains_Mono,
    Playfair_Display,
    Roboto_Slab,
    Rubik,
    Scheherazade_New,
    Sora,
    Frank_Ruhl_Libre,
    IBM_Plex_Mono,
} from 'next/font/google';

export const amiri = Amiri({
    weight: ['400', '700'],
    variable: '--font-amiri',
    subsets: ['arabic', 'latin'],
    display: 'swap',
});

export const crimson = Crimson_Text({
    weight: ['400', '600', '700'],
    variable: '--font-crimson',
    subsets: ['latin'],
    display: 'swap',
});

export const cinzel = Cinzel({
    variable: '--font-cinzel',
    subsets: ['latin'],
    display: 'swap',
});

export const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
    display: 'swap',
});

export const mono = JetBrains_Mono({
    variable: '--font-mono',
    subsets: ['latin'],
    display: 'swap',
});

export const robotoSlab = Roboto_Slab({
    variable: '--font-roboto-slab',
    subsets: ['latin'],
    display: 'swap',
});

export const playfair = Playfair_Display({
    variable: '--font-playfair',
    subsets: ['latin'],
    display: 'swap',
});

export const rubik = Rubik({
    variable: '--font-rubik',
    subsets: ['latin'],
    display: 'swap',
});

export const scheherazade = Scheherazade_New({
    weight: ['400', '700'],
    variable: '--font-scheherazade',
    subsets: ['arabic'],
    display: 'swap',
});

export const frank = Frank_Ruhl_Libre({
    variable: '--font-frank',
    subsets: ['hebrew', 'latin'],
    display: 'swap',
});

export const sora = Sora({
    variable: '--font-sora',
    subsets: ['latin'],
    display: 'swap',
});

export const ibmPlexMono = IBM_Plex_Mono({
    weight: ['400', '500', '600', '700'],
    variable: '--font-ibm-plex-mono',
    subsets: ['latin'],
    display: 'swap',
});

export const F = {
    logo: "'Roboto Slab', serif",
    display: 'var(--font-crimson), Georgia, serif',
    body: 'var(--font-amiri), Georgia, serif',
    heading: 'var(--font-cinzel), serif',
    ui: 'var(--font-inter), system-ui, sans-serif',
    mono: 'var(--font-mono), monospace',
    arabic: 'var(--font-amiri), serif',
    quran: 'var(--font-scheherazade), serif',
} as const;
