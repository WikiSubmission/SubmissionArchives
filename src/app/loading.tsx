export default function HomeLoading() {
    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg">
            <main className="mx-auto max-w-[1160px] px-4 py-8 sm:px-7 lg:py-12 animate-pulse space-y-12">
                {/* Hero skeleton */}
                <div className="space-y-4 text-center max-w-2xl mx-auto pt-6">
                    <div className="h-6 w-36 rounded-full bg-ed-surface-strong mx-auto" />
                    <div className="h-12 w-3/4 rounded bg-ed-surface-strong mx-auto" />
                    <div className="h-4 w-5/6 rounded bg-ed-surface-strong mx-auto" />
                    <div className="h-10 w-44 rounded bg-ed-surface-strong mx-auto mt-4" />
                </div>

                {/* Section skeleton */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="h-48 rounded-lg border border-ed-rule bg-ed-surface p-5 space-y-3">
                            <div className="h-6 w-6 rounded bg-ed-surface-strong" />
                            <div className="h-5 w-3/4 rounded bg-ed-surface-strong" />
                            <div className="h-4 w-full rounded bg-ed-surface-strong" />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
