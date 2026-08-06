import React from 'react';
import type { Metadata } from 'next';
import { Mint3DModelGenerator } from '@/components/mint/Mint3DModelGenerator';

export const metadata: Metadata = {
  title: 'Mint 3D Model Generator | Submission Archives',
  description: 'Generate and retrieve account-owned 3D Models using Mint API.',
};

export default function Mint3DPage() {
  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-50 sm:text-4xl">
            Mint 3D Model Asset Pipeline
          </h1>
          <p className="text-base text-stone-400 max-w-2xl mx-auto">
            Server-side generation flow featuring default auto workflow, bounded exponential backoff polling, and resource file manifest discovery.
          </p>
        </div>

        <Mint3DModelGenerator />
      </div>
    </main>
  );
}
