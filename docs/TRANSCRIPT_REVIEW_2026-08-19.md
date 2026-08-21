# Video Transcript Review: Speaker Labels and Duplicate Recordings

Date: 2026-08-19
Scope: `data/sources/playlists/video-transcripts/` (52 CSV files, 17,599 caption rows;
was 53 files / 17,764 rows before the 02/38 merge moved one transcript to
`archive/superseded/`)

This document records four classes of finding:

1. **Speaker-label defects** in the multi-speaker conference and Q&A transcripts (A).
2. **Duplicate and overlapping audio** between separate catalog entries (B).
3. **Mechanical defects** in the files themselves, from a validation sweep over
   timestamps, ordering, encoding and column conformance (C).
4. **Speaker attribution in the 1987 debate**, reconstructed from the theological
   content of the exchange (D), then cross-checked against the audio with speaker-embedding
   diarization (F).

Parts A and B came out of the description/TOC pass. Parts C and D were added in a second
pass, which also corrected one factual error in Part A (see A.7). Part F is an acoustic
audit of Part D and agrees with it on 90.7% of segments. Part E is the running status:
nothing is open, everything is closed or recorded as a known limit.

Every timestamp, row number and count below was measured against the files as they
currently stand on branch `updates`. Row numbers are **0-based indices into the data
rows** (excluding the header line), which is what the verification scripts report. If you
open the CSV in a spreadsheet, add 2 to get the spreadsheet line number.

---

# Part A: Speaker Label Issues

## A.1 The defect signature

Three transcripts carry a `Speaker` column with more than one participant. In these files
the caption text itself usually carries an inline `Name:` prefix at the moment a new
person starts talking, and the `Speaker` column was populated by propagating that name
forward until the next prefix appears.

That propagation is correct for a long turn: a speaker talks for two minutes across
thirty caption rows, and only the first row repeats their name. It fails in one specific
case:

> A short interjection by a secondary speaker (a host, a moderator, a questioner) carries
> its own `Name:` prefix. The primary speaker then resumes, but writes no new prefix
> because the transcript never re-announces him. The interjector's name therefore sticks
> to every subsequent row until the next prefix appears, which can be minutes later.

The result is that long stretches of Dr. Rashad Khalifa speaking are attributed to
whoever last asked him a question.

**How to distinguish a real defect from normal continuation:** look at whether the
unprefixed rows read as a *continuation of the prefixed sentence* or as a *reply to it*. A
continuation is correctly labelled. A reply is mislabelled. This has to be read; it cannot
be decided by the prefix pattern alone, which is why the file 11 assessment below was
revised.

## A.2 File 50: CONFIRMED AND ALREADY FIXED

File: `50 - Friday Sermon Miracle of Miracles - Al-Fatiha, Proving the Five Salat (12-08-1989).csv`

You verified by ear that from `00:18:49` to the end of the recording the speaker is
Dr. Rashad Khalifa, not Edip.

**Applied:** 107 rows from `00:18:49.718` through the end of file changed from `Edip` to
`Dr. Rashad Khalifa`.

**Current state:** 238 rows total, of which 236 are `Dr. Rashad Khalifa` and 2 are `Edip`.
Both remaining `Edip` rows carry their own explicit `Edip:` prefix in the text, at
`00:13:25.640` and `00:18:42.266`, so both are self-evidently correct.

No further action needed on this file.

## A.3 File 10: CONFIRMED BY EAR AND FIXED

File: `10 - United Submitters International Conference Explaining the Fulfillment of the Covenant (1988).csv`
Duration: `00:00:08` to `00:18:54`. 190 rows.

This file had the sticky-label defect described in A.1: six rows carry an explicit inline
`Name:` prefix, every one of them a short interjection, and each name had propagated
forward over the answer that followed it.

**You verified all four boundaries by ear** (`00:10:47`, `00:15:10`, `00:16:25`,
`00:17:06`) and confirmed the voice is Dr. Rashad Khalifa at each. You also identified two
further rows that the prefix pattern had wrong, which I had assessed as correct and
explicitly listed as not needing a check. **Both of those assessments were wrong.**

### Applied: 69 rows across 6 ranges, all to `Dr. Rashad Khalifa`

| Rows | Time range | Was | Basis |
|---|---|---|---|
| 116 - 151 | `00:10:47` - `00:15:06` | `Ismail` | Khalifa answering after Ismail's one-line exclamation; he is the one hunting for and reading the verse |
| 153 - 162 | `00:15:10` - `00:16:22` | `Ismail` | Khalifa answering Ismail's aside, into the KATHAB/KAZZAB argument |
| 164 - 166 | `00:16:25` - `00:16:43` | `Ismail` | Khalifa answering, ending "...then you know they lost the argument" |
| **168** | `00:16:49` | `Ismail` | **Khalifa**, not Ismail. He is the one calling on Azhar: "Brother Azhar has..." |
| 170 - 187 | `00:17:06` - `00:18:39` | `Azhar` | Khalifa answering Azhar's question, through Sura 110, Japan and Naoko |
| **189** | `00:18:48` | `Ismail` | **Khalifa**, not Ismail. He closes the session: "We have the whole world covered. I think we'll have a break before lunch." |

**Current state:** 184 `Dr. Rashad Khalifa`, 5 `Ismail`, 1 `Azhar`. Every one of the six
remaining non-Khalifa rows carries its own explicit inline prefix, so all six are
self-evidently correct: rows 115, 152, 163, 167 and 188 (`Ismail`) and row 169 (`Azhar`).
A check for any inline `Name:` prefix disagreeing with its `Speaker` value now returns
nothing.

### What I got wrong, and the lesson

I had written that rows 168 and 189 were "genuine `Ismail`", reasoning that 168 continues
Ismail's row-167 moderator cue and that 189 continues his row-188 aside. Both readings were
plausible and both were wrong. The actual pattern is that Khalifa is chairing the session
himself: he takes Ismail's cue about having time for more questions and calls on Azhar, and
he closes the session at the end.

The lesson generalises to A.1. The reply-versus-continuation test catches the common
direction of this defect, where an interjector's name sticks to the answer that follows.
It does not catch the reverse, where an interjector's name sticks to a row that is actually
the *primary* speaker resuming a chairing role. Any future pass over a multi-speaker file
should treat both directions as open, and rows adjacent to a prefixed interjection should be
checked rather than assumed correct just because they read as continuous.

