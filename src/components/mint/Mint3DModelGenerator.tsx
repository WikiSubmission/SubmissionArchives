'use client';

import React, { useEffect, useState } from 'react';
import { Box, Check, Copy, ExternalLink, HardDrive, AlertTriangle, Sparkles, Loader2, RefreshCw } from 'lucide-react';

interface ArtifactFile {
  id?: string;
  name?: string;
  filename?: string;
  contentType?: string;
  mimeType?: string;
  sizeBytes?: number;
  downloadUrl?: string;
  url?: string;
  type?: string;
}

interface ArtifactManifest {
  artifacts?: ArtifactFile[];
  runtime?: {
    runtimeUrl?: string;
  };
}

interface LibraryAsset {
  id: string;
  type?: string;
  name?: string;
  prompt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface OperationBilling {
  reason: string;
  resource: string;
  stage: string;
  requiredCredits: number;
  availableCredits?: number;
  actionUrl: string;
}

interface MintOperation {
  id: string;
  type: string;
  status: string;
  generationPreset?: string;
  resource?: {
    type: string;
    id: string;
  } | null;
  billing?: OperationBilling;
  error?: {
    code: string;
    message: string;
  };
}

export function Mint3DModelGenerator() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [configMessage, setConfigMessage] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('A detailed hand-carved wooden chest with iron accents');
  const [title, setTitle] = useState<string>('Ancient Chest');
  const [preset, setPreset] = useState<'fast' | 'standard' | 'production'>('standard');
  const [riggingPose, setRiggingPose] = useState<'' | 't_pose' | 'a_pose'>('');
  const [allowPaidTest, setAllowPaidTest] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const [operation, setOperation] = useState<MintOperation | null>(null);
  const [asset, setAsset] = useState<LibraryAsset | null>(null);
  const [manifest, setManifest] = useState<ArtifactManifest | null>(null);

