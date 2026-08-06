if (typeof window !== 'undefined') {
  throw new Error('Mint API client can only be used on the server.');
}

export interface MintConfig {
  apiKey: string;
  baseUrl: string;
}

export interface ModelGenerationRequest {
  prompt: string;
  name?: string;
  generationMode?: 'auto' | 'review';
  generationPreset?: 'fast' | 'standard' | 'production';
  imageUrl?: string;
  sourceImages?: string[];
  riggingPose?: 't_pose' | 'a_pose';
}

export interface OperationResource {
  type: string;
  id: string;
}

export interface OperationBilling {
  reason: string;
  resource: string;
  stage: string;
  requiredCredits: number;
  availableCredits?: number;
  committedCredits?: number;
  stageCredits?: number;
  completionCredits?: number;
  ctaKind?: string;
  actionUrl: string;
}

export interface OperationError {
  code: string;
  message: string;
}

export interface MintOperation {
  object: 'operation';
  id: string;
  type: string;
  generationMode: 'auto' | 'review';
  status:
    | 'queued'
    | 'running'
    | 'preview_ready'
    | 'billing_required'
    | 'succeeded'
    | 'partially_succeeded'
    | 'failed'
    | 'canceled';
  prompt?: string;
  generationPreset?: 'fast' | 'standard' | 'production';
  resource?: OperationResource | null;
  billing?: OperationBilling;
  error?: OperationError;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  canceledAt?: string;
}

export interface ArtifactFile {
  id?: string;
  name?: string;
  filename?: string;
  contentType?: string;
  mimeType?: string;
  sizeBytes?: number;
  downloadUrl?: string;
  url?: string;
  type?: string;
  [key: string]: unknown;
}

export interface ArtifactManifest {
  object?: string;
  assetId?: string;
  assetType?: string;
  artifacts?: ArtifactFile[];
  runtime?: {
    runtimeUrl?: string;
    collider?: {
      runtimeUrl?: string;
    };
  };
  [key: string]: unknown;
}

