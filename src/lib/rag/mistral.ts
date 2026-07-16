import 'server-only';
import { Mistral } from '@mistralai/mistralai';

let client: Mistral | null = null;

function getClient(): Mistral {
  if (!client) {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY is not configured');
    }
    client = new Mistral({ apiKey });
  }
  return client;
}

export async function embedQuery(text: string): Promise<number[]> {
  const model = process.env.MISTRAL_EMBED_MODEL || 'mistral-embed-2312';
  const response = await getClient().embeddings.create({ model, inputs: [text] });
  const embedding = response.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error('No embedding returned from Mistral API');
  }
  return embedding as number[];
}

export async function streamChatCompletion(systemPrompt: string, userPrompt: string) {
  const model = process.env.MISTRAL_CHAT_MODEL || 'mistral-small-2603';
  return getClient().chat.stream({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });
}

export function extractDeltaText(content: string | Array<{ type?: string; text?: string }> | null | undefined): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  return content.map((chunk) => chunk.text || '').join('');
}
