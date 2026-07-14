export default function WrittenLoading() {
    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg">
            <main className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                <section className="soft-shell grid gap-6 p-6 sm:p-8 lg:p-10">
                    <div className="h-8 w-48 rounded-full bg-ed-muted" />
                    <div className="h-24 max-w-xl rounded bg-ed-muted" />
                    <div className="h-6 max-w-2xl rounded bg-ed-muted" />
                </section>
                <div className="mt-12 grid gap-6 lg:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="soft-shell h-64 animate-pulse" />
                    ))}
                </div>
            </main>
        </div>
    );
}
