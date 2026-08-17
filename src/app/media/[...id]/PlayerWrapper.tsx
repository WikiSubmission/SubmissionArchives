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
// The `?t=` deep-link seek time is a client-only concern, so we read it here
// with useSearchParams (which requires the Suspense boundary below) rather than
// awaiting searchParams on the server, which would force dynamic rendering.
type PlayerWrapperProps = Omit<GoldenPlayerProps, 'initialSeekTime'>;

function PlayerWithSeek(props: PlayerWrapperProps) {
  const searchParams = useSearchParams();
  const requestedTime = parseTimeParam(searchParams.get('t'));
  const initialSeekTime = requestedTime !== undefined && requestedTime >= 0 ? requestedTime : undefined;

  return <GoldenPlayer {...props} initialSeekTime={initialSeekTime} />;
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
    <div className="min-h-screen" style={{ background: 'var(--qs-bg-primary, #0F0E0D)' }}>
      <main className="mx-auto max-w-[1160px] px-7 py-10">
        <div className="h-[56vw] max-h-[640px] min-h-[220px] animate-pulse rounded-lg" style={{ background: 'var(--qs-bg-secondary, #161514)' }} />
      </main>
    </div>
  );
}
