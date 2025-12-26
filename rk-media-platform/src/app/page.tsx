import { supabase } from '@/lib/supabaseClient';
import HomePageClient from './HomePageClient';

import { STUDY_TITLES } from '@/lib/studyTitles';

export const revalidate = 0; // Disable static caching for real-time updates

export default async function Home() {
    // Fetch media ordered by date
    const { data: media } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });


    // Pass data to Client Component

    return <HomePageClient initialMedia={media || []} />;
}
