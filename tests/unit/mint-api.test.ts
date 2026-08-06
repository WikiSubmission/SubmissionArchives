import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generateAndRetrieve3DModel,
  getMintConfig,
  MintApiError,
  MISSING_KEY_MESSAGE,
  pollOperation,
  startModelGeneration,
} from '../../src/lib/mint/client';

test('Mint API - throws missing key error when MINT_API_KEY is not in environment', () => {
  const originalKey = process.env.MINT_API_KEY;
  delete process.env.MINT_API_KEY;

  try {
    assert.throws(
      () => getMintConfig(),
      (err: any) => {
        return err instanceof MintApiError && err.status === 401 && err.message === MISSING_KEY_MESSAGE;
      },
    );
  } finally {
    if (originalKey !== undefined) {
      process.env.MINT_API_KEY = originalKey;
    }
  }
});

test('Mint API - reads MINT_API_KEY from environment', () => {
  const originalKey = process.env.MINT_API_KEY;
  process.env.MINT_API_KEY = 'test_key_12345';

  try {
    const config = getMintConfig();
    assert.equal(config.apiKey, 'test_key_12345');
    assert.equal(config.baseUrl, 'https://api.mint.gg/v1');
  } finally {
    if (originalKey !== undefined) {
      process.env.MINT_API_KEY = originalKey;
    } else {
      delete process.env.MINT_API_KEY;
    }
  }
});

test('Mint API - startModelGeneration sends correct request payload and Authorization header', async () => {
  const originalKey = process.env.MINT_API_KEY;
  process.env.MINT_API_KEY = 'test_key_mock';

  let capturedUrl = '';
  let capturedOptions: any = null;

  const mockFetch: typeof fetch = async (url, opts) => {
    capturedUrl = String(url);
    capturedOptions = opts;
    return new Response(
      JSON.stringify({
        object: 'operation',
        id: 'op_test_001',
        type: 'model_generation',
        generationMode: 'auto',
        status: 'queued',
        createdAt: '2026-07-28T00:00:00Z',
        updatedAt: '2026-07-28T00:00:00Z',
      }),
      { status: 202, headers: { 'Content-Type': 'application/json' } },
    );
  };

  try {
    const op = await startModelGeneration(
      {
        prompt: 'A stylized 3D compass',
        name: 'Ancient Compass',
        generationPreset: 'standard',
      },
      { fetchImpl: mockFetch },
    );

    assert.equal(op.id, 'op_test_001');
    assert.equal(capturedUrl, 'https://api.mint.gg/v1/models:generate');
    assert.equal(capturedOptions.method, 'POST');
    assert.equal(capturedOptions.headers.Authorization, 'Bearer test_key_mock');

    const body = JSON.parse(capturedOptions.body);
    assert.equal(body.prompt, 'A stylized 3D compass');
    assert.equal(body.name, 'Ancient Compass');
    assert.equal(body.generationPreset, 'standard');
    assert.equal(body.generationMode, undefined); // auto is default omitted
  } finally {
    if (originalKey !== undefined) {
      process.env.MINT_API_KEY = originalKey;
    } else {
      delete process.env.MINT_API_KEY;
    }
  }
});

