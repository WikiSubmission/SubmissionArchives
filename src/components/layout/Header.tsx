'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Sun, Moon, Play, MessageCircle, Menu, X, BookOpen, Search, FileText } from 'lucide-react';
import { useTheme } from '@/app/components/ThemeProvider';

export default function Header() {
    const { darkMode, toggleDarkMode } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const theme = {
        bg: darkMode ? 'bg-zinc-950' : 'bg-white',
        text: darkMode ? 'text-white' : 'text-zinc-900',
        textMuted: darkMode ? 'text-zinc-400' : 'text-zinc-600',
        border: darkMode ? 'border-zinc-800' : 'border-zinc-200',
        header: darkMode ? 'bg-zinc-950/80 backdrop-blur-md' : 'bg-white/80 backdrop-blur-md',
        button: darkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100',
        borderHover: darkMode ? 'hover:border-zinc-700' : 'hover:border-zinc-300',
        menuBg: darkMode ? 'bg-zinc-950' : 'bg-white',
    };

    return (
        <header className={`sticky top-0 z-50 border-b ${theme.border} ${theme.header} transition-colors duration-200`}>
            <div className="max-w-[1600px] mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="flex items-center gap-3 group">
                                {/* Logo Image */}
                                <div className="relative w-9 h-9 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 group-hover:border-zinc-400 dark:group-hover:border-zinc-600 transition-colors duration-300 animate-fade-in">
                                    <img
                                        src="/submission-logo.png"
                                        alt="Submission Archives"
                                        loading="eager"
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500 ease-out"
                                    />
                                </div>

                                {/* Improved stacked layout */}
                                <div className="flex flex-col leading-none">
                                    <span className={`text-base font-bold tracking-tight ${darkMode ? 'text-white group-hover:text-violet-400' : 'text-zinc-900 group-hover:text-violet-600'} uppercase font-sans transition-colors duration-300`}>
                                        SUBMISSION
                                    </span>
                                    <span style={{ fontFamily: 'var(--font-roboto-slab)' }} className={`text-[10px] font-mono tracking-[0.25em] ${darkMode ? 'text-zinc-500 group-hover:text-zinc-400' : 'text-zinc-400 group-hover:text-zinc-500'} uppercase mt-0.5 transition-colors duration-300`}>
                                        ARCHIVES
                                    </span>
                                </div>
                            </Link>
                            <div className="hidden sm:block w-px h-7 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                            <div className="hidden sm:block">
                                <p className={`text-[10px] ${theme.textMuted} font-mono uppercase tracking-wider opacity-60`}>
                                    System v2.0
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-3">
                        <button
                            onClick={toggleDarkMode}
                            className={`p-2 ${theme.textMuted} hover:${theme.text} border ${theme.border} ${theme.borderHover} transition-colors ${theme.button}`}
                        >
                            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <Link href="/data-info">
                            <button className={`px-3 py-1.5 text-xs ${theme.textMuted} hover:${theme.text} border ${theme.border} ${theme.borderHover} transition-colors font-mono uppercase ${theme.button}`}>
                                DATA & INFO
                            </button>
                        </Link>
                        <a href="https://www.youtube.com/@SubmissionArchives" target="_blank" rel="noopener noreferrer">
                            <button className={`px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 border border-red-600 hover:border-red-700 transition-colors font-mono uppercase flex items-center gap-2`}>
                                <Play className="w-3 h-3 fill-current" />
                                YOUTUBE
                            </button>
                        </a>
                        <a href="https://discord.gg/SubmissionServer" target="_blank" rel="noopener noreferrer">
                            <button className={`px-3 py-1.5 text-xs text-white bg-zinc-600 hover:bg-zinc-700 border border-zinc-600 hover:border-zinc-700 transition-colors font-mono uppercase flex items-center gap-2`}>
                                <MessageCircle className="w-3 h-3" />
                                DISCORD
                            </button>
                        </a>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden flex items-center gap-4">
                        <button
                            onClick={toggleDarkMode}
                            className={`p-2 ${theme.textMuted} hover:${theme.text} border ${theme.border} ${theme.borderHover} transition-colors ${theme.button}`}
                        >
                            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-2 ${theme.textMuted} hover:${theme.text}`}
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className={`md:hidden absolute top-[73px] left-0 w-full h-[calc(100vh-73px)] ${theme.menuBg} border-b ${theme.border} p-6 overflow-y-auto animate-in slide-in-from-top-5 duration-200`}>
                    <div className="flex flex-col gap-4">
                        <Link href="/" onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 p-4 rounded-lg border ${theme.border} ${theme.button}`}>
                            <div className={`p-2 rounded bg-violet-500/10 text-violet-500`}>
                                <Search className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-sm font-bold ${theme.text}`}>BROWSE ARCHIVE</span>
                                <span className={`text-xs ${theme.textMuted}`}>Search & Filter Media</span>
                            </div>
                        </Link>

                        <a href="https://wikisubmission.org/quran" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-4 rounded-lg border ${theme.border} ${theme.button}`}>
                            <div className={`p-2 rounded bg-emerald-500/10 text-emerald-500`}>
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-sm font-bold ${theme.text}`}>READ QURAN</span>
                                <span className={`text-xs ${theme.textMuted}`}>WikiSubmission.org</span>
                            </div>
                        </a>

                        <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2" />

                        <Link href="/data-info" onClick={() => setIsMenuOpen(false)}>
                            <button className={`w-full text-left px-4 py-3 text-sm ${theme.text} font-mono uppercase hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors`}>
                                DATA & INFO
                            </button>
                        </Link>

                        <a href="https://www.youtube.com/@SubmissionArchives" target="_blank" rel="noopener noreferrer">
                            <button className={`w-full text-left px-4 py-3 text-sm font-mono uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition-colors flex items-center gap-2`}>
                                <Play className="w-4 h-4 fill-current" />
                                YOUTUBE CHANNEL
                            </button>
                        </a>

                        <a href="https://discord.gg/SubmissionServer" target="_blank" rel="noopener noreferrer">
                            <button className={`w-full text-left px-4 py-3 text-sm font-mono uppercase text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded transition-colors flex items-center gap-2`}>
                                <MessageCircle className="w-4 h-4" />
                                DISCORD SERVER
                            </button>
                        </a>
                    </div>
                </div>
            )}
        </header>
    );
}
