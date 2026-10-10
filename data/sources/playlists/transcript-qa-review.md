# Transcript QA review

Reviewed the transcript collections under `data/sources/playlists` and the standalone transcript JSONs in the related editorial-source folders. The review focused on text consistency, speaker attribution, cue timing, and obvious title metadata issues. The source transcripts are unchanged.

## Coverage

- **74 audio playlist CSVs** in `audio-transcripts` (55 filenames include “Quran Study”; five are labeled “MA 70–74 – Messenger Audio”). The folder also contains sermon and zikr transcripts.
- **52 video playlist CSVs** in `video-transcripts`.
- **3 standalone JSON transcript records**: one Quran Study #20 transcript and Messenger Audio/sermon records #64 and #68. The #68 JSON is an exact duplicate stored in two editorial folders.
- The Quran Study #20 JSON is a parallel transcript representation of the playlist recording with the same title.

## Findings to review

### 1. Speaker field is blank in two debate CSVs

- `video-transcripts/Debate Dr Rashad Khalifa Ph D vs Sunni Scholars (1987).csv`: 101 cues have an empty `Speaker` field.
- `video-transcripts/Debate Dr Rashad Khalifa Ph D vs Sunni Scholars (1987) - Arabic.csv`: 103 cues have an empty `Speaker` field.

The English cues sometimes include speaker names inside `Text`; the Arabic version often has subtitle text without a named speaker. Decide whether to populate speaker fields from the cue text/audio or leave these cues explicitly unidentified.

### 2. Speaker field conflicts with text label in five Quran-study cues

These are direct label conflicts to check against the recording:

| File | CSV row | `Speaker` field | Text begins |
|---|---:|---|---|
| `04 - Quran Study From Azhar 4 … .csv` | 1321 | A man | `Dr. Khalifa:: No, no, it's an odd-shaped rock.` |
| `25 - Quran Study From Behrouz … .csv` | 126 | A man | `Dr. Khalifa:. Yes.` |
| `35 - Quran Study From Parivash … .csv` | 227 | Dr. Khalifa | `A woman:What is the chemical...` |
| `43 - Quran Study From Roxana … .csv` | 196, 198 | Dr. Khalifa | `Farhad Mo'ini: Farhad` |

In video #06, 211 cues use `Dr. Khalifa:` in `Text` while the structured `Speaker` value is `Dr. Rashad Khalifa`. These identify the same person; choose a consistent convention for the text prefix and speaker field.

### 3. One Messenger Audio cue spans over 20 minutes as “unintelligible”

In `editorial-sources/gaddafi-the-downfall-marked-by-19/messenger-audio/messenger-audio-68-friday-sermon-17-dec-1982.json`, the cue from **00:00:11.360 to 00:20:37.520** is assigned to `A man` and transcribed only as `(unintelligible)`. The recording is warped; `(unintelligible)` is the best-effort rendering of the degraded audio and is retained as intentional. The same JSON is duplicated byte-for-byte in the Ahmed Deedat editorial source folder.

### 4. Empty speaker labels in the audio playlist

There are 25 blank `Speaker` values across the 74 audio CSVs: three opening/recitation cues in Quran Study #17, two scripture cues in Quran Study #31, and 20 cues in the standalone Zikr recording. Some may be intentional recitations; confirm the convention and label where a speaker is identifiable.

### 5. House spelling varies in transcript text

Across the audio and video CSV text fields, common variants include:

| Term | Forms and counts (case-insensitive) |
|---|---|
| Chapter name | `Sura` 941; `Surah` 1,066 |
| Prayer | `Salat` 338; `Salah` 10 |
| Divine name | `God` 11,115; `GOD` 1,225; lowercase `god` 500 |
| Quran | `Quran` 4,168; no `Qur'an`/`Qur’an` spelling found in these CSV text fields |

Some capitalization may reflect quoted translation or editorial preference. Choose a house style and normalize only where it does not alter a quotation or source wording.

### 6. Video collection numbering skips #38

The video transcript filenames go from #37 to #39. Confirm whether #38 is missing or the numbering was intentionally carried over from another list.

### 7. Three video cue start times are slightly out of row order

The English Sunni Scholars debate CSV has three small start-time regressions (maximum 1.2 seconds): rows 221, 337, and 398. All inspected CSV cue intervals have valid time values and nonnegative durations. Many intervals overlap the preceding cue, which may reflect overlapping speech; those overlaps alone are not evidence of an error.

### 8. Filename/title metadata typo candidates

These are in source filenames, not confirmed spoken-word errors:

- Audio #04: `Astroid` likely should be `Asteroid`.
- Audio #44: `Surgons` likely should be `Surgeons`.
- Audio #50 ends in `07 27 198`; check whether the year was truncated (likely 1989 from the surrounding recording set).

## Limits

This pass checked the transcript text and structure, not every spoken word against the original audio. Names, Arabic transliterations, and uncertain phrases should be verified against the recording before correction. Messenger Audio #68 is known to be warped, and its long unintelligible cue reflects that source condition. No original transcript content has been changed.
