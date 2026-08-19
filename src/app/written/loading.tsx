export default function WrittenLoading() {
    return (
        <div className="relative min-h-screen bg-ed-bg text-ed-fg font-sans antialiased">
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
                {/* Breadcrumb Skeleton */}
                <div className="mb-5 flex items-center gap-2">
                    <div className="h-3 w-28 rounded-full bg-ed-surface-strong animate-pulse" />
                    <div className="h-3 w-3 rounded-full bg-ed-surface-strong/40" />
                    <div className="h-3 w-24 rounded-full bg-ed-surface-strong animate-pulse" />
                </div>

                {/* Hero Header Skeleton */}
                <header className="mb-8 flex flex-wrap items-end justify-between gap-8 border-b border-ed-rule pb-8">
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

                {/* Books Section Skeleton */}
                <div className="mb-7 flex items-center gap-4 border-b border-ed-rule pb-3">
                    <div className="h-6 w-44 rounded bg-ed-surface animate-pulse" />
                    <div className="h-px flex-1 bg-ed-rule" />
                    <div className="h-3 w-16 rounded bg-ed-surface" />
                </div>

                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="flex flex-col overflow-hidden rounded-[8px] border border-ed-rule bg-ed-surface p-3"
                        >
                            <div className="aspect-[2/3] w-full rounded bg-ed-surface-strong animate-pulse" />
                            <div className="mt-3 space-y-2">
                                <div className="h-4 w-3/4 rounded bg-ed-surface-strong animate-pulse" />
                                <div className="h-3 w-1/2 rounded bg-ed-surface-strong/50 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Newsletters Section Skeleton */}
                <div className="mt-16 mb-7 flex items-center gap-4 border-b border-ed-rule pb-3">
                    <div className="h-6 w-52 rounded bg-ed-surface animate-pulse" />
                    <div className="h-px flex-1 bg-ed-rule" />
                    <div className="h-3 w-20 rounded bg-ed-surface" />
                </div>

                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="flex flex-col overflow-hidden rounded-[8px] border border-ed-rule bg-ed-surface p-3"
                        >
                            <div className="aspect-[17/22] w-full rounded bg-ed-surface-strong animate-pulse" />
                            <div className="mt-3 space-y-2">
                                <div className="h-4 w-3/4 rounded bg-ed-surface-strong animate-pulse" />
                                <div className="h-3 w-1/3 rounded bg-ed-surface-strong/50 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}