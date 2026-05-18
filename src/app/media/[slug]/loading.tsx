export default function Loading() {
    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg">
            <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-8 animate-pulse">
                <div className="grid lg:grid-cols-[1fr_450px] gap-8">
                    <div className="space-y-6">
                        <div className="aspect-video bg-ed-surface rounded-2xl border border-ed-rule relative overflow-hidden">
                            {/* We don't have the slug here easily in Next.js 13+ loading.tsx without some tricks, 
                                but we can show a high-fidelity skeleton */}
                            <div className="absolute inset-0 bg-gradient-to-br from-ed-surface to-ed-bg opacity-50" />
                        </div>
                        <div className="h-10 bg-ed-surface rounded-lg w-2/3" />
                        <div className="h-4 bg-ed-surface rounded-lg w-1/4" />
                    </div>
                    <div className="bg-ed-surface/30 border border-ed-rule rounded-2xl h-[600px] lg:h-[calc(100vh-160px)]" />
                </div>
            </div>
        </div>
    );
}