No further action needed on this file.

## A.4 File 11: I CLEARED THIS FILE TWICE AND IT HAD THREE DEFECTS

File: `11 - United Submitters International Conference Final Speech by Dr. Rashad Khalifa (1989).csv`
Duration: `00:00:11` to `00:56:40`. 561 rows.

I assessed this file as correct, retracted an earlier flag on it, then reaffirmed it as
closed. **All of that was wrong.** You found three defects by ear:

| Rows | Time | Was | Now | Nature |
|---|---|---|---|---|
| 177 - 183 | `00:16:05` - `00:16:42` | `Dr. Rashad Khalifa` | `Ismail` | A whole 7-row turn absorbed into Khalifa's label. Khalifa hands over at row 176 ("And what happened Ismail? I give you two minutes."), Ismail tells the San Francisco story, Khalifa resumes at row 184 ("Thank you, sir.") |
| 412 | `00:39:28` | `Dr. Rashad Khalifa` | `A third woman` | The row carries its own inline prefix, `A third woman (jokingly):`, and was labelled Khalifa anyway |
| 538 | `00:54:32` | `Ismail` | `Dr. Rashad Khalifa` | Khalifa chairing: he asks Ismail for ten minutes, Ismail answers "Yeah.", then Khalifa sets the terms and calls on Cecilia. Same pattern as file 10 rows 168 and 189 |

**Current state:** 453 `Dr. Rashad Khalifa`, 34 `Susan`, 23 `Edip`, 17 `Sophie`, 13
`Christie`, 8 `Ismail`, 4 `A man`, 3 `Raymond`, 2 `Cecilia`, 1 each `Christina`,
`A woman`, `People`, `A third woman`. A `Raymon:` / `Raymond:` spelling typo at row 335 was
also corrected, and a `ture` / `true` typo in row 412.

### Why my method could not have found two of the three

The check described in A.7 tested, for each row **whose `Speaker` is not Dr. Rashad
Khalifa**, whether the text opens with that speaker's name. Rows 177-183 and 412 were
labelled Khalifa. They were therefore never candidates. The check was structurally
incapable of finding them, and no amount of care in applying it would have helped.

Row 538 is different and worse: it *was* in the candidate list, I looked at it, and I
cleared it as a continuation of Ismail's "Yeah." That is the same misjudgement as file 10
rows 168 and 189 — three times now I have read Khalifa chairing the session as somebody
else continuing.

Two lessons, both now acted on:

1. **A defect can point either way.** A label can be wrong because a secondary speaker's
   name spread over the primary speaker, *or* because the primary speaker's name spread
   over a secondary speaker's turn. The second kind is invisible to any check that only
   examines non-primary rows.
2. **Khalifa chairs his own sessions.** Handover lines ("I give you two minutes",
   "Brother Azhar has...", "Cecilia"), acknowledgements ("Thank you, sir.") and closing
   remarks are his, even when they sit immediately after somebody else's turn and read as
   continuations of it.

## A.5 The rule that supersedes the reply-versus-continuation test

Your rule, which is both simpler and sound: **if a caption bubble begins `NAME:`, that
names the speaker of the bubble.** `The messenger`, `Rashad` and `Dr. Khalifa` all mean
`Dr. Rashad Khalifa`.

This is self-evident evidence rather than inference: the transcriber wrote the name. It
should have been the first check run over these files, and it is now enforced archive-wide.

### Applied, with two guards

Sweeping every file for leading-prefix rows whose `Speaker` disagreed found **186 rows**
across three files, all now corrected:

| File | Rows | What they were |
|---|---|---|
| 06 The Great Debate | 182 | Caption cells spanning a speaker change, labelled with the *last* speaker in the cell rather than the one the cell opens with |
| 05 Old Message, New Messenger | 4 | `Carole:` x2 and `Audience:` x2, all labelled Khalifa |
| 11 Final Speech | 1 | Row 412, the `A third woman (jokingly):` interjection above |

A re-run now reports **zero** rows in the archive where a leading `NAME:` prefix disagrees
with its `Speaker` value.

Two guards were needed, both discovered by checking rather than assumed:

- **Prose colons are not speaker tags.** `There are two kinds of people:`, `It says:`,
  `The third Question:` and about a dozen others match the pattern and are not
  attributions. Only prefixes resolving to a name the archive actually uses as a speaker
  are honoured.
- **`The messenger (PBUH):` is not a speaker tag.** At row 720 of the English Sunni
  Scholars debate the text reads `"The messenger (PBUH): to clarify what GOD revealed"`.
  That is the scholars *defining* the messenger's role, and the row is correctly labelled
  `Sunni Scholars`. Naive application of the rule would have flipped it to Khalifa and
  inverted the argument. Prefixes carrying an honorific are skipped.

### One consequence worth recording

In file 06 the rule costs one label. Row 1101 reads
`"Abdel Rahman: Did you stop it?" / "A woman: Wait, wait, wait. Yeah."` — two speakers in
one cell. Under the old last-speaker convention it was labelled `A woman`, which was that
file's only record of a third participant in the `Speaker` column. Under the leading-prefix
rule it becomes `Abdel Rahman`. Nothing is lost from the archive, since the text still
reads `A woman: Wait, wait, wait. Yeah.`, but the column no longer surfaces her.

That is the general cost of the rule on multi-speaker cells, and file 06 has 191 of them:
the label describes the speaker the cell opens with, and any later speaker in the same cell
is visible only in the text. The alternative would be splitting those 191 rows, which means
inventing intermediate timestamps, so the rule is the better trade.

## A.6 Speaker inventory: verifying the collection is clean

`scripts/utils/analyze-transcript-speakers.mjs` is a read-only inventory, ported from
`scripts/utils/analyze-speakers.ts` (which did this for the Quran Study VTTs). It lists every
name used in the `Speaker` column, every name declared by a text prefix, likely typo variants
by edit distance, and — most usefully — every prefix the validator *skips*.

That last list matters because `validate_speaker_prefixes.mjs` ignores any prefix it does not
recognise as a known speaker, on the assumption that it is prose. This tool enumerates those
so the assumption can be checked rather than trusted.

