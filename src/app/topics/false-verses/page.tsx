'use client';

import Header from '@/components/layout/Header';
import { useTheme } from '@/app/components/ThemeProvider';
import { getTheme } from '@/lib/theme';
import { FileText, ArrowLeft, ShieldCheck, AlertOctagon, Hash, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { INTRODUCTION, EVIDENCE_POINTS } from './content';
import ReactMarkdown from 'react-markdown';
import EvidenceCard from './EvidenceCard';

export default function FalseVersesPage() {
    const { darkMode } = useTheme();

    const theme = {
        bg: darkMode ? 'bg-zinc-950' : 'bg-[#FAFAF9]', // Warm grey/stone for light mode
        text: darkMode ? 'text-zinc-100' : 'text-gray-900',
        textMuted: darkMode ? 'text-zinc-400' : 'text-gray-600',
        textMutedVery: darkMode ? 'text-zinc-500' : 'text-gray-400',
        border: darkMode ? 'border-white/10' : 'border-gray-200',
        accent: darkMode ? 'text-violet-400' : 'text-violet-600',
        accentBg: darkMode ? 'bg-violet-900/20' : 'bg-violet-100',
        accentBorder: darkMode ? 'border-violet-500/20' : 'border-violet-200',
        cardHover: darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.02]',
        quoteBg: darkMode ? 'bg-violet-900/10' : 'bg-violet-50',
    };

    return (
        <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans selection:bg-violet-500/30 transition-colors duration-300`}>
            <Header />

            <main className="max-w-4xl mx-auto px-4 py-8 md:px-12 md:py-16">
                <Link
                    href="/topics"
                    className={`inline-flex items-center gap-2 mb-8 text-sm font-medium ${theme.accent} hover:opacity-80 transition-opacity`}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Compiled Notes
                </Link>

                <header className={`mb-10 border-b ${theme.border} pb-8`}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-full ${theme.accentBg} ${theme.accent} flex items-center justify-center border ${theme.accentBorder}`}>
                            <AlertOctagon className="w-5 h-5" />
                        </div>
                        <span className={`text-xs font-bold tracking-[0.2em] uppercase ${theme.accent}`}>Appendix 24</span>
                    </div>

                    <h1
                        className={`text-3xl md:text-5xl font-black tracking-tight mb-4 leading-tight uppercase ${theme.text}`}
                        style={{ fontFamily: 'var(--font-roboto-slab)' }}
                    >
                        The False Verses <span className={`${theme.accent} text-3xl md:text-4xl align-middle ml-2 font-bold opacity-80`}>(9:128 & 9:129)</span>
                    </h1>

                    <p className={`text-lg ${theme.textMuted} leading-relaxed font-serif max-w-3xl`} style={{ fontFamily: 'var(--font-crimson)' }}>
                        Tampering with the Word of God: An indepth study, explanation, and statistical proof exposing the human injections.
                    </p>
                </header>

                {/* Introduction Section - Manually Styled for Font Control */}
                <section className="mb-12">
                    {/* Main Paragraph - Forced Crimson Text */}
                    <div
                        className={`text-xl leading-relaxed ${darkMode ? 'text-zinc-300' : 'text-gray-800'} mb-8`}
                        style={{ fontFamily: 'var(--font-crimson)' }}
                    >
                        {INTRODUCTION}
                    </div>

                    {/* Visually Embedded 15:9 Verse */}
                    <div className={`relative overflow-hidden rounded-lg ${theme.quoteBg} border ${theme.accentBorder} p-8 text-center group hover:border-violet-500/30 transition-colors`}>
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <BookOpen className={`w-24 h-24 ${theme.accent}`} />
                        </div>

                        <blockquote className="relative z-10">
                            <p
                                className={`text-2xl md:text-3xl font-serif ${darkMode ? 'text-violet-100' : 'text-violet-900'} italic mb-4 leading-relaxed`}
                                style={{ fontFamily: 'var(--font-playfair)' }}
                            >
                                "Surely, we have revealed this scripture, and surely, we will preserve it."
                            </p>
                            <footer className={`${theme.accent} font-mono text-sm tracking-widest uppercase font-bold`}>
                                Sura 15:9
                            </footer>
                        </blockquote>
                    </div>
                </section>

                {/* Physical Evidence Header */}
                <div className="flex items-center gap-4 mb-12">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                    <h2 className="text-2xl font-bold uppercase tracking-widest text-center flex items-center justify-center gap-3 group cursor-default transition-all duration-500 hover:scale-105">
                        <ShieldCheck className={`w-6 h-6 ${theme.accent} transition-all duration-300 group-hover:text-violet-300 group-hover:drop-shadow-[0_0_15px_rgba(139,92,246,0.6)] group-hover:rotate-12`} />
                        <span className={`${theme.text} transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]`}>
                            The Physical Evidence
                        </span>
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                </div>

                {/* Evidence Rows */}
                <div className="space-y-4">
                    {EVIDENCE_POINTS.map((point) => (
                        <EvidenceCard key={point.id} point={point} theme={theme} darkMode={darkMode} />
                    ))}
                </div>

                <div className={`mt-20 pt-10 border-t ${theme.border} text-center ${theme.textMutedVery} text-sm`}>
                    <p>Excerpt from Appendix 24 of Quran: The Final Testament</p>
                </div>
            </main>
        </div>
    );
}
