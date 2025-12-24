
import { supabase } from '@/lib/supabaseClient';
import Player from './Player';

export const revalidate = 0;

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // 1. Fetch Media Metadata
    const { data: media } = await supabase
        .from('media')
        .select('*')
        .eq('id', id)
        .single();

    if (!media) {
        return <div className="p-8 text-white">Media not found</div>;
    }

    // 2. Fetch Transcript Segments
    const { data: segments } = await supabase
        .from('transcript_segments')
        .select('*')
        .eq('media_id', id)
        .order('segment_index', { ascending: true })
        .limit(5000); // safety limit

    return <Player media={media} segments={segments || []} />;
}
