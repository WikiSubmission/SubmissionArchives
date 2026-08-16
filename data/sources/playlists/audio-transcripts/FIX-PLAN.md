# Quran Study Transcripts (1–52) — Fix Plan

Companion to `NORMALIZATION-NOTES.md` (the audit). This is the action plan:
what changes, in what order, implemented how, with what result. Nothing
here has been run yet.

## Where this actually plugs in (read this first)

`scripts/generate/generate_catalog_search_indices.mjs` → `loadPlaylistSegmentsByYoutubeId()`
reads every CSV in `data/sources/playlists/audio-transcripts/` **directly**:
one segment per row, `{ start, end, text: row.Text.trim(), speaker: row.Speaker.trim() }`,
matched to a catalog entry by YouTube ID pulled from the `Link` column. No VTT
file, no other JSON, no cleaning step of any kind sits between the CSV and
`MASTER_INDEX.json`, which `src/app/media/[...id]/page.tsx` reads at request
time and `Player.tsx` renders.

**Consequence: fixing the 52 CSV files is the entire job.** Once they're
correct, `npm run generate:catalog` regenerates `MASTER_INDEX.json` and the
fix is live — no separate export/conversion step required.

**Also found, and explicitly not using:** `src/lib/transcriptUtils.ts` has a
`parseVttToSegments()` used elsewhere in the codebase that splits a
multi-speaker caption cue by guessing each speaker's share of the time window
proportional to character count. That function isn't in this pipeline at
all (confirmed — it doesn't touch the CSV→MASTER_INDEX path), but it's the
wrong model to imitate given the accuracy requirement here, so calling it
out to make sure it doesn't get copied by habit.

## Schema: what's added, removed, changed

Current columns: `Video Title, Link, Start Time, End Time, Text, Speaker`.

| Column | Action | Why |
|---|---|---|
| `Video Title`, `Link` | **Unchanged** | Confirmed load-bearing: `generate_catalog_search_indices.mjs` reads `Link` on *every row* to resolve the YouTube ID. De-duplicating these into a header/sidecar (your original idea) would silently break every row's video match unless the reader script is rewritten and re-verified in lockstep. Given the size of that blast radius for a purely cosmetic storage win, recommending this stay **out of scope** — flagging it rather than doing it. |
| `Start Time`, `End Time` | **Unchanged format**, values corrected only where rows are split (see Step 3) | Still HH:MM:SS.mmm — this is what the reader parses; changing the format is a reader-side decision, not a data one. |
| `Text` | **Modified in place** (encoding fix, terminology fix, wrap-rejoin, speaker-prefix strip, split content) | |
| `Speaker` | **Modified in place** (canonical full names where confirmed, corrected mis-attributions) | |
| `VerseRefs` | **New column** | Structured `chapter:verse` list, parsed out of Text, Text itself untouched — additive, zero risk to existing values. |
| `VerseLang` | **New column** | `en`, `ar`, or empty — which citation format matched, since English `[x:y]` and Arabic `(x:y)` need different downstream handling. |
| `HasArabic` | **New column** | Boolean, Unicode-range detection. |
| `SplitFromRow` | **New column, sparse** | Only populated on rows produced by Step 3's split. Lets a future editor recognize "this row's timing is inherited from a shared window, not independently measured" instead of assuming every row's timestamp is equally precise. |

Nothing is removed. `Video Title`/`Link` repetition stays, by necessity, not oversight.

---

## The fixes, in dependency order

Each step operates on the previous step's *output*, and each is independently
checkable before moving on — given the accuracy requirement, no step should
be run blind across all 52 files without spot-checking a few first.

### Step 1 — Encoding correction (`ã` → `ā`)

- **Problem:** 50/52 files have `ã` (U+00E3) standing in for `ā` (macron-a) in ~830 Arabic-transliteration terms.
- **Solution:** Global find-replace on the `Text` column only: `ã` → `ā`. No other column touched.
- **Implementation:** A single script, e.g. `scripts/generate/fix_quran_study_encoding.mjs`, modeled on the existing `add_video_transcript_speakers.mjs` (same CSV parse/rewrite shape, same "only column X changes" discipline). Runs across files 01–52, logs a per-file count of replacements made so the total is auditable against the ~830 figure from the audit.
- **Result:** `Al-Fãtehah` → `Al-Fātehah`, `Mã Shã Allãh` → `Mā Shā Allāh`, etc. Zero timestamp or row-count impact — pure text substitution.

### Step 2 — Terminology normalization

- **Problem:** Inconsistent spelling of Al-Fatiha/Sura/Rasulallah-family terms; your decisions are Al-Fatiha, Surah, Quran, Rasulallah.
- **Solution:** After Step 1 (so the corrected macron form is what gets matched), a second pass of targeted, case-aware replacements on `Text` only:
  - `Al-Fātehah` / `Al-Fateha` / `al-Fatiha` → `Al-Fatiha`
  - `Sura` → `Surah` (word-boundary match, so it doesn't touch "Surahs" incorrectly if that form exists, or does if you want plurals normalized too — worth a quick check before running at scale)
  - `Rasulullah` / `rasulullah` / bare `Rasul` where it means the honorific → `Rasulallah` (needs a short allowlist check first — bare "Rasul" also appears as a legitimate standalone word in a few places per the audit, so this one isn't a blind find-replace, it needs the surrounding context checked so we don't over-normalize a word that was correct as-is)
  - `Qur'an` / `Koran` → `Quran`
  - `GOD`/`God` — **no change**, per the "don't normalize" decision.
- **Implementation:** Same script family as Step 1, or a second pass in the same script — logs each replacement with enough surrounding context to spot-check before committing.
- **Result:** Consistent terminology across all 52 files, with the Rasul-family case specifically flagged for manual confirmation of each hit rather than blind substitution.

### Step 3 — Soft-wrap rejoin (safe half of the multi-line problem)

- **Problem:** Many of the 17,091 rows with an embedded `\r\n` are just a sentence broken mid-thought by a stray `\xa0\r\n` — same speaker, no real content change needed.
- **Solution:** For each row containing `\r\n`, split it into lines. If **none** of the resulting lines start with a recognized `KnownSpeaker: ` prefix (checked against the full 86-label list from the audit, not just the 9 canonical ones — the split-detection needs to catch a raw label like `Behrouz:` even though we're not renaming Behrouz), it's a wrap artifact: collapse the whole cell to one line, replacing the internal `\xa0\r\n`/`\r\n` with a single space.
- **Implementation:** Runs after Steps 1–2 so the text being rejoined is already clean. Same row count in, same row count out — this step **never adds or removes rows**, so it carries no timestamp risk at all. Logs how many of the 17,091 flagged rows resolved as simple rejoins vs. got deferred to Step 4.
- **Result:** The large majority of the 37%-of-rows problem resolved with zero structural risk.

### Step 4 — Genuine multi-speaker row splitting (the one that needs care)

- **Problem:** The remainder of those 17,091 rows are real conversation, e.g. Speaker=`Dr. Khalifa`, Text=`"Dr. Khalifa: No.\r\nCatherine: No, absolutely not."` — one CSV row, but two people talking, one timestamp pair.
- **Solution:** For each line inside the cell that starts with `KnownSpeaker: `, emit it as its **own new row**:
  - `Speaker` = that line's actual speaker (corrected).
  - `Text` = that line's content, with the redundant `"Speaker: "` prefix stripped (the app already displays the speaker separately — leaving it in would show the name twice).
  - `Video Title` / `Link` = copied unchanged from the source row.
  - **`Start Time` / `End Time` = copied unchanged from the source row, identically, on *every* split row.** This is the accuracy-critical decision: the source data gives us only one timestamp pair for the whole exchange, and there's no ground truth for exactly when the second speaker started. Rather than inventing a split point — proportional-by-character-count (what the unrelated `transcriptUtils.ts` code does elsewhere) or any other guess — every row born from one split shares the exact same window, in the correct speaking order. That's an honest "these turns happened somewhere in this window, in this order," not a fabricated precise moment.
  - `SplitFromRow` = the original row's line number (or a generated id), so this is traceable later.
- **Implementation:** New script, e.g. `scripts/generate/split_quran_study_multispeaker_rows.mjs`. Splitting is order-preserving (the app's segment sort is stable, and same-timestamp rows keep their emitted order), so downstream display order is correct even with tied timestamps. Runs **after** Steps 1–3, since rejoining wrap artifacts first shrinks the set of rows this step needs to actually split, reducing surface area for the risky part.
- **Verification built in:** log, per file, (a) rows before, (b) rows after, (c) number of splits performed, (d) total file duration (max End Time) — this last one must be **identical before and after**, since splitting never changes the outer time bounds, only fills them in more precisely by speaker. Any file where the max End Time changes is a bug, full stop, and should halt the run.
- **Result:** Every row has exactly one correctly-attributed speaker. Row count increases by the number of genuine splits (audit found up to a few thousand across the corpus, exact count depends on how many of the 17,091 are wraps vs. real exchanges — Step 3's log answers that precisely before Step 4 runs).

### Step 5 — Speaker canonicalization

- **Problem:** 86 raw labels; 9 have confirmed full names; some short labels are ambiguous (bare `Mahmoud`) and must not be blindly mapped.
- **Solution:** Exact-match replacement on the `Speaker` column only, using the confirmed table:
  `Dr. Sabahi`→`Dr. Mahmoud Sabahi`, `Apamea`→`Apamea Bashar`, `Feroz`→`Feroz Karmally`, `Farhad`→`Farhad Mo'ini`, `Ihsan`→`Ihsan Ramadan`, `Linda`→`Linda Baroni`, `Gatut`→`Gatut Adisoma`, `Shakira`→`Shakira Karipineni`, `Parivash`→`Parivash Ettefagh`.
  Explicitly **not** touched: `Ahmad`, `Ahmed`, bare `Mahmoud` (distinct from `Dr. Sabahi` and `Mahmoud Abib`, stays as-is), `Ali`, `Robert`, `Susan`, `David`, `Hamid`, `Behrouz`, `Atif`, `Lori`, `Donna`, `Laurie`, `Naghmeh`, `Zari` — anything not on the confirmed list is left alone rather than guessed.
- **Implementation:** Runs **after** Step 4, since the split step produces new rows whose Speaker values need to already reflect the correct raw label before canonicalization renames them (otherwise a split row tagged `Dr. Sabahi` from an embedded `"Dr. Sabahi: ..."` line needs to hit this mapping too, same as any pre-existing row).
- **Result:** Every occurrence of the 9 confirmed short labels reads as the full name. Everything else is untouched, matching the "don't guess" instruction.

### Step 6 — Verse-reference structuring (additive)

- **Problem:** `[72:19]` (English) and `(67:8)` (Arabic, trailing) are two different citation formats mixed into the prose text.
- **Solution:** Regex-extract both patterns per row into new `VerseRefs`/`VerseLang` columns. **`Text` is not modified** — the citation stays visible in the prose exactly as before; this only adds structured metadata alongside it for anything downstream that wants to link/highlight verses without re-parsing prose every time.
- **Implementation:** Pure read-and-append, no row/timestamp interaction at all, can run any time after Step 2 (needs the terminology already settled so `VerseLang` detection isn't confused by an unnormalized term). Lowest-risk step in the whole plan.
- **Result:** Two new columns, nothing else changes. A row with `[72:19]` gets `VerseRefs=72:19, VerseLang=en`; a row with `(67:8)` gets `VerseRefs=67:8, VerseLang=ar`.

### Step 7 — Arabic flagging (additive)

- **Problem:** No indicator of which rows contain Arabic script.
- **Solution:** New `HasArabic` boolean column, Unicode range test (`؀`–`ۿ`) against `Text`.
- **Implementation:** Same additive pattern as Step 6, can run in the same pass.
- **Result:** One new column, no other changes.

### Step 8 — Date field on the catalog (not the CSV)

- **Problem:** Dates live embedded in title strings, not as a structured field; some sessions have no date at all.
- **Solution:** This isn't a per-row CSV problem — `data/catalog/audios.json` already has a clean, human-composed `displayTitle` per video (confirmed: all 52 entries already have one, e.g. *"QS 01 — Sura 72–73, Jinns & Night Prayer (Kathryn Jinns, 05/26/1989)"*). Add a `date` field (ISO 8601, nullable) to those 52 catalog entries, parsed from the date already present in the title/folder string.
- **Implementation:** Small, targeted script or manual pass over the 52 catalog entries (not the transcript CSVs). Files 14 and 41 (and any others confirmed dateless in the audit) get `date: null`.
- **Result:** A queryable/sortable date field where one exists, honestly null where it doesn't — no fabricated dates.

### Step 9 — Description field (explicitly out of scope for this pass)

Doesn't exist anywhere in any source. Needs to be authored, 52 short summaries, added to the catalog entries. Separate content task, not a data-fix task — flagging so it doesn't get silently skipped, but it's not part of "fixing the transcripts."

### Step 10 — TOC / condensed-entry synthesis (explicitly out of scope for this pass)

Same as the audit: the CSV's ~885 rows/video don't produce the mockup's ~20-topic table of contents on their own — that's editorial curation on top of the now-clean data, not a normalization step. Worth noting there's an *unrelated* existing pipeline (`build_video_transcript_chunks.mjs` / `contextualize_video_chunks.mjs`) that chunks video transcripts for **search/RAG embeddings** with LLM-written one-sentence context notes — that's a different problem (machine-readable search chunks) than a human-facing page TOC, and shouldn't be conflated with it, but is worth knowing about if a similar chunking pass ever gets pointed at the audio transcripts for search purposes.

### Step 11 — Thumbnails to CSS (front-end, not data)

Not a CSV change. Once ready: swap `thumbnailOverride` for a small React component rendering `#026634` background + the title/date/sura text already captured verbatim in `thumbnail-text.md`, matching the shared serif typeface identified earlier. Implementation lives in the component layer, not in this data-fix pass.

---

## Verification strategy (given the accuracy requirement)

1. **Per-file row-count and duration audit**, printed by every structural script (Steps 3–4): rows before/after, splits performed, max End Time before/after (must match exactly except where Step 4 intentionally changes it — which it shouldn't, since splits share the parent row's own bounds).
2. **Spot-check a sample by hand** after each step before running the next — the plan is ordered so each step's output is inspectable in isolation (open the CSV, diff against git).
3. **Since these are tracked files in git**, every step is a discrete, revertible commit — no separate backup mechanism needed beyond normal commit discipline; a bad step can be reverted without touching the steps before or after it.
4. **Re-run `npm run generate:catalog`** after all CSV changes land, and confirm `MASTER_INDEX.json`'s entries for these 52 videos reflect the fixes (segment counts, speaker names, no more embedded `\r\n` in any `text` field, `ā` not `ã` anywhere).
5. **Total row count sanity check across the whole corpus**: 46,047 rows in, plus (splits from Step 4) minus zero (nothing is ever deleted) = expected new total, checked against the sum of all 52 files' new row counts.

## Status

**Steps 1–8: done, committed, verified end-to-end.**

| Step | Result |
|---|---|
| 1. Encoding | 832 `ã`→`ā` replacements, 50/52 files |
| 2. Terminology | 107 Al-Fatiha, 1,133 Surah, 3 Quran, 30 Rasulallah |
| 3. Wrap rejoin | 11,576 of 17,091 flagged rows resolved |
| 4. Multi-speaker split | 3,124 genuine splits (→6,397 rows), 2,391 false triggers resolved; row count 46,047 → 49,320 |
| 5. Speaker canonicalization | 3,763 replacements across the 9 confirmed names |
| 6. Verse references | 3,708 refs extracted across 3,223 rows (additive) |
| 7. Arabic flag | 1,096 rows flagged (additive) |
| 8. Catalog date field | 21 of 52 entries dated, 31 correctly `null` |

Every step verified independently (row-count integrity, byte-identical untouched rows, no cross-column bleed) and committed separately. Final check: ran `npm run generate:catalog` and confirmed the actual `MASTER_INDEX.json` the site serves reflects every fix — no mojibake, no embedded newlines, canonical speaker names present, segment counts matching.

**Steps 9–11: still out of scope, as originally called out** — description authoring, TOC/entry synthesis, and the thumbnail-to-CSS component swap all need a decision or a different kind of work (editorial content, a methodology choice, front-end implementation) before they can proceed, not just "keep running the next script."
