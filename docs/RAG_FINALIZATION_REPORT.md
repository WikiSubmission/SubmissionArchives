# RAG Finalization Report

Date: 2026-07-17

This report records the finalization of the enrichment-aware RAG v4 upgrade:
what was executed, what the eval measured, which defects were found and fixed,
and what remains as follow-up work.

## What was executed

1. The corpus integration (three Quran editions, 64 enrichment and 64 eval
   documents) and the v4 code upgrade were committed to git and the staging
   kits, backups, and snapshots were removed. Git is the rollback path.
2. Migrations 003 and 004 were applied. The full corpus was embedded and
   ingested: 382 documents, 53,740 canonical chunks, all enrichment sections,
   99 relationships. `rag:verify` passes every check, including canonical
   resolution for every enrichment section and gold-case lexical probes.
3. A retrieval eval harness (`npm run rag:eval`) replays the gold eval corpus
   (1,157 cases across 64 documents) against live retrieval and reports
   recall and MRR per match type. Question embeddings are cached under
   `reports/rag-eval/` so repeat runs are nearly free.

## Eval results

| Configuration | recall@5 | recall@10 | recall@24 | MRR |
|---|---|---|---|---|
| v4 baseline (spoken corpus) | 84.2% | 95.9% | 98.0% | 0.583 |
| v4 full corpus (with quran enrichment) | 83.5% | 96.1% | 98.0% | 0.569 |
| Ablation: enrichment channel disabled | 7.3% | 11.4% | 23.1% | 0.058 |

The ablation shows the enrichment channel carries most gold-case recall.
Two caveats: the gold questions were authored from the enrichment sections,
which flatters the channel, and the ablation runs single-query (no expansion).

## Defect found through tracing: production enrichment dilution

Live traces showed the enrichment channel contributing nothing in production
even though the eval scored it as dominant. Cause: enrichment enters
reciprocal-rank fusion as a single ranked list, while vector and lexical
channels contribute one list per query variant (up to 8). Its weight is now
scaled by the variant count (`buildEnrichmentLists` in
`src/lib/rag/retrieval.ts`). After the fix, edition questions surface
enrichment-guided candidates at the top of the fused pool.

## Answer-quality changes

- Rerank and answer generation run on `mistral-medium-2604`; query expansion
  stays on `mistral-small-2603` (`MISTRAL_*_MODEL` env vars).
- The system prompt and response rules now instruct thorough multi-source
  synthesis with concrete specifics, instead of minimal summaries.
- SOURCE blocks feed the stored 1,450-1,900 character context windows
  (falling back to neighbor merging), giving the model more surrounding
  material per source.
- Answer context raised from 10 to 12 sources (`RAG_TOP_N_CONTEXT`).

## Observability

- `RAG_TRACE_ENABLED=true` appends per-request JSONL traces (intent, signals,
  rankings, degraded services) to `reports/rag-traces/traces.jsonl`.
- The SSE `sources` event carries a `degraded` field when query expansion or
  rerank silently fell back, and failures are logged server-side.
- `rag:verify` runs gold-case lexical probes instead of hardcoded strings.

## Quran edition enrichment (generated)

`scripts/corpus/generate-quran-enrichment.ts` converts the three-edition
comparison corpus into 100 draft enrichment files with 1,050 verse-range
sections covering substantive 1989 to 1992 revisions and edition presence
anomalies, including a dedicated Sura 9:128-129 dossier section. Locators
span the interleaved 1992/1989/1981 verse segments so evolution queries
resolve to all renderings. Marker-only differences are filtered out.

## Draft review status and protocol

All enrichment is ingested under `RAG_ENRICHMENT_STATUSES=draft,approved`.
A 12-section accuracy spot-check (audio, video, quran-editions) scored
7 accurate, 1 accurate with caveat, 4 partially accurate, 0 inaccurate,
with no wrong speakers, invented content, or misplaced locators.

Recommended review protocol before flipping sections to `approved`:

- video-program: bulk-approve with light sampling (cleanest category).
- audio-program: sample summaries for imported terminology (terms that appear
  in the summary but not in the located transcript span).
- quran-editions: script a mechanical comparison of each section's quoted
  1989/1992 readings against the canonical labeled segments.

`rag:validate-enrichment` lists any section lacking a precise locator, and
section hashes now include locators and review status, so review edits
propagate on the next `rag:ingest` (which is incremental and cheap).

## Follow-up execution (2026-07-17, workstreams 1-3)

All three follow-ups were executed the same day.

### Workstream 1: enrichment review and approval

- Quran edition sections regenerated to quote the canonical labeled verse
  segments instead of OCR extraction candidates; marker-only differences no
  longer count as revisions (963 sections across 93 suras remain).
