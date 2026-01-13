'use client';

import Link from 'next/link';
import { Book, Scroll, Layers, Globe } from 'lucide-react';

export default function ScriptureLandingPage() {
    const sections = [
        {
            id: 'old-testament',
            title: 'Old Testament',
            subtitle: 'Tanakh (Hebrew & English)',
            icon: Scroll,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10 border-amber-500/20'
        },
        {
            id: 'new-testament',
            title: 'New Testament',
            subtitle: 'Greek & English',
            icon: Book,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10 border-blue-500/20'
        },
        {
            id: 'quran',
            title: 'Quran',
            subtitle: 'Final Testament (Arabic & English)',
            icon: Layers,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10 border-emerald-500/20'
        },
        {
            id: 'apocrypha',
            title: 'Apocrypha',
            subtitle: 'Jewish & Christian Apocrypha',
            icon: Globe, // or something else
            color: 'text-purple-500',
            bg: 'bg-purple-500/10 border-purple-500/20'
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <header className="max-w-7xl mx-auto mb-12">
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors mb-4 inline-block text-sm">
                    ← Back to Library
                </Link>
                <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-center max-w-3xl mx-auto py-8">
                    Read and study the original texts in Hebrew, Greek, and Arabic.
                </h1>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map(section => (
                    <Link
                        key={section.id}
                        href={`/scripture/${section.id}`}
                        className={`group p-8 rounded-2xl border ${section.bg} hover:bg-opacity-20 transition-all duration-300 relative overflow-hidden`}
                    >
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-2 group-hover:translate-x-1 transition-transform">{section.title}</h2>
                                <p className="text-muted-foreground">{section.subtitle}</p>
                            </div>
                            <section.icon className={`w-12 h-12 ${section.color} opacity-80`} />
                        </div>
                    </Link>
                ))}
            </div>
        </div >
    );
}
