# Audio descriptions and TOCs

**Complete: 72 / 72.** Quran Studies 1-52 and Messenger Audios 53-72.

Held to the standard measured off the 50 hand-written video transcripts: description
median 1,287 chars, TOC median 54 entries per hour, and every TOC entry anchored so that
`TOC Time` equals its own row's `Start Time`.

## How it is stored

Identical to the videos. `Description` / `TOC Time` / `TOC Title` columns live inside the
transcript CSV, appended after the existing columns so header-keyed readers are unaffected.
`scripts/generate/enrich_audio_catalog.mjs` harvests them into `data/catalog/audios.json`
and fails the build on any anchoring mismatch.

## How it was generated

`scripts/generate/generate_audio_descriptions.mjs`, via the Gemini API. Every timestamp the
model returns is snapped onto the nearest real caption row and written as that row's exact
`Start Time`, so the anchoring invariant holds mechanically rather than on trust. A record
that cannot produce a usable TOC is reported and left untouched; there is no algorithmic
fallback, which is what filled the previous sidecars with uniform time slices.

| Record | Words | Description chars | TOC entries | Anchored |
|---|---|---|---|---|
| QS 01 | 11,565 | 1513 | 89 | yes |
| QS 02 | 11,290 | 1839 | 69 | yes |
| QS 03 | 13,144 | 1584 | 76 | yes |
| QS 04 | 15,954 | 1651 | 86 | yes |
| QS 05 | 7,133 | 1668 | 47 | yes |
| QS 06 | 10,236 | 1688 | 66 | yes |
| QS 07 | 12,015 | 1442 | 56 | yes |
| QS 08 | 9,170 | 1627 | 50 | yes |
| QS 09 | 9,527 | 1407 | 71 | yes |
| QS 10 | 13,450 | 1511 | 78 | yes |
| QS 11 | 7,929 | 1358 | 54 | yes |
| QS 12 | 13,811 | 1735 | 79 | yes |
| QS 13 | 14,896 | 1623 | 89 | yes |
| QS 14 | 3,013 | 1127 | 65 | yes |
| QS 15 | 12,645 | 1178 | 73 | yes |
| QS 16 | 11,617 | 1584 | 81 | yes |
| QS 17 | 10,997 | 1491 | 71 | yes |
| QS 18 | 11,855 | 1519 | 69 | yes |
| QS 19 | 12,110 | 1097 | 51 | yes |
| QS 20 | 8,543 | 1347 | 54 | yes |
| QS 21 | 6,339 | 1116 | 39 | yes |
| QS 22 | 8,498 | 1220 | 51 | yes |
| QS 23 | 7,927 | 1187 | 54 | yes |
| QS 24 | 13,311 | 1607 | 24 | yes |
| QS 25 | 8,079 | 1146 | 56 | yes |
| QS 26 | 8,450 | 1235 | 47 | yes |
| QS 27 | 12,282 | 1370 | 59 | yes |
| QS 28 | 9,244 | 1348 | 55 | yes |
| QS 29 | 9,757 | 1097 | 52 | yes |
| QS 30 | 13,427 | 1268 | 70 | yes |
| QS 31 | 9,784 | 1311 | 43 | yes |
| QS 32 | 1,946 | 1248 | 11 | yes |
| QS 33 | 11,688 | 1244 | 50 | yes |
| QS 34 | 14,311 | 1440 | 53 | yes |
| QS 35 | 15,244 | 1244 | 71 | yes |
| QS 36 | 8,335 | 1323 | 52 | yes |
| QS 37 | 17,697 | 1323 | 51 | yes |
| QS 38 | 10,737 | 1001 | 59 | yes |
| QS 39 | 14,091 | 1506 | 61 | yes |
| QS 40 | 9,123 | 1277 | 51 | yes |
| QS 41 | 7,134 | 1280 | 46 | yes |
| QS 42 | 7,930 | 1416 | 45 | yes |
| QS 43 | 12,155 | 1146 | 15 | yes |
| QS 44 | 11,583 | 1249 | 50 | yes |
| QS 45 | 12,545 | 1073 | 59 | yes |
| QS 46 | 11,163 | 1295 | 65 | yes |
| QS 47 | 12,391 | 1315 | 66 | yes |
| QS 48 | 14,873 | 954 | 57 | yes |
| QS 49 | 6,208 | 1123 | 37 | yes |
| QS 50 | 8,899 | 1590 | 56 | yes |
| QS 51 | 6,748 | 1205 | 42 | yes |
| QS 52 | 2,405 | 1222 | 16 | yes |
| MA 53 | 4,667 | 1562 | 46 | yes |
| MA 54 | 9,642 | 1390 | 55 | yes |
| MA 55 | 603 | 1041 | 19 | yes |
| MA 56 | 8,800 | 1531 | 59 | yes |
| MA 57 | 5,948 | 1292 | 28 | yes |
| MA 58 | 4,546 | 1312 | 29 | yes |
| MA 59 | 2,795 | 1505 | 21 | yes |
| MA 60 | 6,718 | 1300 | 43 | yes |
| MA 61 | 10,416 | 1525 | 70 | yes |
| MA 62 | 8,494 | 1616 | 54 | yes |
| MA 63 | 7,927 | 1526 | 54 | yes |
| MA 64 | 10,427 | 1414 | 63 | yes |
| MA 65 | 9,438 | 1350 | 59 | yes |
| MA 66 | 8,452 | 1703 | 61 | yes |
| MA 67 | 5,854 | 1625 | 36 | yes |
| MA 68 | 4,287 | 1281 | 54 | yes |
| MA 69 | 7,005 | 1507 | 49 | yes |
| MA 70 | 8,060 | 1493 | 54 | yes |
| MA 71 | 6,621 | 1378 | 43 | yes |
| MA 72 | 7,873 | 1384 | 59 | yes |

Totals: 3,893 TOC entries. Description chars median 1354 (min 954, max 1839). TOC per record median 54 (min 11, max 89). Anchoring mismatches: 0.
