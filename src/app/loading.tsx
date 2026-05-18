export default function HomeLoading() {
    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg">
            <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
                <div className="soft-shell h-[44vh] min-h-[320px] animate-pulse" />
                <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="soft-shell h-56 animate-pulse" />
                    ))}
                </div>
            </main>
        </div>
    );
}
