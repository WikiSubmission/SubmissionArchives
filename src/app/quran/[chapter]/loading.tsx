export default function QuranChapterLoading() {
    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg">
            <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
                <div className="grid gap-5 animate-pulse">
                    <div className="h-4 w-24 rounded-full bg-ed-muted" />
                    <div className="h-12 w-64 rounded bg-ed-muted" />
                    <div className="h-6 w-40 rounded bg-ed-muted" />
                    <div className="mt-6 grid gap-8">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="grid gap-3">
                                <div className="h-4 w-16 rounded-full bg-ed-muted" />
                                <div className="h-6 w-full rounded bg-ed-muted" />
                                <div className="h-6 w-5/6 rounded bg-ed-muted" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
