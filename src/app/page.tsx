import HomePageClient from './HomePageClient';

export const revalidate = 3600;

export default async function Home() {
    return <HomePageClient />;
}
