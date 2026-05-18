import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg font-body flex flex-col">
            <main className="flex-1 flex items-center justify-center px-6 py-24">
                <div className="max-w-2xl w-full text-center space-y-12">
                    {/* Visual Element */}
                    <div className="relative inline-block">
                        <h1 className="text-[12rem] md:text-[18rem] font-black font-ui uppercase tracking-tighter leading-none opacity-5 select-none">
                            404
                        </h1>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="space-y-2">
                                <span className="block text-2xl font-serif italic text-ed-accent">Record Not Found</span>
                                <div className="h-px w-full bg-ed-accent/30" />
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        <h2 className="text-3xl md:text-5xl font-black font-ui uppercase tracking-tighter">
                            Archival Gap Detected
                        </h2>
                        <p className="text-xl text-ed-fg-muted font-serif italic max-w-lg mx-auto leading-relaxed">
                            The specific record or transmission you are seeking does not exist in our current local repository. It may be indexed under a different identifier.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                        <Link 
                            href="/" 
                            className="flex items-center gap-3 px-8 py-4 bg-ed-fg text-ed-bg text-xs font-bold tracking-[0.2em] uppercase transition-all hover:bg-ed-accent hover:scale-105 shadow-xl"
                        >
                            <Home className="w-4 h-4" />
                            Return to Archive
                        </Link>
                        <Link 
                            href="/search" 
                            className="flex items-center gap-3 px-8 py-4 border border-ed-rule text-xs font-bold tracking-[0.2em] uppercase transition-all hover:border-ed-fg hover:bg-ed-surface"
                        >
                            <Search className="w-4 h-4" />
                            Search Records
                        </Link>
                    </div>

                    {/* Technical Note */}
                    <div className="pt-12 text-[10px] font-bold font-ui uppercase tracking-[0.3em] text-ed-fg-muted/30">
                        Error Code: RESOURCE_NOT_FOUND_404
                    </div>
                </div>
            </main>
        </div>
    );
}