**Result for the video transcripts: the collection is clean.** 26 speaker labels, 88 declared
prefixes, and all 53 unrecognised prefixes are genuinely prose introducing a list or a
quotation (`All intoxicants are prohibited:`, `Here they are:`, `He said:`, `The third
Question:`). No hidden speaker is being skipped.

Two cosmetic findings, one fixed and one left alone:

- `Dr. KHalifa:` at file 06 row 594, a casing slip. Fixed. The label was already correct, so
  it was never an attribution defect.
- `Christina` at file 11 row 328 (`"Christina: yes"`), sitting inside a run of `Christie`
  lines during Christie's exchange with Khalifa, and the only occurrence of that name in the
  archive. Very likely a typo for `Christie`, but **left as-is**: the leading-prefix rule says
  the text names the speaker, and changing the text to make the label fit would invert the
  rule. Flagged for a human, not guessed at.

**Where this tool would pay off is the audio collection**, which has exactly the defect class
the video files turned out not to have: `Dr. Khalifa` (48,442) alongside `Dr. KhaIifa` (capital
I for l), `Dr.Khalifa`, `Dr. Khalfia`, `Dr. Khlaifa` and `Dr Khalifa`; `Ismail Barakat` (867)
alongside four misspellings; plus `Atif`/`Atfi`, `Abdullah`/`Abudullah`, `Hussein`/`Hossein`,
`Muhteshem`/`Muhtesem`, `Mahmood Abib`/`Mamhood Abib`. There is also a separate normalisation
question there: `Shakira Karipineni`/`Shakira`, `Parivash Ettefagh`/`Parivash`,
`Feroz Karmally`/`Feroz` and `Farhad Mo'ini`/`Farhad` are each one person under two forms.

Caution when reading its variant groups: the edit-distance heuristic over-groups. It pairs
`Edip`/`Eric`, `Hamid`/`David`, `Carl`/`Carol`, `Matt`/`Gatut` and `Ihsan`/`Susan`, which are
distinct people. The groups are leads to check, not conclusions.

## A.7 Method, and its two superseded versions

**Current method, in order of authority.**

1. **Leading-prefix rule (A.5).** If a bubble opens `NAME:`, that is the speaker.
   Self-evident, exact, enforced archive-wide, currently zero violations. Guards: skip
   prose colons and honorific-bearing prefixes.
2. **Audio.** Speaker-embedding diarization
   (`scripts/analysis/debate-diarization/`) for anything the text does not declare. Used on
   the 1987 debate at 90.7% agreement with the read attribution (Part F).
3. **Reading the argument.** Only where neither of the above applies, and treated as a
   judgement that can be overturned, not a finding.

**Superseded version 1.** The original check tested, for each row whose `Speaker` is *not*
`Dr. Rashad Khalifa`, whether the row's own text opens with that speaker's name. Its fatal
limitation is documented in A.4: by construction it never examines a row labelled with the
primary speaker, so it cannot see a secondary speaker's turn that was absorbed into the
primary label. That is exactly what file 11 rows 177-183 and 412 were.

**Superseded version 2.** The reply-versus-continuation reading test, used to promote
candidates to findings. It misjudged file 10 rows 168 and 189 and file 11 row 538, all three
in the same way: Khalifa chairing his own session reads as somebody else continuing.

Files with a multi-value `Speaker` column: 5, 6, 10, 11, 50, and both Sunni Scholars debate
files. An earlier version of this list named only 10, 11 and 50, which is why files 5 and 6
went unexamined for so long.

**On the Sunni Scholars debate files.** Their `Speaker` column began entirely **empty**
across all 1,193 English and 1,180 Arabic rows, so the prefix check had nothing to run
against; they are now populated by the work in Parts D and F, which is tracked as its own
item in Part E. `src/app/media/[...id]/page.tsx` still special-cases the record so the rows
that remain unattributable do not default to a named speaker.

---

# Part B: Duplicate and Overlapping Recordings

## B.1 How overlap was measured

Two independent methods, because the first alone is not proof:

1. **Shingle matching.** Both transcripts are lowercased, stripped to alphanumerics, and
   reduced to a stream of words. Every 8- or 9-word window in file A is looked up in an
   index of every window in file B. Contiguous runs of matching rows are reported with the
   time range they occupy in each file. This finds *candidates*.

2. **Timestamp-offset drift.** For a candidate pair, matched word positions are converted
   back to their source timestamps and the per-word offset `t_B - t_A` is computed. This
   is the decisive test. **The same audio file, cut at a different in-point, produces a
   constant offset. Two separate deliveries of the same talk cannot: a human speaking the
   same material twice drifts by tens of seconds over ten minutes.** A flat offset
   distribution is therefore evidence of one recording; a drifting one is evidence of two.

The tiers below reflect what each pair survived.

## B.2 Tier 1: the same recording, published twice

### 02 and 38 are the same audio. Confirmed.

- `02 - Who is GOD.csv` (161 rows, `00:01:19` - `00:18:39`)
- `38 - Friday Sermon Who is GOD Understanding Our Universe (08-04-1988).csv` (165 rows, `00:02:39` - `00:18:38`)

You asked for this one to be proved rather than inferred, on the reasonable grounds that
one is presented as a Friday sermon and the other as a produced video program, so a
heuristic match would not settle it. Here is what the measurement shows.

**Text comparison** (full word-level `difflib` diff, not shingle sampling):

| Metric | Value |
|---|---|
| Word-sequence similarity | **0.9630** |
| Same, with numerals normalized to words | **0.9783** |
| Contiguous matched block | `00:02:47` - `00:18:25` in 02 vs `00:02:47` - `00:18:22` in 38, 132 rows |

The residual 2 to 4 percent is entirely caption transcription variance: digits versus
spelled numbers, punctuation, and differing splits of the same sentence across rows. No
passage exists in one file and not the other within the matched range.

**Timestamp-offset analysis** (the decisive test):

| Metric | Value |
|---|---|
| Aligned word pairs | 1,994 |
| **Median offset** | **+0.01 s** |
| Mean offset | -0.08 s |
| Per-2-minute-bucket medians, across the whole 16 minutes | all within -1.27 s to +0.67 s |

