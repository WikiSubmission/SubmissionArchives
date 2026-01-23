'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, FileText, Hash, User, Moon, Sun } from 'lucide-react';
import { ThemeColors } from '@/types/media';
import { getTheme } from '@/lib/theme';
import { useTheme } from '../../components/ThemeProvider';
import DigitalRain from '@/components/effects/DigitalRain';
import Header from '@/components/layout/Header';

interface Quote {
    text: string;
    reference: string;
}

interface ContentSection {
    title?: string;
    image?: {
        src: string;
        alt: string;
        caption?: string;
    };
    content?: string[];
    quotes?: Quote[];
    center_block?: {
        content: string[];
    };
}

interface NewsletterPage {
    page: number;
    sections: ContentSection[];
}

interface NewsletterDocument {
    header: {
        title: string;
        subtitle: string;
        tagline: string;
        date: string;
        issue_date: string;
        issue_no: string;
        editor: string;
        basmala_arabic: string;
        basmala_english: string;
        pdf_link: string;
    };
    pages: NewsletterPage[];
}

interface NewsletterData {
    month: string;
    year: string;
    document: NewsletterDocument;
}

interface NewsletterClientProps {
    data: NewsletterData;
    id: string;
    prevId: string | null;
    nextId: string | null;
}

// Reusable Verse/Quote Block Component
const VerseBlock = ({ text, reference }: { text: string, reference: string }) => (
    <span className="block my-6 pl-4 border-l-4 border-violet-500 bg-zinc-50/50 dark:bg-black p-4 rounded-r-sm">
        <span className="block text-lg md:text-xl font-sora italic mb-2 text-zinc-800 dark:text-white leading-relaxed">
            "{text}"
        </span>
        <span className="block text-[10px] font-mono font-bold tracking-widest text-violet-600 dark:text-violet-400 uppercase opacity-90">
            {reference}
        </span>
    </span>
);

// Helper to parse content and embed verses
const parseContent = (text: string, theme: ThemeColors) => {
    // Regex to match quotes followed by a citation like (Quran 15:9), (Qur'an 15:9) or (15:9)
    // Matches: "some text" (Quran 15:9) or (15:9) and optionally a trailing dot or comma
    const verseRegex = /"([^"]+)"\s*\((?:Qur['’]?an\s*)?(\d+):(\d+(?:-\d+)?)\)[\.,]?/gi;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = verseRegex.exec(text)) !== null) {
        // Text before the match
        if (match.index > lastIndex) {
            parts.push(<span key={`text-${lastIndex}`} className="font-sora">{text.slice(lastIndex, match.index)}</span>);
        }

        const [fullMatch, quote, sura, ayah] = match;

        // The Verse Embed
        parts.push(
            <VerseBlock key={`verse-${match.index}`} text={quote} reference={`Quran ${sura}:${ayah}`} />
        );

        lastIndex = match.index + fullMatch.length;
    }

    // Remaining text
    if (lastIndex < text.length) {
        parts.push(<span key={`text-${lastIndex}`} className="font-sora">{text.slice(lastIndex)}</span>);
    }

    return parts;
};

