export default function AudiosLoading() {
    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg">
            <main className="mx-auto max-w-[1160px] px-4 py-8 sm:px-7 lg:py-12 animate-pulse">
                {/* Header skeleton */}
                <div className="mb-8 space-y-3">
                    <div className="h-4 w-28 rounded bg-ed-surface-strong" />
                    <div className="h-8 w-64 rounded bg-ed-surface-strong" />
                    <div className="h-4 max-w-xl rounded bg-ed-surface-strong" />
                </div>

                {/* Tabs skeleton */}
                <div className="mb-6 flex gap-2">
                    <div className="h-8 w-24 rounded bg-ed-surface-strong" />
                    <div className="h-8 w-28 rounded bg-ed-surface-strong" />
                    <div className="h-8 w-32 rounded bg-ed-surface-strong" />
                </div>

                {/* Grid skeleton */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="h-64 rounded-lg border border-ed-rule bg-ed-surface" />
                    ))}
                </div>
            </main>
        </div>
    );
}
