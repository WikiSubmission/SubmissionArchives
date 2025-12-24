'use client';

import Link from 'next/link';
import { ChevronLeft, Sun, Moon, Printer } from 'lucide-react';
import { useTheme } from '@/app/components/ThemeProvider';
import PrintButton from './PrintButton';

export default function NewsletterHeader({
    title,
    pdfLink,
    prevLink,
    nextLink,
    prevDate,
    nextDate
}: {
    title: string,
    pdfLink?: string,
    prevLink?: string,
    nextLink?: string,
    prevDate?: string,
    nextDate?: string
}) {
    const { darkMode, toggleDarkMode } = useTheme();

    return (
        <header className="sticky top-0 w-full bg-background/95 backdrop-blur shadow-sm border-b border-border z-50 print:hidden transition-colors duration-200">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/submitter-perspectives">
                        <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    </Link>

                    {/* Navigation Arrows */}
                    <div className="flex items-center gap-1 border-l border-border pl-4 ml-2">
                        {prevLink ? (
                            <Link href={prevLink} title={`Previous: ${prevDate}`}>
                                <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                </button>
                            </Link>
                        ) : (
                            <button className="p-2 text-muted-foreground/30 cursor-not-allowed">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            </button>
                        )}

                        {nextLink ? (
                            <Link href={nextLink} title={`Next: ${nextDate}`}>
                                <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                </button>
                            </Link>
                        ) : (
                            <button className="p-2 text-muted-foreground/30 cursor-not-allowed">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                            </button>
                        )}
                    </div>

                    <h1 style={{ fontFamily: 'var(--font-roboto-slab)' }} className="font-bold text-foreground text-lg hidden sm:block ml-2">
                        {title}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {pdfLink && (
                        <a
                            href={pdfLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
                            title="Download PDF"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        </a>
                    )}
                    <PrintButton />
                </div>
            </div>
        </header>
    );
}