A median offset of one hundredth of a second, holding flat across every two-minute bucket
for sixteen minutes, is only possible if both files were cut from one audio source. Two
separate deliveries of the same sermon would show cumulative drift of tens of seconds.

**Conclusion: 02 and 38 are the same recording.** The difference between them is framing
and packaging, not content. Both transcript descriptions have been updated to state this.

**Open decision for you:** whether both should continue to appear as separate cards on the
videos page. I have not changed the catalog. Options:

- Keep both, as now. They are cross-linked in their descriptions, so a viewer who lands on
  one is told about the other. Costs nothing, but a user browsing the grid sees the same
  content twice.
- Keep 38 (the sermon, with its date) as canonical and drop 02 from the grid.
- Keep 02 (the produced program) as canonical and drop 38.

This is an editorial call about how the archive should present itself, so I have left it to
you.

## B.3 Tier 2: one entry contains another in full

These are compilations. The contained sermon is not merely similar; it is the same audio,
embedded in a longer program.

### 05 is a compilation of 34 and 35

`05 - Old Message, New Messenger.csv` (635 rows, `00:00:00` - `01:19:30`)

| Region of 05 | Source | Region of source |
|---|---|---|
| `00:02:33` - `00:14:48` | `34 - ...Proclaiming Messengership, Abraham's Religion (04-15-1988)` | `00:02:33` - `00:14:48` |
| `00:15:10` - `00:33:28` | `34` (continues) | `00:15:09` - `00:33:27` |
| `00:36:11` - `01:11:30` | `35 - ...Rashad Explains His Messengership Details (05-16-1988)` | `00:02:35` - `00:37:52` |

Note the offsets. Against 34 the offset is **zero**: file 05 opens with sermon 34 at its
original position. Against 35 the offset is a constant **-33:36**, i.e. sermon 35 is
spliced in whole after 34 finishes. Sermon 34 runs to `00:33:36` and sermon 35 runs to
`00:38:03`; both are contained essentially in full.

**05 also repeats itself internally.** This is a defect in the source video, not in the
transcript:

| First occurrence | Repeated at | Extent |
|---|---|---|
| `00:57:56` - `01:02:45` | `01:14:39` - `01:19:15` | 723 matching 9-word shingles, about 4 minutes 49 seconds |
| around `01:11:54` - `01:12:43` | (shorter, 16 shingles) | about 50 seconds, needs a manual look |

The large repeat means the final five minutes of file 05 replay material already heard at
`00:57:56`. The transcript faithfully records what the video does. If the video itself has
a duplicated segment, that is worth a trim in the same way you trimmed 03 and 08.

### 18 is a compilation of an original section plus sermons 32 and 33

`18 - Principles of Friday Prayer.csv` (539 rows, `00:01:37` - `00:56:55`)

| Region of 18 | Source | Region of source | Offset |
|---|---|---|---|
| `00:01:43` - `00:16:56` | **unique to 18** | n/a | n/a |
| `00:17:32` - `00:31:33` | `32 - ...Seek GOD's Kingship Over You and Everything Else Follows (03-25-1988)` | `00:00:07` - `00:14:05` | constant -17:25 |
| `00:31:38` - `00:33:45` | **unique to 18** (bridge) | n/a | n/a |
| `00:34:17` - `00:56:33` | `33 - ...Marriage Importance of Love, Muhammad's Example (04-08-1988)` | `00:00:10` - `00:22:21` | constant -34:07 |

Sermon 32 runs `00:00:01` - `00:16:31` and sermon 33 runs `00:00:02` - `00:22:47`, so both
are contained in near-full. The offsets hold constant across each block, confirming spliced
audio rather than re-delivered material.

The first roughly sixteen minutes of file 18 match nothing else in the archive. That
section is the instructional content that gives the video its title, and it is the reason
18 has independent value even though two thirds of it is duplicated sermons.

### 16 borrows two short passages

`16 - Essentials of Submission (Islam).csv` (455 rows, `00:00:29` - `00:51:35`)

| Region of 16 | Source | Region of source |
|---|---|---|
| `00:37:39` - `00:39:42` | `45 - ...Purpose of Messengers, The Advent of the Pure Quran (03-17-1989)` | `00:14:00` - `00:21:18` |
| `00:39:32` - `00:43:34` | `43 - ...Revelation of Quran to Revelation of Miracle, Importance of Dawn Prayer (02-03-1989)` | `00:11:15` - `00:15:14` |

Everything else in file 16, including all of `00:00:29` - `00:35:37` and
`00:43:34` - `00:51:27`, matches nothing else in the archive. This is a mostly original
program that quotes two sermon passages. **No trim is warranted here.** The borrowed
material is a small minority of the runtime and functions as illustration.

## B.4 Tier 3: previously suspected, now measured as NOT duplicates

| Pair | Result |
|---|---|
| `16` and `23 - ...Universal Unity Through Devotion to GOD Alone` | **Zero verbatim overlap.** No contiguous block of 4 or more rows matches. These are separate recordings on the same theme. I had earlier described them as duplicates; that was wrong, and the cross-link in file 23's description has been rewritten to say explicitly that they are separate recordings covering related material. |
| `48` and `50` | **Zero verbatim overlap.** |
| `34` and `35` | **Zero verbatim overlap** with each other, despite both being contained in 05. They are two distinct sermons a month apart, which is why 05 can splice them end to end. |
| `17 - Principles of Contact Prayers Salat` and `18` | **Zero verbatim overlap.** Adjacent topics, separate recordings. |

## B.5 Two containments that you have already resolved

Before your edits, two further containments existed. Both are now gone, and I re-ran the
measurement against the current files to confirm it:

| Was | Status now |
|---|---|
| `03 - Witness a Miracle` contained all of `14 - World News Bulletin` | **Resolved.** You trimmed the bulletin segment. File 03 was truncated at `00:37:49.990` (382 rows down to 304, last row now `00:37:11.442`), its TOC reduced from 46 to 34 entries, and its description rewritten to drop the bulletin half. The file was renamed with `git mv` from `03 - Witness a Miracle & World News Bulletin.csv`. Current measurement: **no contiguous block of 4 or more rows matches file 14.** |
| `08 - Evolution or Creation` contained all of `13 - Excerpts From a Radio Debate` | **Resolved.** You trimmed the radio debate segment. File 08 was truncated at `00:55:49.240` (506 rows down to 456, last row now `00:55:23.740`), its TOC reduced from 49 to 46 entries, and the cross-link sentence removed from its description. Current measurement: **no contiguous block of 4 or more rows matches file 13.** |

