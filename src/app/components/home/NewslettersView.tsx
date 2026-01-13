import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import { Newsletter, ThemeColors } from "@/types/media";

interface NewslettersViewProps {
    newsletters: Newsletter[];
    loading: boolean;
    theme: ThemeColors;
    darkMode: boolean;
}

export function NewslettersView({ newsletters, loading, theme, darkMode }: NewslettersViewProps) {
    const [collapsedYears, setCollapsedYears] = useState<Set<string>>(() => {
        const years = new Set(newsletters.map(n => n.fullDate.split('-')[0]));
        return years;
    });

    const groupedNewsletters = useMemo(() => {
        return newsletters.reduce((acc, newsletter) => {
            const year = newsletter.fullDate.split('-')[0];
            if (!acc[year]) acc[year] = [];
            acc[year].push(newsletter);
            return acc;
        }, {} as Record<string, Newsletter[]>);
    }, [newsletters]);

    const sortedYears = useMemo(() => {
        return Object.keys(groupedNewsletters).sort();
    }, [groupedNewsletters]);

    const toggleYear = (year: string) => {
        const newCollapsed = new Set(collapsedYears);
        if (newCollapsed.has(year)) {
            newCollapsed.delete(year);
        } else {
            newCollapsed.add(year);
        }
        setCollapsedYears(newCollapsed);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className={`w-8 h-8 ${theme.textMuted} animate-spin`} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {sortedYears.map(year => (
                <div key={year} className={`${theme.card} rounded-sm border ${theme.border} shadow-sm overflow-hidden`}>
                    <button
                        onClick={() => toggleYear(year)}
                        className={`w-full flex items-center justify-between p-5 ${darkMode ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-white hover:bg-gray-50'} transition-colors border-b ${theme.border}`}
                    >
                        <div className="flex items-baseline gap-4">
                            <h3 className={`text-2xl font-serif ${theme.text}`}>{year}</h3>
                            <span className={`text-[10px] font-mono font-bold ${theme.textVeryMuted} border ${theme.border} px-2 py-0.5 rounded-sm uppercase tracking-wider`}>
                                {groupedNewsletters[year].length} Issues
                            </span>
                        </div>
                        <div className={`transform transition-transform duration-200 ${collapsedYears.has(year) ? '-rotate-90' : 'rotate-0'} ${theme.textMuted}`}>
                            <ChevronDown className="w-5 h-5" />
                        </div>
                    </button>

                    {!collapsedYears.has(year) && (
                        <div className={`p-6 ${darkMode ? 'bg-black/20' : 'bg-gray-50/50'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {groupedNewsletters[year]
                                    .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
                                    .map(item => (
                                        <Link
                                            key={item.id}
                                            href={`/read/${item.id}`}
                                        >
                                            <div className={`group h-full ${theme.card} border ${theme.border} rounded-sm overflow-hidden hover:border-zinc-400 transition-all cursor-pointer flex flex-col relative shadow-sm hover:shadow-md`}>
                                                {/* Thumbnail Image */}
                                                <div className="relative w-full aspect-[3/4] bg-black/5 dark:bg-black/20 overflow-hidden">
                                                    <img
                                                        src={`/images/newsletters/${item.id}.jpg`}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => {
                                                            e.currentTarget.src = '/images/placeholders/rashad-khalifa.png';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>

                                                <div className="p-5 flex flex-col flex-1">
                                                    <div className="mb-4">
                                                        <div className={`text-[10px] font-mono font-bold tracking-widest ${theme.textVeryMuted} mb-2 uppercase border-b ${theme.border} pb-2 inline-block`}>
                                                            {item.date.split(' ')[0]}
                                                        </div>
                                                        <h4 className={`font-serif text-lg ${theme.text} group-hover:opacity-70 transition-opacity line-clamp-2 leading-tight`}>
                                                            {item.title}
                                                        </h4>
                                                    </div>

                                                    <div className={`mt-auto flex items-center justify-between pt-4 border-t ${theme.border} text-xs font-mono uppercase tracking-widest ${theme.textVeryMuted}`}>
                                                        <div className="flex items-center gap-1.5">
                                                            <FileText className="w-3 h-3" />
                                                            <span>PDF</span>
                                                        </div>
                                                        <ArrowLeft className={`w-3 h-3 rotate-180 transform group-hover:translate-x-1 transition-transform ${theme.text}`} />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
