import HomePage from '@/components/home/HomePageClient';

export const revalidate = 3600;

export default function Page() {
    return <HomePage />;
}