Obsolete `Related recording:` sentences were also removed from the descriptions of files 13
and 14, since the recordings they pointed at no longer contain them.

---

# Part C: Mechanical Defects (second pass)

A validation sweep over all 53 files and 17,764 rows, checking things the description/TOC
pass did not: timestamp wellformedness, row ordering, cue overlap, gap size, column and
header conformance, TOC/start-time agreement, duplicate YouTube ids, and invisible or
mis-encoded characters. Three findings, two of them now fixed.

## C.1 Three rows out of position in the English debate. FIXED.

File: `Debate Dr Rashad Khalifa Ph D vs Sunni Scholars (1987).csv`

Three caption rows sat in the wrong place in the file, wedged between rows at `00:28:57`
and `00:29:01`:

| Was at row | Timestamp | Text | Belonged after |
|---|---|---|---|
| 759 | `00:32:28.947` | `Many people, thousands from all over the world` | row 853, `00:32:27.245` (`No — here are 1, 2, 3...`) |
| 760 | `00:33:41.819` | `Jihad?` | row 884, `00:33:40.785` (`He enforced what is right`) |
| 761 | `00:33:42.353` | `Yes, the Jihad` | row 760 above |

This produced a 4m41s backward jump at row 762 and a phantom 210-second gap, which is how
it was found.

Placement was not inferred from the timestamps alone. The Arabic companion transcript is
time-aligned with this file and has the corresponding cues in exactly those slots: rows
822-823 (`00:32:27.720`, `واحد واثنين وثلاثه نجيب لك الناس في / العالم`) and rows 857-858
(`00:33:42.000` `الجهاد`, `00:33:42.600` `ايه الجهاد`). Both readings agree, so the
ordering is independently attested rather than reconstructed.

**Applied:** the three rows were moved to the positions above. Row count unchanged at
1,193; TOC unchanged at 27 entries. Because the catalog generator sorts segments by start
time, generated output was unaffected.

Four sub-second backward steps remain in this file (0.2s at row 219, 0.7s at 335, 0.03s at
1180 and one more). These are not defects: the English translation interleaves two people
talking over each other, and cross-talk legitimately produces cues whose start times
invert by fractions of a second. The Arabic file, which serializes the same audio into a
single stream, has zero.

## C.2 Non-breaking spaces in caption text. FIXED.

2,202 U+00A0 characters across 15 files, all in the `Text` column. Every one functioned as
an ordinary word separator: 1,755 immediately preceded a line break and 447 sat mid-line
between two words. None appeared in a numeric group or anywhere the non-breaking property
was doing work.

Left alone this is not a display bug, since HTML treats U+00A0 as a space. It is a
tokenization bug: naive `split()` word streams treat `word word` as one token, which
silently corrupts the shingle matching and timestamp-offset analysis in Part B, the very
scripts this document's conclusions rest on.

**Applied:** byte-level replacement of `\xc2\xa0` with `\x20` across the 15 files, chosen
over a CSV rewrite so record terminators and quoting could not be disturbed. Verified: 0
remaining, row and column counts unchanged, and the regenerated `MASTER_INDEX.json` differs
from its previous state by exactly this substitution and nothing else (2,155 lines, every
one matching after normalization).

Three bidi marks (2 LRM, 1 RLM) in file 17 were **not** touched. They sit inside
parentheses around Arabic words embedded in English prose, where they are isolation hints
rather than noise.

## C.3 Four-minute untranscribed span in file 09. RESOLVED, NOT A DEFECT.

File: `09 - King of Chaos.csv`, between `00:17:24.960` (row 109) and `00:21:28.127` (row 110).

At 243 seconds this is by far the largest gap in the archive; the next largest is 119s. It
was flagged because a gap that size can mean lost speech.

**It does not here.** Confirmed: the span is a visual presentation set to music, with
nothing spoken. The transcript is complete, and no caption is missing. The textual signals
agreed with this before it was confirmed: row 109 closes a thought (`"It's a legitimate
question and this program will deal with this question."`), row 110 opens a fresh one
(`"In order to answer the question 'why are we here?'"`), and the TOC has no entry inside
the gap.

Recorded here so a future validation sweep does not re-raise it. A silence check on this
archive should treat a long gap as a question about the *source*, not as evidence of a
transcription failure.

Every other gap over 45 seconds was checked and is accounted for: recitation, silence, or,
in the case of file 39's tail, the Sammy Khalifa baseball broadcast that the curated
description already documents.

## C.4 Clean

No findings for: malformed or non-parsing timestamps, `End Time` before `Start Time`,
zero-duration cues, header or column-count deviations, missing or duplicated `Description`
rows, half-populated TOC pairs, TOC entries out of order, `TOC Time` disagreeing with the
row's own `Start Time`, duplicate TOC titles, mojibake, replacement characters, or
placeholder text (`[inaudible]`, `???`, `TODO`). Twelve cues run over 30 seconds, all of
them opening or closing remarks over a long pause, which is normal.

The two debate files share a YouTube id. That is correct and already documented: they are
the Arabic and English captionings of one recording, and the catalog carries one entry.

---

# Part D: Speaker Attribution in the 1987 Debate

Both debate transcripts shipped with an entirely empty `Speaker` column: 1,193 English
rows and 1,180 Arabic rows, none attributed, for a recording whose whole interest is who
is arguing what. Nothing in either file names a participant except in passing.

Audio identification was not available, so attribution was done from the argument itself.

## D.1 What the sides are

The two positions are mutually exclusive and each is stated dozens of times, which is what
makes the exchange attributable at all.

