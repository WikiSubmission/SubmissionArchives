import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Roboto_Slab, Amiri, Sora } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import { WebVitals } from "@/app/components/WebVitals";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const amiri = Amiri({
  weight: ['400', '700'],
  variable: "--font-amiri",
  subsets: ["arabic"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const robotoSlab = Roboto_Slab({
  variable: "--font-roboto-slab",
  subsets: ["latin"],
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

const glacial = localFont({
  variable: "--font-local-glacial",
  display: "swap",
  src: "../../public/fonts/GlacialIndifference-Regular.ttf",
});

export const metadata: Metadata = {
  title: "Submission Archives",
  description: "Dr. Rashad Khalifa - Sermons, Studies, and Audio",
  icons: {
    icon: '/submission-logo.png',
    apple: '/submission-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const saved = localStorage.getItem('theme');
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
        className={`${inter.variable} ${amiri.variable} ${sora.variable} ${mono.variable} ${robotoSlab.variable} ${superiorSerif.variable} ${glacial.variable} font-sans antialiased`}
      >
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
