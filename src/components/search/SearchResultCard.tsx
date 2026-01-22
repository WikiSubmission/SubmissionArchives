
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import type { ThemeColors } from '@/lib/theme';
import type { SearchResult } from '@/lib/search/core';

interface SearchResultCardProps {
    result: SearchResult;
    theme: ThemeColors;
    query: string;
}

export default function SearchResultCard({ result, theme, query }: SearchResultCardProps) {
    // Determine quality badge
    // We don't have score in SearchResult yet, so we'll skip the badge or mock it for now
    // Or we could update SearchResult to include score. 
    // For now, let's keep it clean as per original design.

    // Highlight matching terms in snippet
    const highlightSnippet = (text: string, term: string) => {
        if (!term || !text) return text;
        const normalizedText = text.toLowerCase();
        const normalizedTerm = term.toLowerCase();

        // Simple highlight logic
        // For production we might want a robust regex that handles overlapping, etc.
        // But for display snippet which is already cut, this is fine

        // This is tricky in React without dangerouslySetInnerHTML or complex parsing
        // We'll use a simple split/map for single term, but for multi-term it gets harder.
        // Let's assume the snippet coming from server is plain text and we want to bold the query terms.

        const terms = term.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        if (terms.length === 0) return text;

        // Naive highlighting: split by regex of all terms
        const pattern = new RegExp(`(${terms.join('|')})`, 'gi');
        const parts = text.split(pattern);

        return (
            <span>
                {parts.map((part, i) =>
                    terms.some(t => t === part.toLowerCase()) ? (
                        <span key={i} className="font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 rounded px-0.5">
                            {part}
                        </span>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </span>
        );
    };

    return (
        <Link href={`/library/${result.filename}`}>
            <div className={`${theme.card} group relative p-6 border ${theme.border} rounded-sm overflow-hidden hover:border-amber-500/50 transition-all cursor-pointer hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className="flex items-start gap-4">
                    {/* Icon / Date Box */}
                    <div className={`shrink-0 p-3 pt-3.5 ${theme.bg === 'bg-zinc-950' ? 'bg-black border-zinc-800 text-amber-500' : 'bg-amber-50 border-amber-100 text-amber-600'} rounded-sm border transition-colors shadow-sm flex flex-col items-center justify-center w-16 text-center`}>
                        <BookOpen className="w-5 h-5 mb-1" />
                        <div className="text-[10px] font-bold font-mono leading-tight uppercase">
                            {result.date.split(' ')[0].substring(0, 3)}
                            <br />
                            {result.date.split(' ')[1]}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Title */}
                        <div className="flex items-baseline justify-between gap-4 mb-2">
                            <h3 className={`font-serif font-medium ${theme.text} text-xl leading-tight group-hover:text-amber-500 transition-colors truncate pr-4`}>
                                {result.title}
                            </h3>
                            <span className={`shrink-0 text-[10px] font-mono uppercase tracking-widest ${theme.textVeryMuted} border ${theme.border} px-2 py-0.5 rounded-full`}>
                                {result.matches.length > 0 ? "Content Match" : "Title Match"}
                            </span>
                        </div>

                        {/* Snippets */}
                        {result.matches.length > 0 ? (
                            <div className="space-y-2 mt-3">
                                {result.matches.map((match, idx) => (
                                    <div key={idx} className={`text-sm ${theme.textMuted} font-serif italic border-l-2 ${theme.border} pl-3 py-1`}>
                                        "...{highlightSnippet(match, query)}..."
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={`text-sm ${theme.textMuted} mt-1`}>
                                Matching title found in {result.date} issue.
                            </p>
                        )}

                        {/* View Issue Button (appears on hover or just visible) */}
                        <div className="mt-4 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-500 opacity-60 group-hover:opacity-100 transition-opacity">
                            <span>Read Issue</span>
                            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
