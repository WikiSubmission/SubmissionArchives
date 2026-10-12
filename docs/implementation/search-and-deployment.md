# Search and deployment
- Ordinary search/quoted phrases ignore Latin accents, Arabic vowel marks and Hebrew cantillation. Arabic base letters are preserved. `literal:TEXT` matches case-sensitive original text including marks; postings narrow candidates with the same tolerant normalizer.
- Set `TRUSTED_CLIENT_IP_HEADER=x-forwarded-for` (or `x-real-ip`, `cf-connecting-ip`) only if your Coolify/hosting ingress strips/overwrites incoming client headers. Otherwise requests share an unknown-IP bucket. Process-local rate limits do not share counters across replicas.
- Generate visual baselines explicitly on the target platform and review changes in a PR. Normal CI never updates/commits them; missing baselines fail.
- Studio before:/after: filter file modification dates strictly before/after the given UTC calendar day. Files without modification metadata are excluded.

- Collections use version 1 localStorage JSON (`sa:research-collections:v1`), with limits of 30 collections, 500 references per collection, 600-character excerpts and 2 MB imports. Export backups before clearing browser storage; imports validate and merge without overwriting stored collection IDs.
- Optional catalog provenance fields are schema-validated and passed through generation; missing verification/transcription/date facts remain unknown. Adding provenance does not certify a record.
- Studio draft synchronization is transient per-path state: panes receive the latest unsaved markdown/frontmatter before the 500 ms save; disk writes are serialized, and close waits for writes or reports a failure.
