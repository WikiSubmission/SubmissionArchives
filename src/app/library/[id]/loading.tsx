export default function LibraryReaderLoading() {
    return (
        <div className="h-screen w-screen bg-ed-bg text-ed-fg flex flex-col">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-ed-rule bg-ed-surface/90 px-3 py-3 animate-pulse sm:px-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-ed-surface-strong" />
                    <div className="h-8 w-8 rounded bg-ed-surface-strong" />
                    <div className="h-4 w-28 rounded bg-ed-surface-strong sm:w-40" />
                </div>
                <div className="hidden items-center gap-1.5 sm:flex">
                    <div className="h-8 w-20 rounded bg-ed-surface-strong" />
                    <div className="h-8 w-20 rounded bg-ed-surface-strong" />
                </div>
            </div>
            <div className="flex flex-1 items-center justify-center p-4 pb-24 sm:p-6 sm:pb-6">
                <div className="h-full w-full max-w-3xl animate-pulse rounded-lg border border-ed-rule bg-ed-surface shadow-sm" />
            </div>
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:hidden">
                <div className="h-10 w-48 animate-pulse rounded-lg border border-ed-rule bg-ed-surface/90 shadow-lg" />
            </div>
        </div>
    );
}