test('Mint API - pollOperation handles bounded exponential backoff until terminal status', async () => {
  const originalKey = process.env.MINT_API_KEY;
  process.env.MINT_API_KEY = 'test_key_mock';

  let pollCount = 0;
  const mockFetch: typeof fetch = async (url) => {
    pollCount++;
    const status = pollCount < 3 ? 'running' : 'succeeded';
    return new Response(
      JSON.stringify({
        object: 'operation',
        id: 'op_test_poll',
        type: 'model_generation',
        generationMode: 'auto',
        status,
        resource: { type: 'model', id: 'model_123' },
        createdAt: '2026-07-28T00:00:00Z',
        updatedAt: '2026-07-28T00:00:00Z',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  const sleepCalls: number[] = [];
  const mockSleep = async (ms: number) => {
    sleepCalls.push(ms);
  };

  try {
    const finalOp = await pollOperation('op_test_poll', {
      initialDelayMs: 100,
      maxDelayMs: 500,
      backoffFactor: 2.0,
      fetchImpl: mockFetch,
      sleepImpl: mockSleep,
    });

    assert.equal(pollCount, 3);
    assert.equal(finalOp.status, 'succeeded');
    assert.deepEqual(sleepCalls, [100, 200]);
  } finally {
    if (originalKey !== undefined) {
      process.env.MINT_API_KEY = originalKey;
    } else {
      delete process.env.MINT_API_KEY;
    }
  }
});

test('Mint API - full flow retrieves asset and artifact manifest using operation.resource.type and operation.resource.id', async () => {
  const originalKey = process.env.MINT_API_KEY;
  process.env.MINT_API_KEY = 'test_key_mock';

  const requestedUrls: string[] = [];

  const mockFetch: typeof fetch = async (url) => {
    const urlStr = String(url);
    requestedUrls.push(urlStr);

    if (urlStr.endsWith('/models:generate')) {
      return new Response(
        JSON.stringify({
          object: 'operation',
          id: 'op_full_flow',
          type: 'model_generation',
          generationMode: 'auto',
          status: 'queued',
          createdAt: '2026-07-28T00:00:00Z',
          updatedAt: '2026-07-28T00:00:00Z',
        }),
        { status: 202 },
      );
    }

    if (urlStr.endsWith('/operations/op_full_flow')) {
      return new Response(
        JSON.stringify({
          object: 'operation',
          id: 'op_full_flow',
          type: 'model_generation',
          generationMode: 'auto',
          status: 'succeeded',
          resource: { type: 'model', id: 'model_999' },
          createdAt: '2026-07-28T00:00:00Z',
          updatedAt: '2026-07-28T00:00:00Z',
        }),
        { status: 200 },
      );
    }

    if (urlStr.includes('/assets/model/model_999/artifact-manifest')) {
      return new Response(
        JSON.stringify({
          object: 'artifact_manifest',
          assetId: 'model_999',
          assetType: 'model',
          artifacts: [
            {
              filename: 'model.glb',
              downloadUrl: 'https://mintcdn.com/assets/model.glb',
              sizeBytes: 1024567,
            },
          ],
        }),
        { status: 200 },
      );
    }

    if (urlStr.includes('/assets/model/model_999')) {
      return new Response(
        JSON.stringify({
          id: 'model_999',
          type: 'model',
          name: 'Test Model',
        }),
        { status: 200 },
      );
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  };

  try {
    const result = await generateAndRetrieve3DModel(
      { prompt: 'A medieval sword' },
      {
        fetchImpl: mockFetch,
        pollOptions: { initialDelayMs: 10, sleepImpl: async () => {} },
      },
    );

    assert.equal(result.operation.id, 'op_full_flow');
    assert.equal(result.operation.status, 'succeeded');
    assert.equal(result.asset?.id, 'model_999');
    assert.equal(result.manifest?.artifacts?.[0]?.filename, 'model.glb');
    assert.ok(requestedUrls.some((u) => u.includes('/assets/model/model_999')));
    assert.ok(requestedUrls.some((u) => u.includes('/assets/model/model_999/artifact-manifest')));
  } finally {
    if (originalKey !== undefined) {
      process.env.MINT_API_KEY = originalKey;
    } else {
      delete process.env.MINT_API_KEY;
    }
  }
});

test('Mint API - handles billing_required terminal status correctly', async () => {
  const originalKey = process.env.MINT_API_KEY;
  process.env.MINT_API_KEY = 'test_key_mock';

  const mockFetch: typeof fetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.endsWith('/models:generate')) {
      return new Response(
        JSON.stringify({
          object: 'operation',
          id: 'op_billing',
          type: 'model_generation',
          generationMode: 'auto',
          status: 'queued',
          createdAt: '2026-07-28T00:00:00Z',
          updatedAt: '2026-07-28T00:00:00Z',
        }),
        { status: 202 },
      );
    }

    return new Response(
      JSON.stringify({
        object: 'operation',
        id: 'op_billing',
        type: 'model_generation',
        generationMode: 'auto',
        status: 'billing_required',
        billing: {
          reason: 'insufficient_credits',
          resource: 'model',
          stage: 'final',
          requiredCredits: 50,
          actionUrl: 'https://platform.mint.gg/billing',
        },
        createdAt: '2026-07-28T00:00:00Z',
        updatedAt: '2026-07-28T00:00:00Z',
      }),
      { status: 200 },
    );
  };

  try {
    const result = await generateAndRetrieve3DModel(
      { prompt: 'A medieval sword' },
      {
        fetchImpl: mockFetch,
        pollOptions: { initialDelayMs: 10, sleepImpl: async () => {} },
      },
    );

    assert.equal(result.billingRequired, true);
    assert.equal(result.operation.status, 'billing_required');
    assert.equal(result.operation.billing?.requiredCredits, 50);
    assert.equal(result.operation.billing?.actionUrl, 'https://platform.mint.gg/billing');
  } finally {
    if (originalKey !== undefined) {
      process.env.MINT_API_KEY = originalKey;
    } else {
      delete process.env.MINT_API_KEY;
    }
  }
});
