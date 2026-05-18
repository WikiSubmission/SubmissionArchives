export default function VideosLoading() {
    return <CatalogLoadingShell titleWidth="w-56" />;
}

function CatalogLoadingShell({ titleWidth }: { titleWidth: string }) {
    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg">
            <main className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                <section className="soft-shell grid gap-6 p-6 sm:p-8 lg:p-10">
                    <div className="h-5 w-36 rounded-full bg-ed-muted" />
                    <div className={`h-14 ${titleWidth} rounded bg-ed-muted`} />
                    <div className="h-6 max-w-2xl rounded bg-ed-muted" />
                </section>
                <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="soft-shell aspect-[4/3] animate-pulse" />
                    ))}
                </div>
            </main>
        </div>
    );
}
