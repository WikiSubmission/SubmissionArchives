import { useEffect, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';

interface ResumePromptProps {
    lastPosition: number | null;
    onResume: () => void;
    onStartOver: () => void;
}

export default function ResumePrompt({ lastPosition, onResume, onStartOver }: ResumePromptProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (lastPosition && lastPosition > 10) { // Only prompt if > 10 seconds in
            const showTimer = setTimeout(() => setIsVisible(true), 0);

            // Auto-hide after 15 seconds
            const hideTimer = setTimeout(() => setIsVisible(false), 15000);
            return () => {
                clearTimeout(showTimer);
                clearTimeout(hideTimer);
            };
        }
    }, [lastPosition]);

    function formatTime(seconds: number) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    if (!isVisible || !lastPosition) return null;

    return (
        <div className="absolute top-4 right-4 bg-zinc-900/95 backdrop-blur-sm p-4 rounded-lg border border-zinc-700 z-50 animate-in slide-in-from-top fade-in shadow-2xl max-w-sm">
            <p className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <span>Resume from <span className="font-mono text-ed-accent">{formatTime(lastPosition)}</span>?</span>
            </p>
            <div className="flex gap-2">
                <button
                    onClick={() => {
                        onResume();
                        setIsVisible(false);
                    }}
                    className="flex-1 px-3 py-2 bg-ed-accent/90 hover:bg-ed-accent rounded text-xs font-bold uppercase tracking-wider text-ed-bg flex items-center justify-center gap-2 transition-colors"
                >
                    <Play className="w-3 h-3 fill-current" /> Resume
                </button>
                <button
                    onClick={() => {
                        onStartOver();
                        setIsVisible(false);
                    }}
                    className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-center gap-2 transition-colors"
                >
                    <RotateCcw className="w-3 h-3" /> Start Over
                </button>
            </div>
            <button
                onClick={() => setIsVisible(false)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-zinc-800 rounded-full border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-xs"
            >
                ✕
            </button>
        </div>
    );
}
