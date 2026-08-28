import type { MDXComponents } from 'mdx/types';

import {
    Lead,
    MuslimPerspectiveQuote,
    NewsletterQuote,
    Note,
    Notes,
    PullQuote,
    Ref,
    SubmitterPerspectiveQuote,
    Verse,
} from '@/components/editorials/EditorialBlocks';
import EditorialFigure, { EditorialFigureGroup } from '@/components/editorials/EditorialFigure';

/**
 * Components available to every editorial without an import. Element styling is
 * handled by `editorials.css` rather than element overrides, so this map only
 * carries the editorial building blocks.
 */
const components: MDXComponents = {
    Figure: EditorialFigure,
    FigureGroup: EditorialFigureGroup,
    Lead,
    MuslimPerspectiveQuote,
    NewsletterQuote,
    Note,
    Notes,
    PullQuote,
    Ref,
    SubmitterPerspectiveQuote,
    Verse,
};

export function useMDXComponents(): MDXComponents {
    return components;
}
