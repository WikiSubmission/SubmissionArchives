import type { Metadata } from "next";
import { Libre_Franklin, Amiri } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { WebVitals } from "@/components/analytics/WebVitals";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/config/site";

const libreFranklin = Libre_Franklin({
  variable: "--font-libre-franklin",
  subsets: ["latin"],
});

const amiri = Amiri({
  weight: ['400', '700'],
  variable: "--font-amiri",
  subsets: ["arabic"],
});

const superiorSerif = localFont({
  variable: "--font-local-superior",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/LTSuperiorSerif-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/LTSuperiorSerif-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/LTSuperiorSerif-Bold.otf",
      weight: "700",
      style: "normal",
    },
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
    icon: '/submission-logo.png',
    apple: '/submission-logo.png',
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    images: [{ url: "/og-card.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-card.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var saved = null;
                try {
                  saved = localStorage.getItem('theme');
                } catch (e) {
                  saved = null;
                }
                if (saved === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.dataset.theme = 'light';
                  document.documentElement.style.colorScheme = 'light';
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.dataset.theme = 'dark';
                  document.documentElement.style.colorScheme = 'dark';
                }
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${libreFranklin.variable} ${amiri.variable} ${superiorSerif.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ed-surface focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-ed-fg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ed-accent"
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
