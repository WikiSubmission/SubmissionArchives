type ExpectationCardProps = {
    index?: string;
    title: string;
    body: string;
};

export function ExpectationCard({ index, title, body }: ExpectationCardProps) {
    return (
        <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-ed-rule-strong/80 bg-gradient-to-b from-ed-surface/90 via-ed-surface/70 to-ed-surface/50 p-5 sm:p-6 shadow-[0_12px_28px_-10px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.05)_inset] backdrop-blur-xl transition-all duration-300 hover:border-ed-fg/40 hover:shadow-xl hover:-translate-y-0.5">
            <div>
                <div className="flex items-center gap-2.5">
                    <span
                        className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-ed-rule-strong bg-ed-surface-strong px-2 font-mono text-[0.68rem] font-bold text-ed-fg shadow-sm transition-colors group-hover:bg-ed-fg group-hover:text-ed-bg"
                        aria-hidden="true"
                    >
                        {index ? index : '•'}
                    </span>
                    <h4 className="font-sans text-[0.95rem] font-bold leading-snug text-ed-fg">
                        {title}
                    </h4>
                </div>
                <p className="mt-3 text-[0.84rem] leading-relaxed text-ed-fg-muted">
                    {body}
                </p>
            </div>
        </div>
    );
}
