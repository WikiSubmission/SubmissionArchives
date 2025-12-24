'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ReaderPanel from '@/components/Scripture/ReaderPanel';
import { Plus, Layout } from 'lucide-react';

interface PanelConfig {
    id: string;
    source: string;
    book: string;
    chapter: number;
}

function CompareContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const refsParam = searchParams.get('refs'); // Format: source.book.chapter|source.book.chapter

    // Initial state from URL or default
    const [panels, setPanels] = useState<PanelConfig[]>([]);

    useEffect(() => {
        if (refsParam) {
            const parts = refsParam.split('|');
            const newPanels = parts.map((p, i) => {
                const [s, b, c] = p.split('.');
                return {
                    id: `p-${i}-${Date.now()}`,
                    source: s,
                    book: b?.replace(/_/g, ' '),
                    chapter: parseInt(c) || 1
                };
            });
            setPanels(newPanels);
        } else {
            // Default to empty or maybe one panel?
            // If empty, user sees "Add Panel"
        }
    }, [refsParam]);

    const updateUrl = (newPanels: PanelConfig[]) => {
        const param = newPanels.map(p => `${p.source}.${p.book.replace(/ /g, '_')}.${p.chapter}`).join('|');
        router.push(`/scripture/compare?refs=${param}`);
    };

    const handleClose = (id: string) => {
        const newPanels = panels.filter(p => p.id !== id);
        setPanels(newPanels);
        updateUrl(newPanels);
    };

    const handleNavigate = (id: string, newBook: string, newChapter: number) => {
        const newPanels = panels.map(p => p.id === id ? { ...p, book: newBook, chapter: newChapter } : p);
        setPanels(newPanels);
        updateUrl(newPanels);
    };

    const addPanel = (source: string) => {
        // Defaults
        let book = 'Genesis';
        if (source === 'new-testament') book = 'Matthew';
        if (source === 'quran') book = 'Sura 1';
        if (source === 'apocrypha') book = 'Tobit';

        const newPanel: PanelConfig = {
            id: `new-${Date.now()}`,
            source,
            book,
            chapter: 1
        };
        const newPanels = [...panels, newPanel];
        setPanels(newPanels);
        updateUrl(newPanels);
    };

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden">
            <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background">
                <div className="flex items-center gap-2">
                    <Layout className="w-5 h-5 text-primary" />
                    <h1 className="font-bold text-foreground">Scripture Compare</h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground mr-2">Add Panel:</span>
                    <button onClick={() => addPanel('old-testament')} className="px-3 py-1 rounded bg-muted text-xs text-foreground hover:bg-muted/80">OT</button>
                    <button onClick={() => addPanel('new-testament')} className="px-3 py-1 rounded bg-muted text-xs text-foreground hover:bg-muted/80">NT</button>
                    <button onClick={() => addPanel('quran')} className="px-3 py-1 rounded bg-muted text-xs text-foreground hover:bg-muted/80">Quran</button>
                </div>
            </header>

            <div className="flex-1 flex overflow-x-auto divide-x divide-border">
                {panels.length === 0 && (
                    <div className="w-full flex items-center justify-center text-gray-500 italic">
                        Select a source above to add a panel.
                    </div>
                )}
                {panels.map(panel => (
                    <ReaderPanel
                        key={panel.id}
                        {...panel}
                        onClose={handleClose}
                        onNavigate={handleNavigate}
                    />
                ))}
            </div>
        </div>
    );
}

export default function ComparePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CompareContent />
        </Suspense>
    );
}