export default function NewsletterClient({ data, id, prevId, nextId }: NewsletterClientProps) {
    const { darkMode } = useTheme();
    const theme = getTheme(darkMode);

    // Safety check for empty data
    if (!data || !data.document) {
        return (
            <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
                <div className={`${theme.textMuted} font-mono`}>Data unavailable</div>
            </div>
        );
    }

    const { document } = data;
    const { header } = document;

    return (
        <div className={`min-h-screen ${theme.bg} ${theme.text} font-serif selection:bg-violet-500/30`}>
            {/* Background Effect */}
            <DigitalRain
                color={darkMode ? "#8b5cf6" : "#7c3aed"} // Violet-500 / Violet-600
                fadeColor={darkMode ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.08)"}
                opacity={darkMode ? 0.2 : 0.1}
                speed={1.0}
                duration={5000}
                className="fixed inset-0 z-0 pointer-events-none"
            />

            <Header />

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20">
                {/* Back Link */}
                <div className="mb-10">
                    <Link href="/" className={`inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest ${theme.textMuted} hover:${theme.text} transition-colors border-b border-transparent hover:border-${darkMode ? 'white' : 'black'}`}>
                        <ArrowLeft className="w-3 h-3" />
                        Back to Archives
                    </Link>
                </div>

                {/* Newsletter Header Card */}
                <header className={`mb-16 text-center border-b-[6px] border-double ${theme.border} pb-10`}>
                    <div className={`text-xs font-mono font-bold tracking-[0.2em] uppercase ${theme.textVeryMuted} mb-4 flex items-center justify-center gap-4`}>
                        <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {header.date}</span>
                        <span className="w-1 h-1 bg-current rounded-full opacity-30"></span>
                        <span className="flex items-center gap-1.5"><Hash className="w-3 h-3" /> Issue {header.issue_no}</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight leading-tight uppercase font-sans">
                        {header.title}
                    </h1>

                    <h2 className="text-xl md:text-2xl italic text-violet-500 font-serif mb-6">
                        {header.subtitle}
                    </h2>

                    <div className={`max-w-md mx-auto h-px ${theme.border} mb-8`} />

                    <div className="flex flex-col items-center gap-2">
                        <div className="text-3xl mb-2 font-arabic" dir="rtl" style={{ fontFamily: 'var(--font-amiri)' }}>{header.basmala_arabic}</div>
                        <div className={`text-sm font-mono uppercase tracking-widest ${theme.textMuted}`}>{header.basmala_english}</div>
                    </div>

                    {/* Metadata Bar */}
                    <div className={`mt-10 flex flex-wrap justify-center gap-6 text-xs font-mono font-bold uppercase tracking-wide ${theme.textVeryMuted}`}>
                        <div className="flex items-center gap-2 px-3 py-1.5 border rounded-sm border-zinc-200 dark:border-zinc-800">
                            <User className="w-3 h-3" />
                            Editor: {header.editor}
                        </div>
                        <a
                            href={header.pdf_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 px-3 py-1.5 border rounded-sm hover:bg-violet-500 hover:text-white hover:border-violet-500 transition-colors cursor-pointer ${theme.border}`}
                        >
                            <FileText className="w-3 h-3" />
                            View Original PDF
                        </a>
                    </div>
                </header>

                {/* Content Render */}
                <div className="space-y-16">
                    {document.pages.map((page, pageIndex) => (
                        <div key={pageIndex} className="relative">
                            {page.sections.map((section, sectionIndex) => (
                                <section key={sectionIndex} className="mb-12 last:mb-0">
                                    {section.title && (
                                        <h3 className={`text-2xl font-bold mb-6 font-sans uppercase tracking-tight ${theme.text} border-l-4 border-violet-500 pl-4`}>
                                            {section.title}
                                        </h3>
                                    )}

                                    {section.image && (
                                        <figure className="my-8 group">
                                            <div className={`relative overflow-hidden rounded-sm border ${theme.border} shadow-lg`}>
                                                <img
                                                    src={section.image.src}
                                                    alt={section.image.alt}
                                                    className="w-full h-auto object-cover"
                                                />
                                            </div>
                                            {section.image.caption && (
                                                <figcaption className={`mt-3 text-center text-xs font-mono ${theme.textVeryMuted}`}>
                                                    {section.image.caption}
                                                </figcaption>
                                            )}
                                        </figure>
                                    )}

                                    {section.content && section.content.map((paragraph, pIndex) => (
                                        <div key={pIndex} className={`mb-6 text-lg leading-relaxed ${theme.text} opacity-90 font-sora`}>
                                            {parseContent(paragraph, theme)}
                                        </div>
                                    ))}

                                    {section.quotes && section.quotes.map((quote, qIndex) => (
                                        <div key={`quote-${qIndex}`} className="mb-6">
                                            <VerseBlock text={quote.text} reference={quote.reference} />
                                        </div>
                                    ))}

                                    {section.center_block && (
                                        <div className={`my-10 p-8 ${darkMode ? 'bg-violet-900/10 border-violet-500/30' : 'bg-violet-50 border-violet-200'} border-y-2 text-center rounded-sm`}>
                                            {section.center_block.content.map((line, lIndex) => (
                                                <p key={lIndex} className={`text-xl md:text-2xl font-bold italic leading-relaxed text-violet-600 dark:text-violet-300 font-sora`}>
                                                    "{line}"
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Footer Navigation */}
                <div className={`mt-20 pt-10 border-t ${theme.border}`}>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        {/* Prev Button */}
                        <div className="flex-1 w-full md:w-auto flex justify-start">
                            {prevId ? (
                                <Link href={`/newsletter/${prevId}`} className={`group flex items-center gap-3 px-5 py-3 border ${theme.border} rounded-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all w-full md:w-auto`}>
                                    <ArrowLeft className={`w-4 h-4 ${theme.textMuted} group-hover:${theme.text}`} />
                                    <div className="text-left">
                                        <div className={`text-[10px] uppercase font-mono font-bold tracking-widest ${theme.textVeryMuted}`}>Previous Issue</div>
                                    </div>
                                </Link>
                            ) : <div className="flex-1" />}
                        </div>

                        {/* Archive Link */}
                        <Link href="/" className={`text-xs font-mono font-bold uppercase tracking-widest ${theme.textMuted} hover:${theme.text} transition-colors border-b border-transparent hover:border-current pb-1`}>
                            Back to Archive
                        </Link>
                        <div className="flex-1 w-full md:w-auto flex justify-start">
                            {prevId ? (
                                <Link href={`/newsletter/${prevId}`} className={`group flex items-center gap-3 px-5 py-3 border ${theme.border} rounded-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all w-full md:w-auto`}>
                                    <ArrowLeft className={`w-4 h-4 ${theme.textMuted} group-hover:${theme.text}`} />
                                    <div className="text-left">
                                        <div className={`text-[10px] uppercase font-mono font-bold tracking-widest ${theme.textVeryMuted}`}>Previous Issue</div>
                                    </div>
                                </Link>
                            ) : <div className="flex-1" />}
                        </div>

                        {/* Archive Link */}
                        <Link href="/" className={`text-xs font-mono font-bold uppercase tracking-widest ${theme.textMuted} hover:${theme.text} transition-colors border-b border-transparent hover:border-current pb-1`}>
                            Back to Archive
                        </Link>

                        {/* Next Button */}
                        <div className="flex-1 w-full md:w-auto flex justify-end">
                            {nextId ? (
                                <Link href={`/newsletter/${nextId}`} className={`group flex items-center gap-3 px-5 py-3 border ${theme.border} rounded-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all w-full md:w-auto justify-between md:justify-start`}>
                                    <div className="text-right">
                                        <div className={`text-[10px] uppercase font-mono font-bold tracking-widest ${theme.textVeryMuted}`}>Next Issue</div>
                                    </div>
                                    <ArrowLeft className={`w-4 h-4 rotate-180 ${theme.textMuted} group-hover:${theme.text}`} />
                                </Link>
                            ) : <div className="flex-1" />}
                        </div>
                    </div>

                    <div className={`mt-10 text-center text-[10px] font-mono ${theme.textVeryMuted}`}>
                        DIGITAL ARCHIVE // SUBMITTER'S PERSPECTIVE
                    </div>
                </div>
            </div>
        </div>
    );
}
