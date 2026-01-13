
import type { ThemeColors } from '@/lib/theme';

interface SkeletonCardProps {
    theme: ThemeColors;
}

export default function SkeletonCard({ theme }: SkeletonCardProps) {
    return (
        <div className={`${theme.card} p-6 border ${theme.border} rounded-sm overflow-hidden animate-pulse`}>
            <div className="flex items-start gap-4">
                {/* Icon / Date Box Skeleton */}
                <div className={`shrink-0 w-16 h-20 ${theme.bg === 'bg-zinc-950' ? 'bg-zinc-900' : 'bg-zinc-200'} rounded-sm`}></div>

                <div className="flex-1 min-w-0 space-y-3">
                    {/* Title Skeleton */}
                    <div className="flex items-baseline justify-between gap-4">
                        <div className={`h-6 ${theme.bg === 'bg-zinc-950' ? 'bg-zinc-800' : 'bg-zinc-200'} rounded w-3/4`}></div>
                        <div className={`h-5 ${theme.bg === 'bg-zinc-950' ? 'bg-zinc-800' : 'bg-zinc-200'} rounded w-24`}></div>
                    </div>

                    {/* Snippet Skeleton */}
                    <div className="space-y-2 mt-3">
                        <div className={`h-4 ${theme.bg === 'bg-zinc-950' ? 'bg-zinc-800' : 'bg-zinc-200'} rounded w-full`}></div>
                        <div className={`h-4 ${theme.bg === 'bg-zinc-950' ? 'bg-zinc-800' : 'bg-zinc-200'} rounded w-5/6`}></div>
                    </div>

                    {/* Button Skeleton */}
                    <div className={`h-4 ${theme.bg === 'bg-zinc-950' ? 'bg-zinc-800' : 'bg-zinc-200'} rounded w-24 mt-4`}></div>
                </div>
            </div>
        </div>
    );
}
