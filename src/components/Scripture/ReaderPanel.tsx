'use client';

import { useState, useEffect } from 'react';
import { fetchSefariaText } from '@/lib/scriptureUtils';
import { fetchQuranChapter, fetchNTChapter, ScriptureChapterData, GreekToken } from '@/app/scripture/actions';
import { ArrowLeft, ArrowRight, X, BookOpen, Info } from 'lucide-react';

interface ReaderProps {
    id: string;
    source: string;
    book: string;
    chapter: number;
    onClose: (id: string) => void;
    onNavigate: (id: string, newBook: string, newChapter: number) => void;
}

export default function ReaderPanel({ id, source, book, chapter, onClose, onNavigate }: ReaderProps) {
    const [data, setData] = useState<ScriptureChapterData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState<'split' | 'english' | 'original'>('split');

    // Lexicon State
    const [selectedToken, setSelectedToken] = useState<GreekToken | null>(null);

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            setError('');
            try {
                if (source === 'quran') {
                    const res = await fetchQuranChapter(chapter);
                    if (!mounted) return;
                    if (res) setData(res);
                    else setError('Sura not found.');
                } else if (source === 'new-testament') {
                    const res = await fetchNTChapter(book, chapter);
                    if (!mounted) return;
                    if (res) setData(res);
                    else setError('Chapter not found.');
                } else if (source === 'old-testament' || source === 'apocrypha') {
                    const res = await fetchSefariaText(book, chapter);
                    if (!mounted) return;
                    if (res) {
                        const len = Math.max(res.he.length, res.text.length);
                        const verses = Array.from({ length: len }, (_, i) => ({
                            num: i + 1,
                            he: res.he[i] || '',
                            en: res.text[i] || ''
                        }));
                        setData({
                            ref: `${book} ${chapter}`,
                            verses,
                            prev: !!res.prev,
                            next: !!res.next
                        });
                    } else {
                        setError('Failed to load text.');
                    }
                } else {
                    setError('Unknown source.');
                }
            } catch (err) {
                console.error(err);
                if (mounted) setError("Error loading content");
            }
            if (mounted) setLoading(false);
        }
        load();
        return () => { mounted = false };
    }, [source, book, chapter]);

    if (loading) return (
        <div className="flex-1 min-w-[350px] flex items-center justify-center bg-background border-r border-border">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error || !data) return (
        <div className="flex-1 min-w-[350px] flex items-center justify-center bg-background border-r border-border text-destructive p-4 text-center text-sm">
            {error || "No data"}
            <button onClick={() => onClose(id)} className="block mt-2 text-xs underline text-muted-foreground">Close Panel</button>
        </div>
    );

    const isRtl = source === 'old-testament' || source === 'quran';
    const isGreek = source === 'new-testament';
    // Greek font: Crimson Text (serif) works well, but SBL Greek is better. 
    // For now we assume standard serif handles it well enough.
    const originalFont = source === 'quran' ? 'font-[family-name:var(--font-scheherazade)] text-3xl leading-[2.6]'
        : source === 'old-testament' ? 'font-[family-name:var(--font-frank)] text-2xl leading-loose'
            : 'font-[family-name:var(--font-crimson-text)] text-xl leading-relaxed';

    return (
        <div className="flex-1 min-w-[400px] flex flex-col border-r border-border last:border-r-0 bg-background relative">
            {/* Header */}
            <div className="h-14 px-5 flex items-center justify-between bg-background border-b border-border sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => onClose(id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                    <div>
                        <h2 className="font-[family-name:var(--font-cinzel)] font-bold text-foreground text-xl leading-none tracking-tight">{data.ref}</h2>
                        <span className="text-[10px] text-primary uppercase font-bold tracking-widest">{source.replace('-', ' ')}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex gap-3 text-xs font-medium uppercase tracking-wider">
                        {(['original', 'split', 'english'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => setViewMode(m)}
                                className={`pb-0.5 border-b-2 transition-colors ${viewMode === m ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1">
                        <button onClick={() => onNavigate(id, book, Math.max(1, chapter - 1))} disabled={!data.prev && chapter <= 1} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button onClick={() => onNavigate(id, book, chapter + 1)} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Content: Continuous flow, document style */}
                <div className="flex-1 overflow-y-auto bg-background scrollbar-thin scrollbar-thumb-muted">
                    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
                        {data.verses.map((verse) => (
                            <div key={verse.num} className="relative group p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                                {/* Verse Number */}
                                <div className="text-sm font-bold text-muted-foreground mb-4 font-sans">{verse.num}</div>

                                {/* English Text (Main) */}
                                {(viewMode === 'english' || viewMode === 'split') && (
                                    <div
                                        className="text-foreground font-[family-name:var(--font-playfair)] text-2xl leading-relaxed mb-6 verse-content"
                                        dangerouslySetInnerHTML={{ __html: verse.en.replace(/__NOTE:\d+__/g, '') }}
                                    />
                                )}

                                {/* Divider if split view */}
                                {viewMode === 'split' && <div className="h-px bg-border/50 my-6 w-full" />}

                                {/* Original Text */}
                                {(viewMode === 'original' || viewMode === 'split') && (
                                    <div dir={isRtl ? 'rtl' : 'ltr'}
                                        className={`relative ${isRtl ? 'text-right' : 'text-left font-sans'} text-foreground/80 mb-4 
                                         ${source === 'quran' ? 'font-[family-name:var(--font-scheherazade)] text-4xl leading-[2.6]' :
                                                source === 'old-testament' ? 'font-[family-name:var(--font-frank)] text-2xl leading-loose' :
                                                    'font-[family-name:var(--font-crimson-text)] text-xl leading-relaxed'}`}>
                                        {/* Interactive Greek/Quran Tokens */}
                                        {(isGreek || source === 'quran') && verse.tokens ? (
                                            <div className="leading-[2.5] tracking-wide">
                                                {verse.tokens.map((token, idx) => (
                                                    <span key={idx}>
                                                        <span
                                                            onClick={() => setSelectedToken(token)}
                                                            className={`
                                                                cursor-pointer rounded-sm hover:bg-primary/20 hover:text-primary transition-colors px-0.5 
                                                                ${selectedToken === token ? 'bg-primary/20 text-primary font-bold' : ''}
                                                            `}
                                                        >
                                                            {token.text}
                                                        </span>
                                                        <span className="select-none">{token.after}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <>{verse.he}</>
                                        )}
                                    </div>
                                )}

                                {/* Footnote Box */}
                                {verse.footnote && (
                                    <div className="mt-6 p-4 rounded-r-lg border-l-4 border-primary bg-primary/5 text-base text-muted-foreground font-[family-name:var(--font-playfair)]">
                                        <span className="text-primary font-bold mr-2 select-none">± {verse.num}</span>
                                        {verse.footnote}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className="h-32" />
                    </div>
                </div>

                {/* Lexicon Side Panel (Slide Over) */}
                {selectedToken && (
                    <div className="w-[300px] border-l border-border bg-card shadow-xl overflow-y-auto p-6 animate-in slide-in-from-right-10 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-[family-name:var(--font-cinzel)] font-bold text-lg">Lexicon</h3>
                            <button onClick={() => setSelectedToken(null)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Selected Word */}
                            <div className="text-center pb-6 border-b border-border">
                                <div className="text-4xl font-serif text-primary mb-2">{selectedToken.text}</div>
                                <div className="text-sm text-muted-foreground uppercase tracking-widest font-bold font-sans">Original Word</div>
                            </div>

                            {/* Lemma */}
                            <div>
                                <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Root / Lemma</h4>
                                <div className="text-2xl font-serif">{selectedToken.lemma}</div>
                            </div>

                            {/* Gloss */}
                            <div>
                                <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Definition</h4>
                                <div className="text-lg font-medium">{selectedToken.gloss}</div>
                            </div>

                            {/* Morphology */}
                            <div>
                                <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Morphology</h4>
                                <div className="bg-muted/50 p-2 rounded font-mono text-xs max-w-full overflow-x-auto">
                                    {selectedToken.morph}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    {expandMorphology(selectedToken.morph)}
                                </p>
                            </div>

                            {/* Strong's (Placeholder until we have them) */}
                            {false && (
                                <div>
                                    <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Strong's #</h4>
                                    <div className="text-lg font-mono text-blue-500 hover:underline cursor-pointer">G1234</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Simple Morphology Expander (MVP)
function expandMorphology(code: string) {
    if (!code) return '';
    const parts = code.split('-');
    const posMap: Record<string, string> = {
        'N': 'Noun', 'V': 'Verb', 'A': 'Adjective', 'T': 'Article', 'P': 'Pronoun', 'R': 'Relative Pronoun',
        'C': 'Conjunction', 'D': 'Demonstrative', 'I': 'Interjection', 'PREP': 'Preposition', 'ADV': 'Adverb',
        'CONJ': 'Conjunction', 'PRT': 'Particle'
    };
    // This is very basic, Macula codes are complex (e.g., N-NSF)
    // Part 1: POS
    const pos = posMap[parts[0]] || parts[0];
    return `${pos} (${code})`;
}
