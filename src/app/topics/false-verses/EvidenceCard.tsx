'use client';

import { useTheme } from '@/app/components/ThemeProvider';
import { getTheme } from '@/lib/theme';
import { Check, X, BookOpen, Calculator } from 'lucide-react';
import { EvidencePoint } from './content';

// Define theme type to avoid 'any'
interface Theme {
    bg: string;
    text: string;
    textMuted: string;
    textMutedVery: string;
    border: string;
    accent: string;
    accentBg: string;
    accentBorder: string;
    cardHover: string;
    quoteBg: string;
}

export default function EvidenceCard({ point, theme, darkMode }: { point: EvidencePoint, theme: Theme, darkMode: boolean }) {
    return (
        <div
            id={`point-${point.id}`}
            className={`group relative py-6 border-b ${theme.border} last:border-0 ${theme.cardHover} transition-colors`}
        >
            <div className="flex flex-col md:flex-row gap-6 md:gap-12 md:items-start">
                {/* ID & Title Section - Fixed Width */}
                <div className="md:w-1/3 flex-shrink-0">
                    <div className="flex items-center gap-4 mb-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded ${theme.accentBg} border ${theme.accentBorder} ${theme.accent} flex items-center justify-center font-mono font-bold text-sm`}>
                            {point.id}
                        </div>
                        <h3 className={`font-serif text-lg font-bold leading-tight ${theme.text} group-hover:${darkMode ? 'text-violet-200' : 'text-violet-700'} transition-colors`}>
                            {point.title}
                        </h3>
                    </div>
                    <p className={`text-sm leading-relaxed ${theme.textMuted} pl-12 font-serif`}>
                        {point.description}
                    </p>

                    {/* Embedded Reference Verses */}
                    {point.verses && (
                        <div className="mt-4 pl-12 space-y-3">
                            {point.verses.map((v, i) => (
                                <div key={i} className={`text-xs border-l-2 ${darkMode ? 'border-violet-500/30' : 'border-violet-300'} pl-3`}>
                                    <div className={`${theme.accent} font-mono mb-1 flex items-center gap-2`}>
                                        <BookOpen className="w-3 h-3" />
                                        {v.ref}
                                    </div>
                                    <p className={`${theme.textMutedVery} italic font-serif leading-relaxed`}>"{v.text}"</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Visual Anchor - Flexible Right Side */}
                <div className={`flex-grow md:w-2/3 md:border-l ${darkMode ? 'md:border-white/5' : 'md:border-black/5'} md:pl-12`}>
                    {renderVisual(point.visual, theme, darkMode)}
                </div>
            </div>
        </div>
    );
}

function renderVisual(visual: EvidencePoint['visual'], theme: Theme, darkMode: boolean) {
    switch (visual.type) {
        case 'comparison':
            return (
                <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center h-full">
                    {/* Correct Side */}
                    <div className="flex-1">
                        <div className="text-[10px] uppercase tracking-widest text-emerald-500/70 font-bold mb-2 flex items-center gap-2">
                            <Check className="w-3 h-3" /> Correct Count
                        </div>
                        <div className={`text-4xl font-mono font-bold ${theme.text} tracking-tight`}>
                            {visual.data.correct.value}
                        </div>
                        <div className="text-xs font-mono text-emerald-500/60 mt-1">
                            {visual.data.correct.subtext}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className={`hidden sm:block w-px h-12 ${darkMode ? 'bg-white/10' : 'bg-black/10'}`} />

                    {/* Incorrect Side */}
                    <div className="flex-1 opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                        <div className="text-[10px] uppercase tracking-widest text-red-500/70 font-bold mb-2 flex items-center gap-2">
                            <X className="w-3 h-3" /> With False Verses
                        </div>
                        <div className={`text-4xl font-mono font-bold ${darkMode ? 'text-zinc-500' : 'text-gray-400'} group-hover:text-red-400 transition-colors tracking-tight`}>
                            {visual.data.incorrect.value}
                        </div>
                        <div className={`text-xs font-mono ${darkMode ? 'text-zinc-600' : 'text-gray-400'} group-hover:text-red-500/60 mt-1 transition-colors`}>
                            {visual.data.incorrect.subtext}
                        </div>
                    </div>
                </div>
            );

        case 'stat':
            return (
                <div className="flex items-center h-full">
                    <div>
                        <div className={`text-[10px] uppercase tracking-widest ${darkMode ? 'text-zinc-600' : 'text-gray-500'} font-bold mb-2`}>
                            {visual.label || 'Mathematical Fact'}
                        </div>
                        <div className={`text-4xl md:text-5xl font-mono font-bold ${darkMode ? 'text-violet-200' : 'text-violet-800'} tracking-tight`}>
                            {visual.data.value}
                        </div>
                        <div className={`inline-flex items-center gap-2 mt-2 px-2 py-1 rounded ${theme.accentBg} border ${theme.accentBorder} text-xs font-mono ${theme.accent}`}>
                            <Calculator className="w-3 h-3" />
                            {visual.data.subtext}
                        </div>
                    </div>
                </div>
            );

        case 'table':
            return (
                <div className={`w-full overflow-hidden rounded border ${theme.border} ${darkMode ? 'bg-black/20' : 'bg-white'}`}>
                    <div className={`grid grid-cols-2 ${darkMode ? 'bg-white/5 text-zinc-500' : 'bg-gray-100 text-gray-600'} text-[10px] uppercase tracking-widest p-3 font-bold`}>
                        {visual.data.headers.map((h: string, i: number) => <div key={i}>{h}</div>)}
                    </div>
                    {visual.data.rows.slice(0, 5).map((row: string[], i: number) => (
                        <div key={i} className={`grid grid-cols-2 p-3 border-t ${theme.border} text-sm font-mono ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                            {row.map((cell: string, j: number) => <div key={j}>{cell}</div>)}
                        </div>
                    ))}
                </div>
            );

        default:
            return null;
    }
}
