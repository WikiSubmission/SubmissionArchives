type ExpectationCardProps = {
    index?: string;
    title: string;
    body: string;
};

export function ExpectationCard({ index, title, body }: ExpectationCardProps) {
    return (
        <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-[#2A2928] bg-gradient-to-b from-[#161514] via-[#161514]/90 to-[#121110] p-5 sm:p-6 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.5)] transition-all duration-200 ease-out hover:border-[#353433] hover:bg-[#1C1B1A] hover:-translate-y-0.5">
            <div>
                <div className="flex items-center gap-2.5">
                    <span
                        className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-[#2A2928] bg-[#1C1B1A] px-1.5 font-mono text-[0.68rem] font-bold text-[#C8794A] transition-colors group-hover:border-[#C8794A]/40 group-hover:text-[#D9916A]"
                        aria-hidden="true"
                    >
                        {index ? index : '•'}
                    </span>
                    <h4 className="font-sans text-[0.95rem] font-semibold leading-snug tracking-[-0.01em] text-[#F5F0EB]">
                        {title}
                    </h4>
                </div>
                <p className="mt-2.5 text-xs sm:text-[0.84rem] leading-[1.65] text-[#9E9690]">
                    {body}
                </p>
            </div>
        </div>
    );
}