export interface LibraryAsset {
  id: string;
  type?: string;
  name?: string;
  prompt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export class MintApiError extends Error {
  status: number;
  requestId?: string | null;
  retryAfter?: string | null;
  problem?: unknown;
  validationErrors?: Array<{ code?: string; message?: string; path?: string }>;

  constructor(
    message: string,
    status: number,
    options?: {
      requestId?: string | null;
      retryAfter?: string | null;
      problem?: unknown;
      validationErrors?: Array<{ code?: string; message?: string; path?: string }>;
    },
  ) {
    super(message);
    this.name = 'MintApiError';
    this.status = status;
    this.requestId = options?.requestId;
    this.retryAfter = options?.retryAfter;
    this.problem = options?.problem;
    this.validationErrors = options?.validationErrors ?? [];
  }
}

export const MISSING_KEY_MESSAGE =
  'MINT_API_KEY is missing from the server environment. Please create an API key at https://platform.mint.gg and set MINT_API_KEY in your server environment.';

const DEFAULT_BASE_URL = 'https://api.mint.gg/v1';

export function getMintConfig(): MintConfig {
  const apiKey = process.env.MINT_API_KEY?.trim();
  if (!apiKey) {
    throw new MintApiError(MISSING_KEY_MESSAGE, 401);
  }

  const rawBaseUrl = (process.env.MINT_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  return { apiKey, baseUrl: rawBaseUrl };
}

export async function mintApiRequest<T>(
  pathname: string,
  options: {
    method?: string;
    body?: unknown;
    idempotencyKey?: string;
    fetchImpl?: typeof fetch;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const config = getMintConfig();
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const url = `${config.baseUrl}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${config.apiKey}`,
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  const response = await fetchImpl(url, {
    method: options.method || 'GET',
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });

  const text = await response.text();
  let body: any = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { detail: text.slice(0, 500) };
    }
  }

  const requestId = response.headers.get('x-request-id');
  const retryAfter = response.headers.get('retry-after');

  if (!response.ok) {
    const detail = body?.detail || body?.title || body?.message || response.statusText;
    const errorMsg = `Mint API ${response.status}: ${detail}`;
    throw new MintApiError(errorMsg, response.status, {
      requestId,
      retryAfter,
      problem: body,
      validationErrors: Array.isArray(body?.errors) ? body.errors : [],
    });
  }

  return body as T;
}

export async function startModelGeneration(
  request: ModelGenerationRequest,
  options?: { idempotencyKey?: string; fetchImpl?: typeof fetch },
): Promise<MintOperation> {
  if (!request.prompt || typeof request.prompt !== 'string' || !request.prompt.trim()) {
    throw new MintApiError('Prompt is required for 3D Model generation.', 400);
  }

  const body: ModelGenerationRequest = {
    prompt: request.prompt.trim(),
    ...(request.name ? { name: request.name.trim() } : {}),
    ...(request.generationPreset ? { generationPreset: request.generationPreset } : {}),
    ...(request.imageUrl ? { imageUrl: request.imageUrl } : {}),
    ...(request.sourceImages && request.sourceImages.length >= 2
      ? { sourceImages: request.sourceImages }
      : {}),
    ...(request.riggingPose ? { riggingPose: request.riggingPose } : {}),
    ...(request.generationMode ? { generationMode: request.generationMode } : {}),
  };

  return await mintApiRequest<MintOperation>('/models:generate', {
    method: 'POST',
    body,
    idempotencyKey: options?.idempotencyKey,
    fetchImpl: options?.fetchImpl,
  });
}

export async function getOperation(
  operationId: string,
  options?: { fetchImpl?: typeof fetch },
): Promise<MintOperation> {
  if (!operationId || typeof operationId !== 'string') {
    throw new MintApiError('A valid operationId is required.', 400);
  }
  return await mintApiRequest<MintOperation>(`/operations/${encodeURIComponent(operationId)}`, {
    method: 'GET',
    fetchImpl: options?.fetchImpl,
  });
}

export interface PollOptions {
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  sleepImpl?: (ms: number) => Promise<void>;
}

export async function pollOperation(
  operationId: string,
  options: PollOptions = {},
): Promise<MintOperation> {
  const initialDelayMs = options.initialDelayMs ?? 2000;
  const maxDelayMs = options.maxDelayMs ?? 15000;
  const backoffFactor = options.backoffFactor ?? 1.6;
  const timeoutMs = options.timeoutMs ?? 30 * 60 * 1000;
  const sleep =
    options.sleepImpl ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  const startedAt = Date.now();
  let delayMs = initialDelayMs;

  const terminalStatuses = new Set([
    'succeeded',
    'partially_succeeded',
    'failed',
    'canceled',
    'billing_required',
    'preview_ready',
  ]);

  while (true) {
    const operation = await getOperation(operationId, { fetchImpl: options.fetchImpl });

    if (terminalStatuses.has(operation.status)) {
      return operation;
    }

    if (Date.now() - startedAt >= timeoutMs) {
      throw new MintApiError(`Timed out waiting for operation ${operationId}.`, 408);
    }

    await sleep(delayMs);
    delayMs = Math.min(maxDelayMs, Math.ceil(delayMs * backoffFactor));
  }
}

export async function getAsset(
  resourceType: string,
  resourceId: string,
  options?: { fetchImpl?: typeof fetch },
): Promise<LibraryAsset> {
  try {
    return await mintApiRequest<LibraryAsset>(
      `/assets/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}`,
      {
        method: 'GET',
        fetchImpl: options?.fetchImpl,
      },
    );
  } catch {
    return await mintApiRequest<LibraryAsset>(
      `/assets/${encodeURIComponent(resourceId)}`,
      {
        method: 'GET',
        fetchImpl: options?.fetchImpl,
      },
    );
  }
}

export async function getAssetArtifactManifest(
  resourceType: string,
  resourceId: string,
  options?: { fetchImpl?: typeof fetch },
): Promise<ArtifactManifest> {
  return await mintApiRequest<ArtifactManifest>(
    `/assets/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}/artifact-manifest`,
    {
      method: 'GET',
      fetchImpl: options?.fetchImpl,
    },
  );
}

export interface Generate3DModelResult {
  operation: MintOperation;
  asset?: LibraryAsset | null;
  manifest?: ArtifactManifest | null;
  billingRequired?: boolean;
}

export async function generateAndRetrieve3DModel(
  request: ModelGenerationRequest,
  options?: {
    idempotencyKey?: string;
    pollOptions?: PollOptions;
    fetchImpl?: typeof fetch;
  },
): Promise<Generate3DModelResult> {
  const initialOp = await startModelGeneration(request, {
    idempotencyKey: options?.idempotencyKey,
    fetchImpl: options?.fetchImpl,
  });

  const finalOp = await pollOperation(initialOp.id, {
    ...options?.pollOptions,
    fetchImpl: options?.fetchImpl,
  });

  if (finalOp.status === 'billing_required') {
    return {
      operation: finalOp,
      billingRequired: true,
    };
  }

  if (finalOp.status === 'failed' || finalOp.status === 'canceled') {
    const errorMsg =
      finalOp.error?.message || `Model generation operation ${finalOp.id} ${finalOp.status}.`;
    throw new MintApiError(errorMsg, 500, { problem: finalOp });
  }

  if (finalOp.resource?.type && finalOp.resource?.id) {
    const [asset, manifest] = await Promise.all([
      getAsset(finalOp.resource.type, finalOp.resource.id, { fetchImpl: options?.fetchImpl }).catch(
        () => null,
      ),
      getAssetArtifactManifest(finalOp.resource.type, finalOp.resource.id, {
        fetchImpl: options?.fetchImpl,
      }).catch(() => null),
    ]);

    return {
      operation: finalOp,
      asset,
      manifest,
    };
  }

  return { operation: finalOp };
}
