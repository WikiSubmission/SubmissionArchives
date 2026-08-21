# Debate speaker diarization

Acoustic cross-check of the speaker attribution in the 1987 Sunni Scholars debate
(`iRB21i_238Q`). Findings and confidence levels are written up in
[`docs/TRANSCRIPT_REVIEW_2026-08-19.md`](../../../docs/TRANSCRIPT_REVIEW_2026-08-19.md)
Parts D and F. This directory is the reproducible pipeline behind Part F.

## Why not WhisperX or the pyannote pipeline

Neither was the right tool here.

**ASR was unnecessary.** WhisperX exists to transcribe and then align. Both transcripts
already exist, hand-made, with timings that track the audio better than a VAD would, and
the spoken language is Arabic where Whisper is markedly weaker than the human transcript on
disk. Running ASR would have replaced good data with worse data. Only the diarization half
of the problem was open: *who* speaks in each already-known window.

**`pyannote/speaker-diarization-3.1` and `-community-1` are gated.** Both return
`GatedRepoError` for this machine's `HF_TOKEN`; the account has not accepted their
conditions, and accepting terms on someone's behalf is not something a tool should do.

So the pipeline keeps pyannote's *method* and swaps the gated model for an ungated one:
SpeechBrain ECAPA-TDNN (`speechbrain/spkrec-ecapa-voxceleb`) for embeddings, then the
standard centre / reduce / cluster recipe. Segmentation is skipped entirely, because the
caption files already provide better boundaries than a segmentation model would.

## Pipeline

| Step | Script | What it does |
|---|---|---|
| 1 | — | `yt-dlp --js-runtimes node --extractor-args "youtube:player_client=web_embedded" -f 140`, then `ffmpeg -ar 16000 -ac 1` |
| 2 | `embed.py [ar\|en]` | One 192-d ECAPA embedding per caption window over `MIN_DUR` |
| 3 | `diagnose.py` | Is there speaker signal at all? Same-side vs different-side similarity, as AUC |
| 4 | `final.py` | Centre, PCA-60, k-means. Confusion matrix against the text attribution, and k=4 for individual voices |
| 5 | `straddle.py` | Why Arabic windows score better than English ones: how many voices each window contains |
| 6 | `naming2.py` | Tests `SCHOLAR-A == Sheikh Abdul Aziz` against the vocative anchors |
| 7 | `resolve.py` | Resolves text-blank rows from the audio, conservatively. `APPLY=1` writes |
| 8 | `apply_attrib.py` | Writes both label layers: `attrib.py` SPANS (from reading) + `AUDIO_RESOLVED` (from audio) |

`attrib.py` holds the row-range table produced by reading the whole English translation.
It is the record of the text-based attribution and is deliberately separate from anything
acoustic, so the two lines of evidence stay independent.

## Environment

Needs its own venv: the repo's default Python is 3.14, which the speech stack does not
support yet.

```bash
uv venv --python 3.11 dia
uv pip install --python dia/Scripts/python.exe speechbrain scikit-learn soundfile
```

## Headline numbers

- Embeddings carry real speaker signal: **AUC 0.76** (chance 0.50) at >= 1.5s, after
  mean-centring.
- Acoustic k=2 vs the text attribution on Arabic rows: **90.7%** (728/803), against a
  52.9% majority baseline, errors balanced 41/34.
- On English rows the same test gives only 67.4%, because **25.1% of English windows span
  two voices against 0% of Arabic windows** (the English cues were laid out for readable
  translation and 392 of them overlap). Restricted to the most acoustically confident
  quartile, English agreement is **93.5%**.
- At k=4 the scholars' side resolves into two distinct voices, cohesion 0.43 and 0.41,
  centroid similarity -0.24.
