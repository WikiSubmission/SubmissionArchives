'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { PlayerProps } from './Player';

const Player = dynamic(() => import('./Player'), {
  ssr: false,
  loading: () => <PlayerLoadingSkeleton />
});

// The server component is fully static (prerendered via generateStaticParams).
// The `?t=` deep-link seek time is a client-only concern, so we read it here
// with useSearchParams (which requires the Suspense boundary below) rather than
// awaiting searchParams on the server, which would force dynamic rendering.
type PlayerWrapperProps = Omit<PlayerProps, 'initialSeekTime'>;

function PlayerWithSeek(props: PlayerWrapperProps) {
  const searchParams = useSearchParams();
  const rawTime = searchParams.get('t');
  const requestedTime = rawTime !== null ? Number(rawTime) : undefined;
  const initialSeekTime =
    requestedTime !== undefined && Number.isFinite(requestedTime) && requestedTime >= 0
      ? requestedTime
      : undefined;

  return <Player {...props} initialSeekTime={initialSeekTime} />;
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
    <div className="min-h-screen bg-ed-bg text-ed-fg">
      <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
        <div className="soft-shell h-[56vw] max-h-[640px] min-h-[220px] animate-pulse bg-neutral-900 rounded-lg" />
      </main>
    </div>
  );
}
