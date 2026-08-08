import { redirect } from 'next/navigation';

const OT_SLUG_TO_BOOK_CODE: Record<string, string> = {
    genesis: 'gen', exodus: 'exo', leviticus: 'lev', numbers: 'num', deuteronomy: 'deu',
    joshua: 'jos', judges: 'jdg', '1-samuel': '1sa', '2-samuel': '2sa', '1-kings': '1ki', '2-kings': '2ki',
    isaiah: 'isa', jeremiah: 'jer', ezekiel: 'ezk', hosea: 'hos', joel: 'joe', amos: 'amo',
    obadiah: 'oba', jonah: 'jon', micah: 'mic', nahum: 'nam', habakkuk: 'hab', zephaniah: 'zep',
    haggai: 'hag', zechariah: 'zec', malachi: 'mal', psalms: 'psa', proverbs: 'pro', job: 'job',
    'song-of-songs': 'sng', ruth: 'rut', lamentations: 'lam', ecclesiastes: 'ecc', esther: 'est',
    daniel: 'dan', ezra: 'ezr', nehemiah: 'neh', '1-chronicles': '1ch', '2-chronicles': '2ch',
};

type Props = {
    params: Promise<{ book: string; chapter: string }>;
};

export default async function OTChapterPage({ params }: Props) {
    const { book: bookSlug } = await params;
    const code = OT_SLUG_TO_BOOK_CODE[bookSlug.toLowerCase()] || bookSlug.toLowerCase();
    redirect(`/scripture/bible/${code}`);
}
