import Image from 'next/image';
import type { ReactNode } from 'react';

import EditorialFigureFrame from '@/components/editorials/EditorialFigureFrame';

export interface EditorialFigureProps {
    src: string;
    alt: string;
    width: number;
    height: number;
    caption?: string;
    /** `full` breaks past the text measure; `column` stays inside it. */
    span?: 'full' | 'column';
    /** Set on the first figure of an editorial so it can carry the LCP. */
    priority?: boolean;
}

/**
 * An editorial figure. Assets live under `public/editorials/<slug>/`, and the
 * intrinsic dimensions are required so the layout never shifts while the image
 * decodes. Clicking it opens the figure at full size.
 */
export default function EditorialFigure({
    src,
    alt,
    width,
    height,
    caption,
    span = 'full',
    priority = false,
}: EditorialFigureProps) {
    return (
        <figure className={span === 'full' ? 'editorial-figure editorial-breakout' : 'editorial-figure'}>
            <EditorialFigureFrame src={src} alt={alt} width={width} height={height} caption={caption ?? alt}>
                <Image
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    quality={85}
                    // The optimizer rejects SVG unless `dangerouslyAllowSVG` is
                    // enabled globally, which would also apply to remote images.
                    // Diagram SVGs are served straight from /public instead.
                    unoptimized={src.endsWith('.svg')}
                    priority={priority}
                    loading={priority ? undefined : 'lazy'}
                    sizes={span === 'full' ? '(max-width: 768px) 100vw, 704px' : '(max-width: 768px) 100vw, 352px'}
                />
            </EditorialFigureFrame>
            {caption ? <figcaption className="editorial-caption">{caption}</figcaption> : null}
        </figure>
    );
}

export interface EditorialFigureGroupProps {
    children: ReactNode;
    caption?: string;
}

/**
 * Two or more figures compared side by side. Below the medium breakpoint the
 * group becomes a snap-scrolling strip rather than shrinking each image past
 * legibility.
 */
export function EditorialFigureGroup({ children, caption }: EditorialFigureGroupProps) {
    return (
        <div className="editorial-breakout">
            <div className="editorial-figure-group">{children}</div>
            {caption ? <p className="editorial-caption">{caption}</p> : null}
        </div>
    );
}
