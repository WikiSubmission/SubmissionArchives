# Video Transcript Review: Speaker Labels and Duplicate Recordings

Date: 2026-08-19
Scope: `data/sources/playlists/video-transcripts/` (53 CSV files, 17,764 caption rows)

This document records two classes of finding that came out of the description/TOC pass:

1. **Speaker-label defects** in the multi-speaker conference and Q&A transcripts.
2. **Duplicate and overlapping audio** between separate catalog entries.

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

## A.3 File 10: SUSPECTED, NEEDS YOUR VERIFICATION

File: `10 - United Submitters International Conference Explaining the Fulfillment of the Covenant (1988).csv`
Duration: `00:00:08` to `00:18:54`. 190 rows.
Current label counts: `Dr. Rashad Khalifa` 115, `Ismail` 56, `Azhar` 19.

Six rows in this file carry an explicit inline prefix. Those six are the only rows I can
confirm from the text alone:

| Row | Timestamp | Label | Text |
|---|---|---|---|
| 115 | `00:10:34.866` | Ismail | `Ismail: Of course! What are you talking about?!` |
| 152 | `00:15:06.671` | Ismail | `Ismail: They are trying to discredit you.` |
| 163 | `00:16:22.225` | Ismail | `Ismail: Except that God spelled it correctly.` |
| 167 | `00:16:46.053` | Ismail | `Ismail: OK. We have time for a couple more questions.` |
| 169 | `00:16:52.383` | Azhar | `Azhar: I just want you to come back on... there are a lot of verses that say the messenger has been destined to prevail, so that Islam will prevail over all religions. Can you just come back on that?` |
| 188 | `00:18:40.738` | Ismail | `Ismail: Don't forget Mexico and Latin America.` |

Every one of those six is a short interjection: an exclamation, an aside, a moderator cue,
or a question. None of them opens a long turn. Yet the labels propagated from them cover
75 rows in total.

### Proposed corrections

Each block below is a run currently labelled with an interjector's name where the text
reads as Khalifa continuing or answering.

| Rows | Time range | Currently | Should be | Evidence at the boundary |
|---|---|---|---|---|
| 116 - 151 | `00:10:47.010` - `00:15:04.620` | `Ismail` | `Dr. Rashad Khalifa` | Row 115 is Ismail's one-line exclamation. Row 116 is `"So, it may take time, but I'd like to read it correctly. It's right here."` and row 117 is `"It's very possible that I misplaced the verse, but I can't find it in SURA 40..."`. Khalifa is the one searching for and reading the verse. Row 151 ends `"to do is that his name is not Rashad."` |
| 153 - 162 | `00:15:10.766` - `00:16:12.690` | `Ismail` | `Dr. Rashad Khalifa` | Row 152 is Ismail's aside `"They are trying to discredit you."` Row 153 replies `"But they cannot come up with"`, continuing into the KATHAB/KAZZAB spelling argument that ends at row 162 with `"...exactly what God wrote in the Quran in SURA 38 and in SURA 54."` |
| 164 - 166 | `00:16:25.170` - `00:16:36.930` | `Ismail` | `Dr. Rashad Khalifa` | Row 163 is Ismail's `"Except that God spelled it correctly."` Row 164 answers `"Exactly. It's KATHAB not KAZZAB. They cannot do that."` |
| 170 - 187 | `00:17:06.000` - `00:18:33.300` | `Azhar` | `Dr. Rashad Khalifa` | Row 169 is Azhar's complete question, ending with the words `"Can you just come back on that?"` Row 170 begins the answer: `"This is a prophecy in SURA number 9 and SURA number 48..."`, running through Sura 110, Japan and Naoko, ending at row 187 `"...in fulfillment of this prophecy of SURA 9 or SURA 48."` |

**Total: 67 rows across 4 blocks.**

### Rows in this file that should NOT be changed

- Rows 115, 152, 163, 167, 188: genuine `Ismail`, self-identified.
- Row 168 (`00:16:49.508`, `"Brother Azhar has..."`): genuine `Ismail`. He is chairing and
  calling on Azhar, so this correctly continues row 167.
- Row 169: genuine `Azhar`, self-identified.
- Row 189 (`00:18:48.640`, `"We have the whole world covered. I think we'll have a break
  before lunch."`): genuine `Ismail`, continuing his row-188 aside and closing the session.
