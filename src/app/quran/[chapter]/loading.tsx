export default function QuranChapterLoading() {
    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg">
            <main className="mx-auto max-w-[800px] px-4 py-8 sm:px-6 lg:py-12 animate-pulse space-y-6">
                {/* Header skeleton */}
                <div className="space-y-3 border-b border-ed-rule pb-6">
                    <div className="h-4 w-24 rounded bg-ed-surface-strong" />
                    <div className="h-9 w-64 rounded bg-ed-surface-strong" />
                    <div className="h-4 w-40 rounded bg-ed-surface-strong" />
                </div>

                {/* Verses skeleton */}
                <div className="space-y-4 pt-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="rounded-lg border border-ed-rule bg-ed-surface p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="h-4 w-12 rounded-full bg-ed-surface-strong" />
                                <div className="h-4 w-20 rounded bg-ed-surface-strong" />
                            </div>
                            <div className="h-5 w-full rounded bg-ed-surface-strong" />
                            <div className="h-5 w-4/5 rounded bg-ed-surface-strong" />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
