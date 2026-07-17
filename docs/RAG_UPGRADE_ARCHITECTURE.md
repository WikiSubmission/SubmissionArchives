# Enrichment-aware retrieval architecture

## Evidence path

```text
canonical transcript / written page / Quran verse
                    ↓
                rag_chunks
                    ↓
      hybrid lexical + vector retrieval
                    ↓
          answer prompt and citation
```

## Metadata discovery path

```text
draft or approved enrichment JSON
                    ↓
       rag_enrichment_sections
                    ↓
 metadata lexical + vector retrieval
                    ↓
 locator overlap with a precision chunk
                    ↓
       canonical rag_chunks evidence
                    ↓
          answer prompt and citation
```

The metadata row itself is never placed into an answer evidence block.

## Intent routing

- `final_wording` favors 1992 Quran evidence.
- `translation_evolution` preserves useful 1981, 1989, and 1992 variants.
- `historical_development` favors chronology and dated sources.
- `ritual_procedure` favors dedicated procedural sources such as *The Contact Prayers*.
- `general` uses ordinary hybrid retrieval.

## Duplicate control

Document relationship metadata creates `family_id` groups for duplicate-like, excerpted, parallel, repeated, overlapping, and precursor sources. Normal answers are capped by family. Translation-evolution questions retain edition diversity.

## Trust boundary

The answer model sees:

- canonical source title and provenance
- speaker or author
- date and edition
- evidence kind and locator
- canonical text

It may see the title of the metadata section that located the passage, clearly marked as non-quotable navigation metadata. It never receives an enrichment summary as evidence.
