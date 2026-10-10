# Corrected transcript working copy

The original transcript files are unchanged. Corrected working copies are organized in `audio-transcripts`, `video-transcripts`, and `standalone-json`. The CSV columns, record order, links, and timestamps were preserved.

## Applied changes

- Standardized `Sura`/`sura` to `Surah` and `Salah`/`salah` to `Salat` in transcript text and textual metadata, preserving capitalization.
- Standardized explicit `Dr. Khalifa:` speaker tags and structured speaker values to `Dr. Rashad Khalifa`.
- Corrected five structured speaker fields to follow the explicit inline label.
- Corrected the two malformed `Dr. Khalifa` label punctuation cases and the missing space after `A woman:`.
- Corrected `Astroid` to `Asteroid` and `Surgons` to `Surgeons` in two corrected filenames and their title metadata.
- Copied the three distinct standalone JSON transcript records; the second source copy of Messenger Audio #68 is an exact duplicate and is represented once.

### Change counts

- CSV files copied: 126 (74 audio, 52 video).
- CSV rows preserved: 85,361 source and 85,361 corrected.
- `Sura` spellings normalized across textual fields: 78,946 occurrences (including repeated title metadata in cue rows).
- `Salah` spellings normalized: 12 occurrences.
- Inline `Dr. Khalifa:` labels normalized: 8,720 occurrences.
- Structured `Speaker` values normalized from `Dr. Khalifa`: 40,581.
- Direct speaker-field conflicts corrected: 5.
- Unique standalone JSON copies: 3.

See [CHANGE_LOG.csv](CHANGE_LOG.csv) for exact row-level corrections and [transcript-qa-review.md](../transcript-qa-review.md) for the initial audit.

## Pending recording checks

- Messenger Audio #68 is known to sound warped. The cue marked `(unintelligible)` from 00:00:11.360 to 00:20:37.520 is the best-effort rendering of the degraded recording and is intentional; it was retained unchanged.
- The English and Arabic Sunni Scholars debate CSVs still have 204 empty speaker fields combined. Populate only cues whose speaker is unambiguous from the recording or a single inline label.
- Twenty-five audio playlist cues still have blank speaker fields. Quran recitations and Zikr may be intentionally unattributed; confirm before assigning names.
- Three cue starts in the English Sunni Scholars debate are slightly out of row order; verify against the recording before reordering.
- Video numbering skips #38. Find its source or confirm the gap is intentional.
- Audio #50's filename year ends in `198`; confirm the date before changing it.
- Remaining uncertain words, names, and Arabic transliterations need source audio review. No such wording was guessed.

## Validation

All 126 corrected CSVs were readable; headers, row counts, links, and cue timestamps match the source files. No old `Sura`/`Salah` forms remain in the corrected textual fields. Structural validation: passed.
