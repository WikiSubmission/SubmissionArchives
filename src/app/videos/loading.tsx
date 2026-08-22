export default function VideosLoading() {
    return (
        <div className="relative min-h-screen bg-ed-bg text-ed-fg font-sans">
            {/* Archival ambient radial glow */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 600px 400px at 85% 10%, rgba(184,98,51,0.025) 0%, transparent 70%), ' +
                        'radial-gradient(ellipse 400px 300px at 15% 90%, rgba(184,98,51,0.015) 0%, transparent 70%)',
                }}
            />

            <main className="relative z-[1] mx-auto max-w-[1160px] px-4 py-8 sm:px-7 lg:py-12">
                {/* Hero Header Skeleton */}
                <header className="mb-7 flex flex-wrap items-end justify-between gap-8 border-b border-ed-rule pb-7">
                    <div className="grid max-w-2xl gap-3">
                        <div className="h-6 w-36 rounded bg-ed-surface animate-pulse" />
                        <div className="h-11 w-72 sm:w-96 rounded bg-ed-surface animate-pulse" />
                        <div className="h-4 w-full max-w-lg rounded bg-ed-surface/70 animate-pulse" />
                    </div>

                    <div className="flex gap-6 rounded-[8px] border border-ed-rule bg-ed-surface px-6 py-4 shadow-sm">
                        <div className="space-y-1.5">
                            <div className="h-6 w-12 rounded bg-ed-surface-strong animate-pulse" />
                            <div className="h-2.5 w-16 rounded bg-ed-surface-strong/50" />
                        </div>
                        <div className="border-l border-ed-rule pl-6 space-y-1.5">
                            <div className="h-6 w-10 rounded bg-ed-surface-strong animate-pulse" />
                            <div className="h-2.5 w-14 rounded bg-ed-surface-strong/50" />
                        </div>
                    </div>
                </header>

                {/* Collection Tabs Skeleton */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-8 w-28 rounded-[4px] border border-ed-rule bg-ed-surface animate-pulse"
                        />
                    ))}
                </div>

                {/* Filter Bar Skeleton */}
                <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-ed-rule pb-5">
                    <div className="h-9 w-full max-w-sm rounded-[4px] border border-ed-rule bg-ed-surface animate-pulse" />
                    <div className="h-9 w-40 shrink-0 rounded-[4px] border border-ed-rule bg-ed-surface animate-pulse" />
                </div>

                {/* Section Header Skeleton */}
                <div className="mb-7 flex items-center gap-4 border-b border-ed-rule pb-3">
                    <div className="h-6 w-44 rounded bg-ed-surface animate-pulse" />
                    <div className="h-px flex-1 bg-ed-rule" />
                    <div className="h-3 w-16 rounded bg-ed-surface" />
                </div>

                {/* Card Grid Skeleton */}
                <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="flex flex-col overflow-hidden rounded-[12px] border border-ed-rule bg-ed-surface shadow-sm"
                        >
                            <div className="aspect-video w-full bg-ed-surface-strong animate-pulse" />
                            <div className="p-4 space-y-3">
                                <div className="flex justify-between">
                                    <div className="h-3 w-20 rounded bg-ed-surface-strong animate-pulse" />
                                    <div className="h-3 w-12 rounded bg-ed-surface-strong/60 animate-pulse" />
                                </div>
                                <div className="h-5 w-3/4 rounded bg-ed-surface-strong animate-pulse" />
                                <div className="h-8 w-full rounded bg-ed-surface-strong/40 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}