| | Dr. Rashad Khalifa | The Sunni scholars |
|---|---|---|
| Sufficiency | The Quran is complete and fully detailed; nothing may be added | The Quran states some matters in general terms only |
| The messenger's role | Delivery alone, `[5:99]` | Delivery plus clarification (`Bayan`) |
| `Tubayyin` in `[16:44]` | "Proclaim", the opposite of concealing, read through `[3:187]` and `[5:67]` | "Explain", so the Sunna supplies the detail |
| Who explains | God alone, `[75:16-19]` | The Prophet |
| Source of the rak'ah counts | The religion of Abraham, `[22:78]`, `[2:135]`, `[16:123]`, transmitted by *tawatur* | "Pray as you have seen me pray", the hadith of Gabriel |
| The Sunna | Not a source; the hadiths are unauthenticated | A second source, `[59:7]`, `[4:80]`, `[3:31]`, `[4:59]` |
| The shahada | Adding Muhammad's name beside God's is *shirk* and an innovation | Quranic and *mutawatir*, `[48:29]` |
| Distinction among messengers | Forbidden, `[2:285]` | Forbidden in belief only; preference is textual, `[2:253]` |

Signature moves are also one-sided and recur. Khalifa: the Crest-toothpaste analogy for a
practice already in circulation (rows 251-260), the Abu Bakr/Umar dilemma that they
compiled only the Quran and so either disobeyed the messenger or the hadith is false
(423-479), the "cinema on Tuesday" reductio against accepting any attributed saying
(344-348), the mathematical code as his ground for the Quran's certainty (369), and the
argument that Muhammad "was" the messenger because he is dead (934-1058). The scholars: the
fourteen-centuries appeal, "we have not known anyone who denies the Sunna except you", the
long history of how the Sunna was written and preserved (480-503), and the repeated demand
for an explicit verse giving the number of rak'ahs.

## D.2 What was applied

Every row of the English translation was read and assigned to the side whose position it
advances. The result was then propagated to the Arabic transcript by timestamp overlap,
since both caption one recording and align to within about a second: each Arabic cue takes
the label of the English rows sharing its wall-clock window, weighted by overlap, and
requires a clear winner (the leader must hold more than 1.5x the runner-up) or it stays
blank.

| | Dr. Rashad Khalifa | Sunni Scholars | Left blank |
|---|---|---|---|
| English (1,193 rows) | 487 | 594 | 112 (9.4%) |
| Arabic (1,180 rows) | 503 | 567 | 110 (9.3%) |

Those are the counts from reading alone. Part F later resolved 11 of the blanks from the
audio, giving the current 490 / 602 / 101 in English and 503 / 574 / 103 in Arabic.

**Attribution is by side, not by individual.** The recording has Khalifa against several
scholars, and the transcripts name only three people in passing: `Sheikh Abdul Aziz`
(addressed by Khalifa at row 564 and the main interlocutor), `Brother Essam` (row 68), and
`the Doctor`, meaning Khalifa, referred to in the third person at row 673 by someone
chairing. That is not enough to say which scholar speaks which line, and inventing an
allocation would be worse than declining to. Each scholar-side row is therefore labelled
`Sunni Scholars`.

**The blank rows are deliberate.** They are bare affirmations (`Yes`, `Correct`,
`Good`, `MashaAllah`), ellipsis rows, and cross-talk sitting exactly on a turn boundary
where the words carry no position. `src/app/media/[...id]/page.tsx` keeps this record in
its `isUnverifiedSpeakerSource` list so those rows stay blank instead of inheriting the
record author, which would hand the scholars' interjections to Khalifa.

## D.3 Cross-validation

The Arabic transcript carries a `>>` turn-change marker on 600 of its rows, emitted by the
caption source. **This signal was not used as an input to the attribution.** It is
therefore available as an independent check: if the attribution is sound, the points where
the label flips should coincide with the points the caption source independently marked as
a change of speaker.

| Measure | Count |
|---|---|
| Label changes landing exactly on a `>>` marker | 281 |
| Label changes with no marker | 42 |
| **Agreement** | **281 / 323 = 87.0%** |
| Markers with no label change | 201 |

The 201 markers without a label change are expected and not errors: consecutive cues from
the same side, either one speaker's sentence split across cues or two scholars in
succession, which side-level attribution cannot and should not distinguish.

The 42 label changes with no marker are the weakest calls in the set. They are places where
the argument clearly changes hands but the caption source did not mark it. If any of the
attribution is wrong, it is most likely to be here.

## D.4 Confidence

- **High** for the substantive rows, the great majority. A row that argues the Quran is
  fully detailed or that the messenger's sole duty is delivery cannot belong to the
  scholars, and a row demanding an explicit verse for the rak'ah count cannot belong to
  Khalifa. 87% independent agreement with an unused signal supports this.
- **Moderate** for short rows inside a long run, where the assignment rests on continuity
  with the surrounding turn rather than on content of their own.
- **Not claimed** for the rows left blank, and not claimed at all for the identity of
  individual scholars.

This is a text-based judgement, like the file 11 assessment in A.4 and unlike the file 50
fix in A.2. It can be overturned by ear. What would most improve it is naming the
individual scholars, which needs someone who can recognise the voices or identify the
participants of that 1987 gathering.

---

# Part E: Summary of Outstanding Items

**Nothing is open.** Every item is either closed or recorded below as a known limit.

## Closed

