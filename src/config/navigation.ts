import { YOUTUBE_URL, DISCORD_URL } from '@/config/social';

export const PRIMARY_NAV = [
    { name: 'Home', href: '/' },
    { name: 'Videos', href: '/videos' },
    { name: 'Audios', href: '/audios' },
    { name: 'Written', href: '/written' },
    { name: "Qur'an", href: '/quran' },
    { name: 'Search', href: '/search' },
];

export const FOOTER_NAV = [
    {
        title: 'Archive',
        links: [
            { name: 'Video library', href: '/videos' },
            { name: 'Audio library', href: '/audios' },
            { name: 'Written archive', href: '/written' },
            { name: "Qur'an editions", href: '/quran' },
        ],
    },
    {
        title: 'Research',
        links: [
            { name: 'Search the archive', href: '/search' },
            { name: 'Video programs', href: '/videos#programs' },
            { name: 'Friday sermons', href: '/videos#sermons' },
            { name: 'Newsletter search', href: '/search?filters=perspective' },
        ],
    },
    {
        title: 'Community',
        links: [
            { name: 'YouTube', href: YOUTUBE_URL },
            { name: 'Discord', href: DISCORD_URL },
            { name: 'Quran studies', href: '/audios#quran-studies' },
            { name: 'Messenger audios', href: '/audios#messenger-audios' },
        ],
    },
];
