import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';
import { Amiri, Inter, JetBrains_Mono, Roboto_Slab } from 'next/font/google';
import localFont from 'next/font/local';

import { WebVitals } from '@/components/analytics/WebVitals';
import ErrorReporter from '@/components/analytics/ErrorReporter';
import { GlobalMediaPlayerProvider } from '@/components/player/GlobalMediaPlayer';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/config/site';

import './globals.css';

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
    display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
    variable: '--font-jetbrains-mono',
    subsets: ['latin'],
    display: 'swap',
});

// Arabic and slab are used by a minority of surfaces (scripture, newsletter mastheads,
// homepage headings), so they are kept out of the critical preload path. They still load
// on demand wherever `font-arabic` / `font-slab` is applied — this only stops every page
// from paying to preload them up front.
const amiri = Amiri({
    weight: ['400', '700'],
    variable: '--font-amiri',
    subsets: ['arabic'],
    display: 'swap',
    preload: false,
});

const robotoSlab = Roboto_Slab({
    variable: '--font-roboto-slab',
    subsets: ['latin'],
    display: 'swap',
    preload: false,
});

const superiorSerif = localFont({
    variable: '--font-local-superior',
    display: 'swap',
    src: [
        { path: '../../public/fonts/LTSuperiorSerif-Regular.woff2', weight: '400', style: 'normal' },
        { path: '../../public/fonts/LTSuperiorSerif-Medium.woff2', weight: '500', style: 'normal' },
        { path: '../../public/fonts/LTSuperiorSerif-Bold.woff2', weight: '700', style: 'normal' },
    ],
});

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: SITE_NAME,
        template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    manifest: '/manifest.json',
    icons: {
        icon: [
            { url: '/assets/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
            { url: '/assets/brand/submission-archives-mark-192.png', sizes: '192x192', type: 'image/png' },
        ],
        apple: [{ url: '/assets/brand/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        url: SITE_URL,
        images: [{ url: '/digi.png', width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
        card: 'summary_large_image',
        images: ['/digi.png'],
    },
};

export const viewport: Viewport = {
    colorScheme: 'dark light',
    themeColor: [
        { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
        { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    ],
};

const themeBootstrapScript = `
(function () {
  var theme = 'dark';
  try {
    theme = localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
  } catch (_) {}
  var root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
})();`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="en" className="dark" data-theme="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
            <head>
                <Script id="theme-bootstrap" strategy="beforeInteractive">
                    {themeBootstrapScript}
                </Script>
            </head>
            <body className={`${inter.variable} ${jetbrainsMono.variable} ${amiri.variable} ${superiorSerif.variable} ${robotoSlab.variable} antialiased`}>
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ed-fg focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-ed-bg"
                >
                    Skip to content
                </a>
                <ThemeProvider>
                    <WebVitals />
                    <ErrorReporter />
                    <GlobalMediaPlayerProvider>
                        <Header />
                        {children}
                        <Footer />
                    </GlobalMediaPlayerProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
