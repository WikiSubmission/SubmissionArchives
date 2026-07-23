export default function LibraryReaderLoading() {
    return (
        <div className="h-screen w-screen bg-ed-bg text-ed-fg flex flex-col">
            <div className="flex items-center justify-between border-b border-ed-rule px-4 py-3 animate-pulse sm:px-6">
                <div className="h-6 w-40 rounded bg-ed-muted" />
                <div className="flex gap-2">
                    <div className="h-9 w-9 rounded-full bg-ed-muted" />
                    <div className="h-9 w-9 rounded-full bg-ed-muted" />
                </div>
            </div>
            <div className="flex flex-1 items-center justify-center p-6">
                <div className="soft-shell h-full w-full max-w-3xl animate-pulse bg-ed-muted/40" />
            </div>
        </div>
    );
}