  useEffect(() => {
    fetch('/api/mint/3d-model')
      .then((res) => res.json())
      .then((data) => {
        if (data.configured) {
          setConfigured(true);
        } else {
          setConfigured(false);
          setConfigMessage(data.message || 'MINT_API_KEY is missing from the server environment.');
        }
      })
      .catch(() => {
        setConfigured(false);
        setConfigMessage('MINT_API_KEY is missing from the server environment. Please create an API key at https://platform.mint.gg and set MINT_API_KEY in your server environment.');
      });
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (!allowPaidTest) {
      setError('Explicit permission is required before running a paid 3D Model generation test.');
      return;
    }

    setLoading(true);
    setError(null);
    setOperation(null);
    setAsset(null);
    setManifest(null);
    setStatusMessage('Initiating 3D Model generation with Mint API...');

    try {
      const res = await fetch('/api/mint/3d-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          prompt: prompt.trim(),
          name: title.trim() || undefined,
          generationPreset: preset,
          riggingPose: riggingPose || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401 && data.error?.includes('MINT_API_KEY')) {
          setConfigured(false);
          setConfigMessage(data.error);
        }
        throw new Error(data.error || 'Failed to generate 3D model.');
      }

      setOperation(data.operation);

      if (data.billingRequired) {
        setStatusMessage('Billing required to complete this generation.');
      } else if (data.operation?.status === 'succeeded' || data.operation?.status === 'partially_succeeded') {
        setStatusMessage('3D Model generated successfully!');
        if (data.asset) setAsset(data.asset);
        if (data.manifest) setManifest(data.manifest);
      } else {
        setStatusMessage(`Operation finished with status: ${data.operation?.status}`);
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during generation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-stone-900 border border-stone-800 rounded-2xl text-stone-100 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-stone-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-950/70 border border-emerald-800/60 rounded-xl text-emerald-400">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-stone-50">Mint 3D Model Generator</h2>
            <p className="text-sm text-stone-400">Server-side auto workflow with bounded polling & manifest retrieval</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {configured === true ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
              <Check className="w-3.5 h-3.5 mr-1" /> MINT_API_KEY Configured
            </span>
          ) : configured === false ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-950 text-amber-300 border border-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> MINT_API_KEY Missing
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-stone-800 text-stone-400">
              Checking status...
            </span>
          )}
        </div>
      </div>

      {configured === false && (
        <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-sm space-y-2">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Server Environment Configuration Needed</p>
              <p className="mt-1 leading-relaxed text-amber-200/90">{configMessage}</p>
              <div className="mt-3">
                <a
                  href="https://platform.mint.gg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 bg-amber-900/60 hover:bg-amber-800/80 border border-amber-700/80 rounded-lg text-xs font-medium text-amber-100 transition-colors"
                >
                  Create API Key on platform.mint.gg <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-stone-300">3D Model Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            required
            placeholder="Describe the 3D model to generate..."
            className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-stone-400">Asset Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ancient Chest"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-stone-400">Generation Preset</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as any)}
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="fast">Fast (Lower Cost / Rapid Iteration)</option>
              <option value="standard">Standard (Balanced Default)</option>
              <option value="production">Production (Highest Quality)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-stone-400">Rigging Pose (Optional)</label>
            <select
              value={riggingPose}
              onChange={(e) => setRiggingPose(e.target.value as any)}
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">None (Default)</option>
              <option value="t_pose">T-Pose (Humanoid)</option>
              <option value="a_pose">A-Pose (Humanoid)</option>
            </select>
          </div>
        </div>

        <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-2">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowPaidTest}
              onChange={(e) => setAllowPaidTest(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded bg-stone-900 border-stone-700 focus:ring-emerald-500"
            />
            <span className="text-xs text-stone-300 font-medium">
              Explicit Permission: I authorize running a paid 3D Model generation test using Mint Credits.
            </span>
          </label>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/50 border border-rose-800/70 rounded-lg text-rose-200 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || configured === false || !allowPaidTest}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-800 disabled:text-stone-500 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating & Polling Mint API...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Start Server-Side 3D Model Generation</span>
            </>
          )}
        </button>
      </form>

      {statusMessage && (
        <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-400 flex items-center space-x-2">
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
          <span>{statusMessage}</span>
        </div>
      )}

      {operation && (
        <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="font-semibold text-stone-300">Operation Lifecycle</span>
            <span className="px-2 py-0.5 bg-stone-800 text-stone-300 rounded font-mono text-[11px]">
              ID: {operation.id}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-stone-400">
            <div>Status: <span className="font-medium text-stone-200">{operation.status}</span></div>
            <div>Preset: <span className="font-medium text-stone-200">{operation.generationPreset || 'standard'}</span></div>
            {operation.resource && (
              <div className="col-span-2">
                Resource: <span className="font-mono text-emerald-400">{operation.resource.type} / {operation.resource.id}</span>
              </div>
            )}
          </div>

          {operation.billing && (
            <div className="p-3 bg-amber-950/50 border border-amber-800/80 rounded-lg space-y-2 text-amber-200">
              <p className="font-semibold text-amber-300">Billing Action Required</p>
              <p>Reason: {operation.billing.reason}</p>
              <p>Required Credits: {operation.billing.requiredCredits}</p>
              {operation.billing.actionUrl && (
                <a
                  href={operation.billing.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-emerald-400 hover:underline"
                >
                  Resolve Billing on Mint Platform <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {asset && (
        <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl space-y-2 text-xs">
          <div className="font-semibold text-stone-300 flex items-center space-x-1.5">
            <Box className="w-4 h-4 text-emerald-400" />
            <span>Retrieved Asset ({asset.id})</span>
          </div>
          <p className="text-stone-400">Title: <span className="text-stone-200">{asset.name || 'Untitled'}</span></p>
        </div>
      )}

      {manifest && (
        <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="font-semibold text-stone-300 flex items-center space-x-1.5">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>File Artifact Manifest</span>
            </span>
          </div>

          {manifest.artifacts && manifest.artifacts.length > 0 ? (
            <div className="space-y-2">
              {manifest.artifacts.map((file, idx) => {
                const url = file.downloadUrl || file.url;
                return (
                  <div key={idx} className="p-2.5 bg-stone-900 border border-stone-800 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-stone-200">{file.filename || file.name || `Artifact #${idx + 1}`}</p>
                      <p className="text-[11px] text-stone-500">
                        {file.contentType || file.mimeType || 'file'} {file.sizeBytes ? `• ${(file.sizeBytes / 1024 / 1024).toFixed(2)} MB` : ''}
                      </p>
                    </div>
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded hover:bg-emerald-900 transition-colors"
                      >
                        Download <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-stone-500 italic">No artifacts listed in manifest.</p>
          )}
        </div>
      )}
    </div>
  );
}
