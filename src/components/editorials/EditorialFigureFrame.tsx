'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

interface EditorialFigureFrameProps {
    /** The inline rendering of the figure, already sized for the column. */
    children: ReactNode;
    src: string;
    alt: string;
    width: number;
    height: number;
    caption?: string;
}

/**
 * Wraps a figure so it can be opened at full size. The inline copy stays
 * server-rendered; only the enlarged view is built on demand.
 */
export default function EditorialFigureFrame({
    children,
    src,
    alt,
    width,
    height,
    caption,
}: EditorialFigureFrameProps) {
    const [open, setOpen] = useState(false);
    const [figureNumber, setFigureNumber] = useState<number | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    /**
     * The number is read from document order at open time. Figures are authored
     * independently in MDX, so nothing upstream knows their position.
     */
    const openFigure = useCallback(() => {
        const frames = Array.from(document.querySelectorAll('[data-editorial-figure]'));
        const position = triggerRef.current ? frames.indexOf(triggerRef.current) : -1;
        setFigureNumber(position >= 0 ? position + 1 : null);
        setOpen(true);
    }, []);

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            setOpen(false);
        };

        // The page behind must not scroll while the enlarged view is up.
        const { overflow } = document.body.style;
        // Captured now so closing returns focus to the figure that was opened.
        const trigger = triggerRef.current;

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);
        closeRef.current?.focus();

        return () => {
            document.body.style.overflow = overflow;
            document.removeEventListener('keydown', onKeyDown);
            trigger?.focus();
        };
    }, [open]);

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                data-editorial-figure
                className="editorial-figure-frame"
                onClick={openFigure}
                aria-label={`Enlarge figure: ${alt}`}
            >
                {children}
            </button>

            {open ? (
                <div
                    className="editorial-lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label={caption ?? alt}
                    onClick={(event) => {
                        if (event.target === event.currentTarget) setOpen(false);
                    }}
                >
                    <button ref={closeRef} type="button" className="editorial-lightbox-exit" onClick={() => setOpen(false)}>
                        Exit
                    </button>

                    <figure className="editorial-lightbox-figure">
                        <div className="editorial-lightbox-plate">
                            <Image
                                src={src}
                                alt={alt}
                                width={width}
                                height={height}
                                quality={90}
                                unoptimized={src.endsWith('.svg')}
                                sizes="90vw"
                                priority
                            />
                        </div>
                        {caption ? (
                            <figcaption className="editorial-lightbox-caption">
                                {figureNumber ? <em>fig. {figureNumber} — </em> : null}
                                {caption}
                            </figcaption>
                        ) : null}
                    </figure>
                </div>
            ) : null}
        </>
    );
}
