// Matches the search page's frame (width, header and control card) so nothing shifts
// when the client takes over.
export default function SearchLoading() {
    return (
        <div className="relative min-h-screen bg-ed-bg text-ed-fg">
            <main className="relative z-[1] overflow-hidden">
                <div className="mx-auto max-w-5xl px-4 py-8 sm:px-7 lg:py-12">
                    <div className="mb-7 space-y-3 border-b border-ed-rule pb-7">
                        <div className="h-6 w-48 animate-pulse rounded-[4px] bg-ed-surface-strong" />
                        <div className="h-10 w-72 animate-pulse rounded-[4px] bg-ed-surface-strong" />
                        <div className="h-5 w-96 max-w-full animate-pulse rounded-[4px] bg-ed-surface-strong" />
                    </div>
                    <div className="animate-pulse space-y-4 rounded-[8px] border border-ed-rule bg-ed-surface p-4 shadow-sm sm:p-5">
                        <div className="h-11 w-full rounded-[4px] bg-ed-surface-strong" />
                        <div className="h-7 w-2/3 rounded-[4px] bg-ed-surface-strong" />
                    </div>
                </div>
            </main>
        </div>
    );
}
