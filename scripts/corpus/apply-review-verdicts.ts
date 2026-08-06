import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Applies enrichment review verdicts produced by the review agents.
 * - "edit" verdicts replace the section summary with the reviewed version.
 * - "draft" verdicts pin the section's review_status to draft.
 * - Files whose sections were all reviewed (or belong to the mechanically
 *   verified quran-editions category) get file-level review_status approved;
 *   sections keep draft only when pinned.
 * Writes an exceptions report listing every non-approve verdict.
 */

const VERDICT_DIR = path.resolve(process.cwd(), 'reports', 'enrichment-review', 'verdicts');
const EXCEPTIONS_PATH = path.resolve(
  process.cwd(),
  'reports',
  'enrichment-review',
  'review-exceptions.json',
);
const ENRICHMENT_ROOT = path.resolve(process.cwd(), 'data', 'rag', 'enrichment');

interface Verdict {
  id: string;
  verdict: 'approve' | 'edit' | 'draft';
  reason?: string;
  edited_summary?: string;
}

interface FileVerdicts {
  file: string;
  sections: Verdict[];
}

interface EnrichmentSection extends Record<string, unknown> {
  id?: string;
  summary?: string;
  review_status?: string;
}

interface EnrichmentDoc extends Record<string, unknown> {
  review_status?: string;
  sections?: EnrichmentSection[];
}

function loadVerdicts(): Map<string, Map<string, Verdict>> {
  const byFile = new Map<string, Map<string, Verdict>>();
  for (const entry of readdirSync(VERDICT_DIR)) {
    if (!entry.endsWith('.json')) continue;
    const batches = JSON.parse(
      readFileSync(path.join(VERDICT_DIR, entry), 'utf8'),
    ) as FileVerdicts[];
    for (const batch of batches) {
      const normalized = batch.file.replace(/\\/g, '/');
      const sections = byFile.get(normalized) ?? new Map<string, Verdict>();
      for (const verdict of batch.sections ?? []) {
        if (verdict.id && verdict.verdict) sections.set(verdict.id, verdict);
      }
      byFile.set(normalized, sections);
    }
  }
  return byFile;
}

function listEnrichmentFiles(): string[] {
  const output: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'manifest.json') {
        output.push(full);
      }
    }
  };
  walk(ENRICHMENT_ROOT);
  return output;
}

function main(): void {
  const verdictsByFile = loadVerdicts();
  const exceptions: Array<{ file: string; sectionId: string; verdict: string; reason: string }> = [];
  let editsApplied = 0;
  let draftsPinned = 0;
  let filesApproved = 0;
  let sectionsCovered = 0;
  const unreviewedFiles: string[] = [];

  for (const filePath of listEnrichmentFiles()) {
    const relative = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    const isQuranEditions = relative.includes('/quran-editions/');
    const verdicts = verdictsByFile.get(relative);

    if (!verdicts && !isQuranEditions) {
      unreviewedFiles.push(relative);
      continue;
    }

    const doc = JSON.parse(readFileSync(filePath, 'utf8')) as EnrichmentDoc;
    const sections = Array.isArray(doc.sections) ? doc.sections : [];
    const updatedSections = sections.map((section) => {
      const verdict = section.id ? verdicts?.get(section.id) : undefined;
      if (!verdict) return section;
      sectionsCovered += 1;

      if (verdict.verdict === 'edit' && verdict.edited_summary) {
        editsApplied += 1;
        exceptions.push({
          file: relative,
          sectionId: String(section.id),
          verdict: 'edit',
          reason: verdict.reason ?? '',
        });
        return {
          ...section,
          summary: verdict.edited_summary,
          ...(section.review_status ? { review_status: 'approved' } : {}),
        };
      }
      if (verdict.verdict === 'draft') {
        draftsPinned += 1;
        exceptions.push({
          file: relative,
          sectionId: String(section.id),
          verdict: 'draft',
          reason: verdict.reason ?? '',
        });
        return { ...section, review_status: 'draft' };
      }
      // Approve verdicts promote an explicit per-section draft status so the
      // file-level approval is not overridden.
      return section.review_status && section.review_status !== 'approved'
        ? { ...section, review_status: 'approved' }
        : section;
    });

    const updated: EnrichmentDoc = {
      ...doc,
      review_status: 'approved',
      sections: updatedSections,
    };
    writeFileSync(filePath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
    filesApproved += 1;
  }

  writeFileSync(
    EXCEPTIONS_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        filesApproved,
        sectionsCovered,
        editsApplied,
        draftsPinned,
        unreviewedFiles,
        exceptions,
      },
      null,
      2,
    ),
  );

  console.log('Review verdicts applied');
  console.log(`  Files approved: ${filesApproved}`);
  console.log(`  Sections with explicit verdicts: ${sectionsCovered}`);
  console.log(`  Summary edits applied: ${editsApplied}`);
  console.log(`  Sections pinned draft: ${draftsPinned}`);
  console.log(`  Unreviewed files (left untouched): ${unreviewedFiles.length}`);
  for (const file of unreviewedFiles) console.log(`    - ${file}`);
  console.log(`  Exceptions report: ${path.relative(process.cwd(), EXCEPTIONS_PATH)}`);
}

main();