| # | Item | Resolution |
|---|---|---|
| 1 | File 10 speaker labels | **Fixed.** You verified all four boundaries by ear and caught two further rows I had wrongly assessed as correct. 69 rows relabelled across 6 ranges; final state 184 Khalifa / 5 Ismail / 1 Azhar, with all 6 remaining non-Khalifa rows self-identified by an inline prefix (A.3) |
| 2 | File 11 speaker labels | **Fixed.** I cleared this file twice and it had three defects, found by ear: a 7-row Ismail turn absorbed into Khalifa, a prefixed interjection labelled Khalifa, and a Khalifa chairing line labelled Ismail (A.4) |
| 13 | The leading-`NAME:` prefix rule was never enforced | **Now enforced archive-wide.** 186 rows corrected across files 06, 05 and 11; a re-run reports zero violations. Two guards added for prose colons and honorific-bearing prefixes (A.5) |
| 14 | Files 05 and 06 were never examined for speaker defects | **Examined and fixed.** They were missing from the multi-value-`Speaker` file list in A.7, which is why they went unchecked (A.5, A.7) |
| 15 | Whether the video collection has the name-typo problem the Quran studies had | **Checked: it does not.** A ported speaker inventory found 26 labels and 88 declared prefixes with no true variants, and confirmed all 53 prefixes the validator skips are genuinely prose. One casing slip fixed, one `Christina`/`Christie` flagged (A.6) |
| 3 | File 50 speaker labels | Fixed and verified by ear (A.2) |
| 4 | 03 and 08 containments | Resolved by trims, re-measured (B.5) |
| 5 | 16 and 23 mislabelled as duplicates | Corrected in file 23's description (B.4) |
| 6 | 02 and 38 both carried as cards | **Merged.** 38 was removed from the catalog and 02 kept, since 02 is the fuller transcript (it alone has the opening takbirs and has 17 TOC entries against 16). 38's title was the only statement of the recording date, so `1988-08-04` was moved onto 02 as `date`, `fullDate` and `year`. The superseded transcript is preserved under `archive/superseded/`, not deleted. Playlist slot 30 in `src/lib/playlistOrder.ts` is now vacant by design. |
| 7 | Three misordered rows in the English debate | Fixed, verified against the Arabic transcript (C.1) |
| 8 | 2,202 non-breaking spaces in caption text | Normalized to U+0020 (C.2) |
| 9 | Four-minute gap in file 09 | **Not a defect.** Confirmed to be a visual presentation set to music, nothing spoken (C.3) |
| 10 | Arabic and English debate transcripts presented as two entries | Never were two entries. The catalog always carried one; the player now offers the pair as a language toggle, deep-linkable as `?lang=ar` |
| 11 | The debate's empty `Speaker` column | **Attributed by side** from the theological content of each row, 87% corroborated by an unused turn-change signal (Part D) and independently **90.7% corroborated by speaker-embedding diarization on the audio** (Part F). 11 further rows resolved from the audio; 101 remain deliberately blank |
| 12 | Whether the text attribution survives the audio | **It does.** ECAPA diarization agrees on 728/803 segments against a 52.9% baseline, with symmetric errors and no region of collapse (F.3) |

## Known limits, not open items

These are recorded so they are not rediscovered as bugs:

- **File 06 has 191 caption cells containing two speakers.** The `Speaker` column names the
  one the cell opens with, per the leading-prefix rule; any later speaker in the same cell
  is visible in the text but not in the column. Splitting those rows would mean inventing
  intermediate timestamps, so it is left as-is (A.5).
- **The remaining unprefixed runs in file 11 are unverified.** Every row that declares a
  speaker inline is now correct, but runs carrying no prefix rest on reading alone, and that
  method has now failed three times in the same way. The candidate runs are rows 310-313
  (`Christie`), 384-393 and 395-396 (`Sophie`), 433-448 (`Susan`), 470-477 (`Edip`),
  496-497 (`Raymond`). File 11 is the best remaining target for the diarization pipeline:
  561 rows, six named participants, and unlike the 1987 debate the names appear in the text
  at the moments they speak, so clusters could be attached to real names.

- **File 05 repeats itself** for about 4m49s: `00:57:56` - `01:02:45` plays again at
  `01:14:39` - `01:19:15` (B.3). This is a defect in the source video, and the transcript
  records faithfully what the video does. Trimming it would mean re-cutting the upload, not
  editing the transcript. Left as-is deliberately.
- **The debate's individual scholars are unnamed in the data.** Diarization does resolve
  the scholars' side into two distinct voices, and the evidence points to the principal one
  being Sheikh Abdul Aziz, but at p = 0.06 that is not firm enough to write into the
  archive (F.5). Note also that "Essam" appears only in the English translation and nowhere
  in the Arabic, so it is not independent evidence.
- **101 debate rows carry no speaker** and should stay that way. 36 are ellipsis-only and
  42 have under 1.2s of single-voice audio (F.6).
- **`data/sources/playlists/audio-transcripts/` still holds 623 non-breaking spaces** in 6
  of its 102 files. The same fix applies; it was left out because this review is scoped to
  video transcripts.

---

# Part F: Acoustic Cross-Check of the Debate Attribution

Part D attributed the debate from theological content alone and said the result "can be
overturned by ear". This part does that check with speaker-embedding diarization on the
actual audio. Pipeline and reproduction steps: `scripts/analysis/debate-diarization/`.

## F.1 What was run, and why not WhisperX

**ASR was not needed and would have hurt.** WhisperX transcribes and then force-aligns.
Both transcripts already exist, hand-made, and the spoken language is Arabic, where Whisper
is clearly worse than the transcript already on disk. The caption timings also track the
speech better than a VAD would. Only the diarization half was an open question: *who*
speaks in each already-known window. So segmentation and ASR were both skipped, and every
existing caption window was embedded directly.

**Both pyannote pipelines are gated.** `pyannote/speaker-diarization-3.1` and
`-community-1` return `GatedRepoError` for this machine's `HF_TOKEN`, whose account has not
accepted their conditions. Accepting licence terms on the owner's behalf is not appropriate,
so the method was kept and the model swapped: SpeechBrain ECAPA-TDNN
(`speechbrain/spkrec-ecapa-voxceleb`, ungated) for embeddings, then the standard
centre / PCA / cluster recipe.

