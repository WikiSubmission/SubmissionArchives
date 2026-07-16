import { Mistral } from '@mistralai/mistralai';
import { requireEnv } from './env';

let client: Mistral | null = null;

function getClient(): Mistral {
  if (!client) {
    client = new Mistral({ apiKey: requireEnv('MISTRAL_API_KEY') });
  }
  return client;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function embedBatch(texts: string[], model: string, maxRetries = 5): Promise<number[][]> {
  let attempt = 0;
  for (;;) {
    try {
      const response = await getClient().embeddings.create({ model, inputs: texts });
      return response.data.map((item) => item.embedding as number[]);
    } catch (error) {
      attempt += 1;
      if (attempt > maxRetries) throw error;
      const backoffMs = 1000 * 2 ** (attempt - 1);
      await sleep(backoffMs);
    }
  }
}
