import HomePageClient from '@/components/home/HomePageClient';

export const revalidate = 3600;

export default async function Home() {
    return <HomePageClient />;
}
