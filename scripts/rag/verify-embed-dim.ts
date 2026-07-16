import { Mistral } from '@mistralai/mistralai';
import { requireEnv } from './lib/env';

async function main(): Promise<void> {
  const apiKey = requireEnv('MISTRAL_API_KEY');
  const model = process.env.MISTRAL_EMBED_MODEL || 'mistral-embed-2312';
  const client = new Mistral({ apiKey });

  const response = await client.embeddings.create({
    model,
    inputs: ['Where does Rashad mention the age of responsibility?'],
  });

  const embedding = response.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error('No embedding returned from Mistral API');
  }

  console.log(`Model: ${model}`);
  console.log(`Embedding dimension: ${embedding.length}`);
}

main().catch((error: unknown) => {
  console.error('verify-embed-dim failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
