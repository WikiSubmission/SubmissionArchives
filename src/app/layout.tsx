import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Amiri, Libre_Franklin } from 'next/font/google';
import localFont from 'next/font/local';

import { WebVitals } from '@/components/analytics/WebVitals';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/config/site';

import './globals.css';

const libreFranklin = Libre_Franklin({
    variable: '--font-libre-franklin',
    subsets: ['latin'],
    display: 'swap',
});

const amiri = Amiri({
    weight: ['400', '700'],
    variable: '--font-amiri',
    subsets: ['arabic'],
    display: 'swap',
});

const superiorSerif = localFont({
    variable: '--font-local-superior',
    display: 'swap',
    src: [
        { path: '../../public/fonts/LTSuperiorSerif-Regular.otf', weight: '400', style: 'normal' },
        { path: '../../public/fonts/LTSuperiorSerif-Medium.otf', weight: '500', style: 'normal' },
        { path: '../../public/fonts/LTSuperiorSerif-Bold.otf', weight: '700', style: 'normal' },
    ],
});

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: SITE_NAME,
        template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
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
        images: [{ url: '/og-card.png', width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
        card: 'summary_large_image',
        images: ['/og-card.png'],
    },
};

export const viewport: Viewport = {
    colorScheme: 'dark light',
    themeColor: [
        { media: '(prefers-color-scheme: dark)', color: '#191817' },
        { media: '(prefers-color-scheme: light)', color: '#eee8dc' },
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
        <html lang="en" className="dark" data-theme="dark" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
            </head>
            <body className={`${libreFranklin.variable} ${amiri.variable} ${superiorSerif.variable} antialiased`}>
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ed-fg focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-ed-bg"
                >
                    Skip to content
                </a>
                <ThemeProvider>
                    <WebVitals />
                    <Header />
                    {children}
                    <Footer />
                </ThemeProvider>
            </body>
        </html>
    );
}