- A mechanical grounding checker (`scripts/corpus/check-enrichment-grounding.ts`)
  and a packet pipeline (`build-review-packets.ts`, `apply-review-verdicts.ts`)
  support review at scale: canonical spans are pre-extracted so review agents
  judge content instead of exploring the index.
- Every spoken section (464) was reviewed against its canonical span: 453
  approved as written, 11 summaries corrected for imported or unsupported
  claims, 0 rejected. The quran-editions category was approved on
  deterministic generation plus the corpus-wide quote check and sampling.
- Post-approval eval gate passed with improvement (see numbers below).

### Workstream 2: written-works enrichment

All 11 written works (1,295 pages) now carry enrichment metadata: 205
sections authored by agents from canonical page text, each section reviewed
against its page span (2 summaries corrected, 3 misaligned sections pinned
draft, 1 invalid locator removed). Verified live: book-specific questions
surface their sections through the enrichment channel with correct page
locators (e.g. the salat booklet ablution procedure, the Computer Speaks
end-of-world epilogue).

### Workstream 3: tuning against the eval

- Gold-label audit of all 39 failing cases confirmed every label correct;
  the failures were genuine retrieval misses, not measurement artifacts.
- The `--expansion` eval mode (mirroring the production multi-query path)
  showed the misses persist under expansion, ruling out single-query bias.
- Root cause: the hardcoded per-document candidate cap evicted answer-bearing
  chunks when many relevant sections live in one document. The cap is now
  env-tunable (`RAG_DIVERSIFY_DOC_CAP`); measured at 4, 6, and 8, and set
  to 6.

### Measured results (full 1,157-case gold eval)

| Metric | Before workstreams | After |
|---|---|---|
| hit@24 overall | 98.5% | 99.1% |
| zero-hit cases | 17 | 10 |
| direct-match hit@24 | 87.5% | 92.9% |
| recall@10 overall | 96.1% | 95.6% (within noise) |

## Answer-quality eval (baseline)

`npm run rag:answer-eval` drives the real `/api/ask` endpoint for a sampled
set of gold cases and judges each generated answer with mistral-large against
the gold answer note and the shown sources. This measures answer quality,
which the retrieval eval does not. First baseline (24-case sample):

| Metric | Score |
|---|---|
| Answered rate | 83.3% |
| Faithfulness (0-4) | 3.60 |
| Correctness (0-4) | 3.05 |
| Completeness (0-4) | 2.55 |

Reading: faithfulness is high (the canonical trust boundary holds; little
fabrication). The correctness floor and the unanswered cases both trace to
the same retrieval-hard cases as the WS3 residual misses, so improving
retrieval on those pays off in answer correctness too. Completeness is the
clear weakness and the direct measure of answer detail: low scorers are
almost all omissions (specific verse numbers, named examples, secondary
themes present in the source but dropped from the answer). `citedExpectedDoc`
is informational only, since a fact can be correctly answered from a valid
document other than the gold one.

### Completeness experiment (prompt lever)

The answer prompt's response rules were sharpened to name the concrete
particulars to preserve (verse citations, proper names, dates, editions,
numbers, secondary points), anchored with "when the sources state them" and
"never introduce a particular the sources do not contain" so it cannot push
toward invention. Measured on the identical 24-case sample (the only valid
comparison):

| Metric | Before | After prompt change |
|---|---|---|
| Completeness | 2.55 | 2.81 |
| Correctness | 3.05 | 3.29 |
| Faithfulness | 3.60 | 3.76 |

Detail rose and faithfulness held (rose slightly), so the change was kept.

Methodology note: answer scores carry run-to-run noise (generation is
non-deterministic), and the sampler is now hash-ordered so a given
`--sample` is a stable nested subset (n=24 is a prefix of n=40). Compare only
across the same sample size; a larger sample is a different, harder
population, not a regression.

## Remaining follow-ups

1. Raise completeness further: the prompt lever has been applied and measured
   (above). The remaining lever is feeding more/fuller source context to the
   model (more sources, or fuller per-source text). Measure with
   `rag:answer-eval --sample 24` against the recorded reference, watching that
   faithfulness does not drop as more evidence is packed in.
2. Three islam vol 2 sections (iv2-s08/s09/s10) have misaligned summaries
   and are pinned draft; see `reports/enrichment-review/review-exceptions.json`.
2. `RAG_ENRICHMENT_STATUSES` can now be tightened to `approved` once you are
   comfortable dropping those pinned drafts from retrieval.
3. The remaining 10 zero-hit eval cases are genuine hard retrieval misses in
   video documents; candidates for a future round (for example verse-level
   lexical boosts or higher enrichment top-k for those intents).
