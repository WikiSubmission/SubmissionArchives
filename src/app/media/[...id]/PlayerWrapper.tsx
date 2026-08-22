'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { parseTimeParam } from '@/lib/formatUtils';
import type { GoldenPlayerProps } from '@/components/player/GoldenPlayer';

const GoldenPlayer = dynamic(() => import('@/components/player/GoldenPlayer'), {
  ssr: false,
  loading: () => <PlayerLoadingSkeleton />
});

// The server component is fully static (prerendered via generateStaticParams).
// The `?t=` deep-link seek time and `?lang=` transcript language are client-only
// concerns, so we read them here with useSearchParams (which requires the Suspense
// boundary below) rather than awaiting searchParams on the server, which would force
// dynamic rendering.
type PlayerWrapperProps = Omit<GoldenPlayerProps, 'initialSeekTime' | 'initialTranscriptLang'>;

function PlayerWithSeek(props: PlayerWrapperProps) {
  const searchParams = useSearchParams();
  const requestedTime = parseTimeParam(searchParams.get('t'));
  const initialSeekTime = requestedTime !== undefined && requestedTime >= 0 ? requestedTime : undefined;
  // Only 'ar' is honoured; anything else falls through to the English default, so a
  // stray or stale value cannot leave the transcript panel empty.
  const initialTranscriptLang = searchParams.get('lang') === 'ar' ? 'ar' : undefined;

  return (
    <GoldenPlayer
      {...props}
      initialSeekTime={initialSeekTime}
      initialTranscriptLang={initialTranscriptLang}
    />
  );
}

export default function PlayerWrapper(props: PlayerWrapperProps) {
  return (
    <Suspense fallback={<PlayerLoadingSkeleton />}>
      <PlayerWithSeek {...props} />
    </Suspense>
  );
}

function PlayerLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-ed-bg">
      <main className="mx-auto max-w-[1160px] px-7 py-10">
        <div className="h-[56vw] max-h-[640px] min-h-[220px] animate-pulse rounded-lg border border-ed-rule bg-ed-surface" />
      </main>
    </div>
  );
}
