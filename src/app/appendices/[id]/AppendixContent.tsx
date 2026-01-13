'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, BookOpen } from 'lucide-react';
import Header from '@/components/layout/Header';

type AppendixContentProps = {
    content: any;
    prevAppendix: any;
    nextAppendix: any;
};

// Helper function to detect if text contains verse references
function containsVerseReference(text: string): boolean {
    // Matches patterns like [2:255], (3:81), [74:35], etc.
    return /[\[\(]\d+:\d+(-\d+)?[\]\)]/.test(text);
}

function renderSection(section: any, idx: number) {
    if (section.type === 'heading') {
        const sizeClasses = {
            1: 'text-4xl md:text-5xl',
            2: 'text-3xl md:text-4xl',
            3: 'text-2xl md:text-3xl',
            4: 'text-xl md:text-2xl',
            5: 'text-lg md:text-xl',
            6: 'text-base md:text-lg'
        };

        const headingLevel = section.level as 1 | 2 | 3 | 4 | 5 | 6;

        // Enhanced spacing and borders for major headings
        const spacingClass = headingLevel === 1
            ? 'mt-16 mb-8 pb-4 border-b border-border/30'
            : headingLevel === 2
                ? 'mt-12 mb-6 pb-3 border-b border-border/20'
                : 'mt-10 mb-5';

        const className = `${sizeClasses[headingLevel]} font-bold ${spacingClass} text-foreground tracking-tight`;

        return (
            <div key={idx} style={{ fontFamily: 'var(--font-roboto-slab)' }}>
                {section.level === 1 && <h1 className={className}>{section.text}</h1>}
                {section.level === 2 && <h2 className={className}>{section.text}</h2>}
                {section.level === 3 && <h3 className={className}>{section.text}</h3>}
                {section.level === 4 && <h4 className={className}>{section.text}</h4>}
                {section.level === 5 && <h5 className={className}>{section.text}</h5>}
                {section.level === 6 && <h6 className={className}>{section.text}</h6>}
            </div>
        );
    }

    if (section.type === 'paragraph') {
        const text = section.text;

        // Regular paragraphs with improved spacing
        return (
            <p key={idx} className="leading-loose text-base mb-6 text-foreground font-mono">
                {text}
            </p>
        );
    }

    if (section.type === 'quote') {
        return (
            <div key={idx} className="my-8 px-8 py-6 bg-zinc-200 dark:bg-zinc-800 border-l-4 border-zinc-700 dark:border-zinc-400 rounded-r-lg shadow-sm">
                <p className="italic text-lg leading-loose text-zinc-900 dark:text-zinc-100 font-serif">{section.text}</p>
                {section.reference && (
                    <cite className="block text-sm text-zinc-700 dark:text-zinc-300 not-italic font-semibold mt-3">
                        — {section.reference}
                    </cite>
                )}
            </div>
        );
    }

    if (section.type === 'image') {
        return (
            <div key={idx} className="my-12 flex flex-col items-center">
                <img
                    src={section.src}
                    alt={section.alt || ''}
                    className="max-w-full h-auto rounded-lg shadow-md border border-border"
                />
                {section.alt && (
                    <p className="text-center text-sm text-muted-foreground mt-4 italic max-w-2xl">
                        {section.alt}
                    </p>
                )}
            </div>
        );
    }

    if (section.type === 'table') {
        return (
            <div key={idx} className="my-12 overflow-x-auto rounded-lg border border-border shadow-sm">
                <table className="w-full text-sm">
                    <tbody>
                        {section.rows.map((row: string[], i: number) => (
                            <tr
                                key={i}
                                className="border-b border-border last:border-b-0"
                            >
                                {row.map((cell: string, j: number) => (
                                    <td key={j} className="px-6 py-4 align-top font-mono text-xs leading-relaxed">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (section.type === 'list') {
        const ListTag = section.ordered ? 'ol' : 'ul';
        return (
            <ListTag key={idx} className={`my-6 space-y-3 ${section.ordered ? 'list-decimal' : 'list-disc'} list-inside font-mono ml-4`}>
                {section.items.map((item: string, i: number) => (
                    <li key={i} className="leading-loose pl-2">{item}</li>
                ))}
            </ListTag>
        );
    }

    return null;
}

export default function AppendixContent({ content, prevAppendix, nextAppendix }: AppendixContentProps) {
    const [showNav, setShowNav] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY < lastScrollY || currentScrollY < 100) {
                // Scrolling up or near top
                setShowNav(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down and past threshold
                setShowNav(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <div className="min-h-screen bg-background pb-20 transition-colors duration-200">
            {/* Site Header */}
            <Header />

            {/* Page Navigation Header - Auto-hide on scroll */}
            <header className={`sticky top-[73px] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border transition-transform duration-300 ${showNav ? 'translate-y-0' : '-translate-y-full'
                }`}>
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Archives
                    </Link>

                    {/* Navigation Arrows */}
                    <div className="flex items-center gap-4">
                        {prevAppendix && (
                            <Link
                                href={`/appendices/${prevAppendix.id}`}
                                className="flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors group"
                                title={prevAppendix.title}
                            >
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="hidden md:inline">Previous</span>
                            </Link>
                        )}

                        <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                            <BookOpen className="w-4 h-4" />
                            <span className="hidden sm:inline">Appendix</span>
                        </div>

                        {nextAppendix && (
                            <Link
                                href={`/appendices/${nextAppendix.id}`}
                                className="flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors group"
                                title={nextAppendix.title}
                            >
                                <span className="hidden md:inline">Next</span>
                                <ChevronLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-12">
                {/* Title */}
                <div className="mb-12 text-center">
                    <h1
                        style={{ fontFamily: 'var(--font-roboto-slab)' }}
                        className="text-5xl md:text-6xl font-bold mb-4 text-foreground tracking-tight"
                    >
                        {content.title}
                    </h1>
                    <p className="text-sm text-muted-foreground font-mono">
                        From: Quran The Final Testament
                    </p>
                </div>

                {/* Content Sections */}
                <article className="prose prose-lg max-w-none">
                    {content.sections?.map((section: any, idx: number) => renderSection(section, idx))}
                </article>

                {/* Footer */}
                <footer className="mt-20 pt-12 border-t border-border text-center">
                    <div className="space-y-2">
                        <p className="font-bold text-xl">MASJID TUCSON</p>
                        <p className="font-arabic text-2xl">مسجد توسن</p>
                        <p className="text-muted-foreground text-sm">
                            Source: <a
                                href={content.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                masjidtucson.org
                            </a>
                        </p>
                    </div>
                </footer>
            </main>
        </div>
    );
}
