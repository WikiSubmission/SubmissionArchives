import React from 'react';

export function ExpectationCard({ title, body }: { title: string; body: string }) {
    return (
        <div className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 motion-safe:hover:-translate-y-1 bg-black/[0.02] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] hover:bg-black/[0.04] hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12),0_10px_40px_rgba(0,0,0,0.08)] dark:bg-[#0a0a0a]/40 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] dark:hover:bg-[#0a0a0a]/60 dark:hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15),0_10px_40px_rgba(0,0,0,0.4)]">
            {/* Hover Spotlight Glow */}
            <div className="pointer-events-none absolute -left-20 -top-20 hidden h-40 w-40 bg-[radial-gradient(closest-side,var(--ed-accent),transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-10 dark:group-hover:opacity-20 sm:block" />
            
            <div className="relative z-10">
                <div className="flex items-center gap-2">
                    {/* Glowing Accent Dot */}
                    <span className="h-1.5 w-1.5 rounded-full bg-ed-accent shadow-[0_0_6px_var(--ed-accent)] dark:shadow-[0_0_8px_var(--ed-accent)]" />
                    <h4 className="text-[15px] font-medium tracking-wide text-ed-fg">
                        {title}
                    </h4>
                </div>
                <p className="mt-2.5 text-[13px] leading-relaxed text-ed-fg-muted">
                    {body}
                </p>
            </div>
        </div>
    );
}
