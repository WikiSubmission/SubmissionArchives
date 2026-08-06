import 'server-only';

import { NextResponse } from 'next/server';
import {
  generateAndRetrieve3DModel,
  getAsset,
  getAssetArtifactManifest,
  getOperation,
  MintApiError,
  MISSING_KEY_MESSAGE,
  pollOperation,
  startModelGeneration,
} from '@/lib/mint/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.MINT_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        configured: false,
        message: MISSING_KEY_MESSAGE,
      },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(
    {
      configured: true,
      service: 'Mint API 3D Model Generation',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.MINT_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error: MISSING_KEY_MESSAGE,
        configured: false,
      },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'generate';

    if (action === 'start') {
      if (!body.prompt || typeof body.prompt !== 'string') {
        return NextResponse.json(
          { error: 'Prompt is required for 3D model generation.' },
          { status: 400, headers: { 'Cache-Control': 'no-store' } },
        );
      }
      const operation = await startModelGeneration({
        prompt: body.prompt,
        name: body.name,
        generationPreset: body.generationPreset,
        riggingPose: body.riggingPose,
        imageUrl: body.imageUrl,
        sourceImages: body.sourceImages,
      });
      return NextResponse.json({ success: true, operation }, { headers: { 'Cache-Control': 'no-store' } });
    }

    if (action === 'poll') {
      if (!body.operationId || typeof body.operationId !== 'string') {
        return NextResponse.json(
          { error: 'operationId is required for polling.' },
          { status: 400, headers: { 'Cache-Control': 'no-store' } },
        );
      }
      const operation = await pollOperation(body.operationId, {
        initialDelayMs: 1000,
        maxDelayMs: 5000,
        timeoutMs: 5 * 60 * 1000,
      });

      let asset = null;
      let manifest = null;

      if (
        (operation.status === 'succeeded' || operation.status === 'partially_succeeded') &&
        operation.resource?.type &&
        operation.resource?.id
      ) {
        [asset, manifest] = await Promise.all([
          getAsset(operation.resource.type, operation.resource.id).catch(() => null),
          getAssetArtifactManifest(operation.resource.type, operation.resource.id).catch(() => null),
        ]);
      }

      return NextResponse.json(
        {
          success: true,
          operation,
          asset,
          manifest,
          billingRequired: operation.status === 'billing_required',
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    if (!body.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required for 3D model generation.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const result = await generateAndRetrieve3DModel({
      prompt: body.prompt,
      name: body.name,
      generationPreset: body.generationPreset,
      riggingPose: body.riggingPose,
      imageUrl: body.imageUrl,
      sourceImages: body.sourceImages,
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error: any) {
    if (error instanceof MintApiError) {
      return NextResponse.json(
        {
          error: error.message,
          status: error.status,
          requestId: error.requestId,
          retryAfter: error.retryAfter,
          problem: error.problem,
          validationErrors: error.validationErrors,
        },
        { status: error.status || 500, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred during 3D model generation.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
