'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import type { PlayerProps } from './Player';

const Player = dynamic(() => import('./Player'), {
  ssr: false,
  loading: () => <PlayerLoadingSkeleton />
});

export default function PlayerWrapper(props: PlayerProps) {
  return (
    <Suspense fallback={<PlayerLoadingSkeleton />}>
      <Player {...props} />
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