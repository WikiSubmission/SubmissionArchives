'use client';

import Header from '@/components/layout/Header';
import { useTheme } from '@/app/components/ThemeProvider';
import { FileText } from 'lucide-react';

export default function NotesPage() {
    // We can use the theme context if we want to be consistent with main page for bg
    // But for a simple page, standard container classes are often enough.
    // However, since we have a specific dark/light theme, let's use standard colors.

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <Header />

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-3 mb-6 text-muted-foreground">
                        <FileText className="w-8 h-8" />
                        <span className="text-sm font-bold tracking-widest uppercase">Resources</span>
                    </div>

                    <h1
                        className="text-4xl md:text-5xl font-black tracking-tight mb-8 uppercase"
                        style={{ fontFamily: 'var(--font-roboto-slab)' }}
                    >
                        Compiled Notes
                    </h1>

                    <p className="text-xl text-muted-foreground leading-relaxed font-serif">
                        This page has various quotes and discussions from audios, sermons, studies, and other materials on various subjects.
                    </p>
                </div>

                {/* Placeholder for future content */}
                <div className="mt-16 text-muted-foreground/50 italic text-sm">
                    Coming soon...
                </div>
            </main>
        </div>
    );
}
