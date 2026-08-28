import Image from 'next/image';
import type { ReactNode } from 'react';

import EditorialFigureFrame from '@/components/editorials/EditorialFigureFrame';

export interface EditorialFigureProps {
    src: string;
    alt: string;
    width: number;
    height: number;
    caption?: string;
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
    priority = false,
}: EditorialFigureProps) {
    return (
        <figure className="editorial-figure">
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
                    // Figures share the text measure, which tops out at 576px
                    // on the default type size and 816px on the widest setting.
                    sizes="(max-width: 768px) 100vw, 816px"
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
 * Two or more figures compared side by side. The pair stacks once the measure
 * can no longer seat two legible columns.
 */
export function EditorialFigureGroup({ children, caption }: EditorialFigureGroupProps) {
    return (
        <div>
            <div className="editorial-figure-group">{children}</div>
            {caption ? <p className="editorial-caption">{caption}</p> : null}
        </div>
    );
}
