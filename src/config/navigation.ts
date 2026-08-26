import { YOUTUBE_URL, DISCORD_URL } from '@/config/social';

export const PRIMARY_NAV = [
    { name: 'Home', href: '/' },
    { name: 'Videos', href: '/videos' },
    { name: 'Audios', href: '/audios' },
    { name: 'Written', href: '/written' },
    { name: 'Scriptures', href: '/scripture/quran' },
    { name: 'Search', href: '/search' },
    { name: 'App', href: '/app' },
];

export const FOOTER_NAV = [
    {
        title: 'Scripture',
        links: [
            { name: "The Qur'an", href: '/scripture/quran' },
            { name: 'Appendices', href: '/scripture/quran/appendices' },
            { name: 'Old Testament', href: '/scripture/old-testament' },
            { name: 'OT Apocrypha', href: '/scripture/old-testament/apocrypha' },
            { name: 'New Testament', href: '/scripture/new-testament' },
        ],
    },
    {
        title: 'Preserved Media',
        links: [
            { name: 'Video Archive', href: '/videos' },
            { name: 'Audio Recordings', href: '/audios' },
            { name: 'Friday Sermons', href: '/videos#sermons' },
            { name: 'Quran Studies', href: '/audios#quran-studies' },
            { name: 'Messenger Audios', href: '/audios#messenger-audios' },
        ],
    },
    {
        title: 'Written Library',
        links: [
            { name: 'Submitters Perspective', href: '/written' },
            { name: 'Books & Publications', href: '/written#books' },
            { name: 'Archive Editorials', href: '/editorials' },
            { name: 'Historical Editions', href: '/scripture/quran/appendices' },
            { name: 'Global Deep Search', href: '/search' },
        ],
    },
    {
        title: 'Community',
        links: [
            { name: 'YouTube Channel', href: YOUTUBE_URL },
            { name: 'Discord Server', href: DISCORD_URL },
            { name: 'Preservation Principles', href: '/terms' },
            { name: 'Privacy Policy', href: '/privacy' },
        ],
    },
];
