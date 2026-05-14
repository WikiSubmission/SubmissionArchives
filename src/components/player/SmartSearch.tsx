import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useSemanticSearch } from '@/hooks/useSemanticSearch';
import { SearchResult, TranscriptSegment } from '@/utils/semanticSearch';

interface SmartSearchProps {
    segments: TranscriptSegment[];
    onSeek: (time: number) => void;
}

export default function SmartSearch({ segments, onSeek }: SmartSearchProps) {
    const { search, isIndexing } = useSemanticSearch(segments);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);

    const handleSearch = (q: string) => {
        setQuery(q);
        if (q.length > 2) {
            const matches = search(q);
            setResults(matches.slice(0, 10)); // Top 10
        } else {
            setResults([]);
        }
    };

    function formatTime(seconds: number) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // Helper to highlight matches
    const highlightMatches = (text: string, q: string) => {
        if (!q) return text;
        const terms = q.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        if (terms.length === 0) return text;

        // Simple regex replace for display - this is just visual, the real match logic is in semanticSearch
        const pattern = new RegExp(`(${terms.join('|')})`, 'gi');
        const parts = text.split(pattern);

        return parts.map((part, i) =>
            pattern.test(part) ? <mark key={i} className="bg-green-500/30 text-white rounded px-0.5">{part}</mark> : part
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-top-2">
            <div className="relative mb-4">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    {isIndexing ? (
                        <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
                    ) : (
                        <Search className="w-4 h-4 text-zinc-400" />
                    )}
                </div>
                <input
                    type="text"
                    placeholder={isIndexing ? "Indexing content..." : "Search by topic or concept..."}
                    value={query}
                    onChange={e => handleSearch(e.target.value)}
                    disabled={isIndexing}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-zinc-600"
                />
            </div>

            {results.length > 0 && (
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                    <div className="flex justify-between items-center text-xs text-zinc-500 px-1 mb-2">
                        <span>Found {results.length} relevant segments</span>
                        <span className="font-mono text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded">Semantic Search</span>
                    </div>
                    {results.map(result => (
                        <div
                            key={result.index}
                            className="p-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-zinc-600"
                            onClick={() => onSeek(result.segment.start_time)}
                        >
                            <div className="flex justify-between mb-1.5">
                                <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded">
                                    {formatTime(result.segment.start_time)}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${result.score > 5 ? 'text-green-400' : 'text-zinc-500'}`}>
                                    {Math.min(100, Math.round(result.score * 20))}% Relevant
                                </span>
                            </div>
                            <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3">
                                {highlightMatches(result.segment.content, query)}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {query.length > 2 && results.length === 0 && !isIndexing && (
                <div className="text-center py-6 text-zinc-500 text-sm italic">
                    No relevant segments found. Try different keywords.
                </div>
            )}
        </div>
    );
}
