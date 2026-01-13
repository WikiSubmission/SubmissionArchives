'use client';

import Link from 'next/link';
import { Sun, Moon, Play, MessageCircle } from 'lucide-react';
import { useTheme } from '@/app/components/ThemeProvider';

export default function Header() {
    const { darkMode, toggleDarkMode } = useTheme();

    const theme = {
        bg: darkMode ? 'bg-zinc-950' : 'bg-white',
        text: darkMode ? 'text-white' : 'text-zinc-900',
        textMuted: darkMode ? 'text-zinc-400' : 'text-zinc-600',
        border: darkMode ? 'border-zinc-800' : 'border-zinc-200',
        header: darkMode ? 'bg-zinc-950/80 backdrop-blur-md' : 'bg-white/80 backdrop-blur-md',
        button: darkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100',
        borderHover: darkMode ? 'hover:border-zinc-700' : 'hover:border-zinc-300'
    };

    return (
        <header className={`sticky top-0 z-50 border-b ${theme.border} ${theme.header} transition-colors duration-200`}>
            <div className="max-w-[1600px] mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="flex items-center gap-2 group">
                                <span className={`text-xl font-black tracking-tighter ${theme.text} uppercase font-sans`}>
                                    SUBMISSION
                                </span>
                                <span style={{ fontFamily: 'var(--font-roboto-slab)' }} className={`text-sm font-bold italic tracking-widest text-white bg-zinc-700 px-3 py-0.5 uppercase group-hover:bg-zinc-600 transition-colors`}>
                                    ARCHIVES
                                </span>
                            </Link>
                            <div className="hidden sm:block border-l border-zinc-700/20 dark:border-zinc-700 pl-3 ml-1">
                                <p className={`text-[10px] ${theme.textMuted} font-mono uppercase tracking-wider`}>
                                    System v2.0
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
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
                </div>
            </div>
        </header>
    );
}