Audio: `yt-dlp` with the `web_embedded` client (the default `android_vr` and four other
clients all returned HTTP 403 under YouTube's current SABR gating), 44:52 at 16 kHz mono.

## F.2 The embeddings carry real speaker signal

Before clustering anything, a check that ECAPA works at all on a 1987 single-microphone
room recording of several men speaking one language: are same-side segment pairs more
similar than different-side pairs?

| Min duration | Same-side | Different-side | AUC |
|---|---|---|---|
| 0.8s | +0.072 | -0.073 | 0.739 |
| **1.5s** | **+0.085** | **-0.087** | **0.764** |
| 2.5s | +0.094 | -0.102 | 0.756 |
| 4.0s | +0.082 | -0.149 | 0.768 |

AUC 0.76 against a chance value of 0.50. Mean-centring the embeddings was essential
(0.68 -> 0.76): all segments come from one recording, so the shared session and channel
direction is pure nuisance and subtracting it recovers the speaker direction.

This is already an independent result. If the Part D labels were noise, AUC would sit at
0.50 regardless of how good the embeddings were.

## F.3 The two sides: 90.7% agreement

Mean-centre, PCA to 60 dims, k-means with k=2, on Arabic windows of at least 1.5s. **The
clustering never sees the `Speaker` column**; it is read only to score afterwards.

| acoustic \ text | Dr. Rashad Khalifa | Sunni Scholars |
|---|---|---|
| **Dr. Rashad Khalifa** | **344** | 41 |
| **Sunni Scholars** | 34 | **384** |

**728 / 803 = 90.7%**, against a 52.9% majority-class baseline. Clusters are balanced
(453/415) and the errors are symmetric (41 vs 34), so there is no systematic pull toward
either side. The 75 disagreements are spread evenly across the recording, between 3% and
13% per five-minute bin, with no region where the attribution collapses.

Temporal smoothing was tried and **lowered** agreement at every setting. That is a finding
rather than a tuning failure: it means genuine speaker changes in this debate really do
last a single caption, which is what a fast interruption-driven argument looks like. The
smoothing was dropped.

## F.4 Why the English transcript scores worse, and why that is not a problem

Running the identical test against the English rows gives only 67.4%. The cause is
measurable, and it is not the attribution:

| File | Windows >= 1.5s | Holding one voice | Holding two | Overlapping cues |
|---|---|---|---|---|
| Arabic | 868 | 868 | **0 (0.0%)** | **0** |
| English | 853 | 639 | **214 (25.1%)** | **392** |

The Arabic captions were cut to the Arabic speech, so each window holds exactly one voice.
The English file is a translation whose cues were laid out to read well, and a quarter of
them span two speakers. A window containing two voices produces a blended embedding that no
clustering can place, which caps the achievable score.

Stratifying the English result by acoustic confidence confirms it:

| k-means margin quartile | Agreement |
|---|---|
| q1 (least confident) | 42.0% |
| q2 | 55.4% |
| q3 | 76.1% |
| **q4 (most confident)** | **93.5%** |

Where the audio is sure, it agrees 93.5% of the time. Where the audio is at chance, it is
because the window itself is acoustically ambiguous. **The Arabic 90.7% is therefore the
figure that means something**, and the disagreements are concentrated in cross-talk rather
than in any systematic misreading.

## F.5 Individual voices, and Sheikh Abdul Aziz

At k=4 the scholars' side resolves into two clearly distinct voices:

| Cluster | Segments | Speech | Cohesion | Reading |
|---|---|---|---|---|
| KHALIFA | 377 | 16.3 min | 0.186 | Khalifa (91% of its labelled rows) |
| SCHOLAR-A | 218 | 10.7 min | 0.429 | principal scholar (7% Khalifa) |
| SCHOLAR-B | 144 | 6.7 min | 0.405 | second scholar (5% Khalifa) |
| MIXED | 129 | 5.8 min | 0.124 | cross-talk; low cohesion, no single voice |

SCHOLAR-A and KHALIFA have centroid similarity **-0.715**, that is, cleanly opposed.
SCHOLAR-A and SCHOLAR-B sit at -0.235: two different men, less sharply separated from each
other than either is from Khalifa.

**SCHOLAR-A is most likely Sheikh Abdul Aziz.** The strongest evidence is a direct
adjacency: the "be honest with me, do you truly believe this" appeal and the "you are a
latecomer to the Arabic language" argument (en 535-563) are SCHOLAR-A throughout, and
Khalifa's reply to exactly that passage is en 564, *"Your Eminence, Sheikh Abdul Aziz ...
you are challenging GOD Almighty"*. He names the man he is answering.

Across all four moments the name is spoken, adjacent scholar speech is SCHOLAR-A 24 times
and SCHOLAR-B 8 times. Three anchors point to A; the fourth (ar 648, *"O Sheikh Abdul Aziz,
so the answer..."*) is followed by Khalifa and then B, so it constrains little. Against a
null where scholar speech splits A/B in proportion to their totals, 24 of 32 gives
**p = 0.06**.

SCHOLAR-B is a distinct second scholar who owns the long Sunna-preservation monologue
(en 480-503), the specialist set-piece on how the hadith corpus was written and preserved.

**Worth knowing: "Essam" is not in the Arabic at all.** `عصام` appears nowhere in the
Arabic transcript. The name exists only in the English translation at en 68 ("Brother Essam
was saying.."), where the Arabic (ar 72) reads just `الاخ كان بيقول ان`, "the brother was
saying that". The translator supplied the name from outside the text. So "Essam" is not
independent evidence of anything, and SCHOLAR-B stays unnamed.

## F.6 What was changed in the data, and what was not

**Not changed: the side labels.** 90.7% agreement means the two methods are comparable in
reliability, not that the acoustic one is authoritative. Where they disagree neither wins,
so overwriting a read attribution with a clustered one would trade one error rate for
another while destroying the independence that makes the cross-check meaningful.

**Not changed: individual names.** Promoting SCHOLAR-A to `Sheikh Abdul Aziz` in the data
would commit the archive to an identification resting on p = 0.06 plus one adjacency, with a
further per-row error rate on top of the A/B split. `Sunni Scholars` remains the honest
label. The finding is recorded here so a future pass, or anyone who can recognise the
voices, can promote it deliberately.

**Changed: 11 rows the text could not settle, which the audio can.** Blanks were resolved
only where the row has real text (not an ellipsis), every overlapping Arabic segment agrees
on one speaker, at least 1.2s of single-voice audio supports it, and that support sits in
the confident half of the margin. 101 rows remain blank; of the 112, 36 were ellipsis-only,
42 had under 1.2s of support, 12 no overlapping audio, 6 low confidence, 5 spanned both
speakers.

The most valuable of the 11: **en 1084-1086** (*"The Prophet (PBUH) said: 'Have you made me
an equal to GOD?' ... During his lifetime he did not accept this ... So how can you now say
this?"*). Part D left this blank as genuinely undecidable, because a hadith cited against
equating Muhammad with God could serve either side. The audio gives it to the **scholars**
with 4.4s of confident single-voice support: they are defending themselves against the
*shirk* charge by pointing out the Prophet refused it too. That is a real resolution of an
acknowledged uncertainty, and it is the kind of thing only the audio could settle.

Every label's provenance is now explicit in `apply_attrib.py`: the `SPANS` table is what
reading established, the `AUDIO_RESOLVED` dict is what the audio established.

---