- Rows 0 - 114: `Dr. Rashad Khalifa`, no change.

### What I need from you

Listen at the four boundary timestamps: `00:10:47`, `00:15:10`, `00:16:25`, `00:17:06`. If
the voice at each of those is Khalifa rather than the questioner, the four blocks above
can be relabelled in one pass, exactly as was done for file 50.

## A.4 File 11: ASSESSED AS CORRECT (earlier flag retracted)

File: `11 - United Submitters International Conference Final Speech by Dr. Rashad Khalifa (1989).csv`
Duration: `00:00:11` to `00:56:40`. 561 rows.

**Correction to an earlier statement of mine.** During the first pass I flagged the `Edip`
label at `00:46:19` in this file as misattributed. **That was wrong.** Row 470 at
`00:46:19.058` begins with an explicit `Edip:` prefix in the text and is correctly
labelled.

I then flagged this file more broadly, on the grounds that it contains twelve multi-row
runs where only the first row carries a `Name:` prefix, matching the file 50 signature.
Reading the content of those runs, they do not match the defect: they are single speakers
delivering long turns from the floor, and the unprefixed rows are continuations of the
prefixed sentence rather than replies to it. Examples:

- Rows 433 - 448 (`Susan`, 16 rows, 15 unprefixed): one continuous statement beginning
  `"Susan: Ok. I just asked you..."` and running to `"It means one line and this is this
  Quran."` This is Susan throughout.
- Rows 384 - 393 (`Sophie`, 10 rows, 9 unprefixed): Sophie's continuous account. Correct.
- Rows 470 - 477 (`Edip`, 8 rows, 6 unprefixed): Edip addressing Susan, beginning
  `"Edip: BISM ALLAH..."` and continuing `"Susan, last year we had a discussion..."`
  Correct.

**Conclusion: no changes proposed for file 11.**

One caveat: this is a read-through judgement, not an audio verification. The candidate
runs, if you ever want them confirmed by ear, are rows 310-313 (`Christie`), 367-369,
384-393, 395-396 (`Sophie`), 402-403, 428-431, 433-448 (`Susan`), 466-468, 470-477,
483-484 (`Edip`), 496-497 (`Raymond`), 537-538 (`Ismail`). I do not consider this a
priority given how clearly the text reads.

## A.5 A false positive to be aware of

The automated prefix check flags rows labelled `A man` and `A woman` as "unprefixed."
This is an artifact: the checker extracts the first word of the label as the name tag, so
it looks for `A:` and never finds it. These labels are deliberate placeholders for
unidentified audience members and are not defects.

## A.6 Method, for reproducing the check

The check that produced the counts above tests, for each row whose `Speaker` is not
`Dr. Rashad Khalifa`, whether the row's own `Text` opens with that speaker's name followed
by a colon. A run where only the first row passes is a *candidate*, not a finding.
Confirmation requires reading whether the following rows continue or reply.

Files with a multi-value `Speaker` column: 10, 11, 50, and the two Sunni Scholars debate
files. The remaining 48 files are single-speaker and were not part of this analysis.

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

# Part C: Summary of Outstanding Items

| # | Item | Owner | Blocking |
|---|---|---|---|
| 1 | Verify the four boundary timestamps in file 10 (`00:10:47`, `00:15:10`, `00:16:25`, `00:17:06`) so 67 rows can be relabelled to `Dr. Rashad Khalifa` | You | Yes, needs audio |
| 2 | Decide whether 02 and 38 should both remain as cards on the videos page | You | Yes, editorial |
| 3 | Decide whether the 4m49s internal repeat at the end of file 05 (`01:14:39` - `01:19:15`) should be trimmed from the source video | You | Yes, editorial |
| 4 | File 11 speaker labels | Assessed as correct, closed | No |
| 5 | File 50 speaker labels | Fixed, closed | No |
| 6 | 03 and 08 containments | Resolved by your trims, verified, closed | No |
| 7 | 16 and 23 mislabelled as duplicates | Corrected in file 23's description, closed | No |

Once item 1 is answered, the relabelling is a single scripted pass on four contiguous row
ranges, identical in shape to the file 50 fix.
