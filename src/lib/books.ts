import booksData from '../../public/data/generated_indices/BOOKS_LIST.json';

export type BookListItem = (typeof booksData)[number];

// The reading order the Written page and the home page both follow; anything not listed
// falls in after these, alphabetically.
const PREFERRED_BOOK_ORDER = [
    'quran-visual-presentation',
    'quran-hadith-islam',
    'miracle-of-quran-alphabets',
    'islam-volume-1-number-1-april-1974',
    'islam-volume-1-number-2-july-1974',
    'islam-volume-1-number-3-4-january-1975',
    'perpetual-miracle',
    'computer-speaks',
] as const;

const preferredBookRank = new Map<string, number>(PREFERRED_BOOK_ORDER.map((id, index) => [id, index]));

export function getBooks(): BookListItem[] {
    return booksData
        .filter((book) => book.category === 'Books')
        .sort((left, right) => {
            const leftRank = preferredBookRank.get(left.id) ?? Number.MAX_SAFE_INTEGER;
            const rightRank = preferredBookRank.get(right.id) ?? Number.MAX_SAFE_INTEGER;
            return leftRank - rightRank || left.title.localeCompare(right.title);
        });
}
