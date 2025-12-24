import React from 'react';
import Link from 'next/link';
import { BookOpen, Scroll, Video, MessageSquare } from 'lucide-react';

export default function StudyLandingPage() {
    return (
        <div className="min-h-screen bg-background p-8 font-serif">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 style={{ fontFamily: 'var(--font-roboto-slab)' }} className="text-4xl md:text-5xl font-bold tracking-tight text-primary">Community Study Edition</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-sans">
                        Deepen your understanding with verse-by-verse exegesis, multimedia context, and intertextual connections.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* New Testament */}
                    <Link href="/study/new-testament/Matthew/1" className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BookOpen className="w-24 h-24" />
                        </div>
                        <h2 style={{ fontFamily: 'var(--font-roboto-slab)' }} className="text-2xl font-bold mb-2">New Testament</h2>
                        <p className="text-muted-foreground font-sans text-sm mb-4">
                            Detailed analysis of the Gospels and Epistles with Greek context.
                        </p>
                        <span className="text-primary font-sans text-sm font-bold uppercase tracking-wider group-hover:underline">Start Reading &rarr;</span>
                    </Link>

                    {/* Old Testament */}
                    <Link href="/study/old-testament/Genesis/1" className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Scroll className="w-24 h-24" />
                        </div>
                        <h2 style={{ fontFamily: 'var(--font-roboto-slab)' }} className="text-2xl font-bold mb-2">Old Testament</h2>
                        <p className="text-muted-foreground font-sans text-sm mb-4">
                            Explore the Tanakh with Jewish parralels and Hebrew insights.
                        </p>
                        <span className="text-primary font-sans text-sm font-bold uppercase tracking-wider group-hover:underline">Start Reading &rarr;</span>
                    </Link>

                    {/* Quran */}
                    <Link href="/study/quran/Sura/1" className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BookOpen className="w-24 h-24" />
                        </div>
                        <h2 style={{ fontFamily: 'var(--font-roboto-slab)' }} className="text-2xl font-bold mb-2">Quran</h2>
                        <p className="text-muted-foreground font-sans text-sm mb-4">
                            Exegesis based on Dr. Rashad Khalifa's translation and appendices.
                        </p>
                        <span className="text-primary font-sans text-sm font-bold uppercase tracking-wider group-hover:underline">Start Reading &rarr;</span>
                    </Link>
                </div>

                {/* Features Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-border pt-12">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg">Verse Exegesis</h3>
                        <p className="text-sm text-muted-foreground font-sans">Read detailed notes attached directly to specific verses.</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <Video className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg">Multimedia Context</h3>
                        <p className="text-sm text-muted-foreground font-sans">Watch embedded sermon clips and video explanations.</p>
                    </div>
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <Scroll className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg">Intertextual Links</h3>
                        <p className="text-sm text-muted-foreground font-sans">Discover connections across different scriptures.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
