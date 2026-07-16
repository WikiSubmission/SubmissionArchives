// Matches both single citations like [S1] and combined ones like [S1, S2, S3].
const CITATION_BRACKET_PATTERN = /\[\s*S\d+(?:\s*,\s*S\d+)*\s*\]/g;
const CITATION_ID_PATTERN = /S\d+/g;

export function extractCitedIds(answerText: string): string[] {
  const ids = new Set<string>();
  for (const bracket of answerText.match(CITATION_BRACKET_PATTERN) ?? []) {
    for (const id of bracket.match(CITATION_ID_PATTERN) ?? []) {
      ids.add(id);
    }
  }
  return [...ids];
}

export function validateCitations(
  citedIds: string[],
  supplied: ReadonlySet<string>,
): { valid: boolean; invalidIds: string[] } {
  const invalidIds = citedIds.filter((id) => !supplied.has(id));
  return { valid: invalidIds.length === 0, invalidIds };
}
