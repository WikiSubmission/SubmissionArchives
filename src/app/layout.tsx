import type { Metadata } from "next";
import { Inter, Crimson_Text, Cinzel, JetBrains_Mono, Playfair_Display, Rubik, Frank_Ruhl_Libre, Scheherazade_New, Roboto_Slab } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/app/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

const scheherazade = Scheherazade_New({
  weight: ['400', '700'],
  variable: "--font-scheherazade",
  subsets: ["arabic"],
});

const frank = Frank_Ruhl_Libre({
  variable: "--font-frank",
  subsets: ["hebrew"],
});

const crimson = Crimson_Text({
  weight: ['400', '600', '700'],
  variable: "--font-crimson",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const robotoSlab = Roboto_Slab({
  variable: "--font-roboto-slab",
  subsets: ["latin"],
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
                } else {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${playfair.variable} ${rubik.variable} ${scheherazade.variable} ${frank.variable} ${crimson.variable} ${cinzel.variable} ${mono.variable} ${robotoSlab.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
