"""Segment-constrained speaker embedding for the 1987 debate.

Rather than run a generic diarization pipeline (segmentation + embedding + clustering),
this embeds the caption segments that already exist on disk. The boundaries in the Arabic
transcript were made by a human transcriber, so they are better speech boundaries than a
VAD would produce, and they are exactly the units the attribution needs a verdict for.

Uses SpeechBrain ECAPA-TDNN (speechbrain/spkrec-ecapa-voxceleb), which is ungated.
Deliberately reads NOTHING from the Speaker column, so the result is an independent test.

Output: embeddings.npz with one 192-d vector per usable segment.
"""
import csv
import os
import re
import sys

import numpy as np
import soundfile as sf
import torch
from speechbrain.inference.speaker import EncoderClassifier

SR = 16000
MIN_DUR = 0.8      # below this an ECAPA embedding is not trustworthy
PAD = 0.10         # widen each window slightly; caption starts often clip the first phone

HERE = os.path.dirname(os.path.abspath(__file__))
WAV = os.path.join(HERE, 'debate.wav')
_D = r'C:\Users\Jonathan\Desktop\SA\data\sources\playlists\video-transcripts'
_which = sys.argv[1] if len(sys.argv) > 1 else 'ar'
AR = os.path.join(_D, 'Debate Dr Rashad Khalifa Ph D vs Sunni Scholars (1987)'
                  + (' - Arabic.csv' if _which == 'ar' else '.csv'))
OUT = 'embeddings.npz' if _which == 'ar' else 'embeddings_en.npz'


def sec(t):
    m = re.match(r'(\d+):(\d+):(\d+)\.(\d+)', t.strip())
    return int(m[1]) * 3600 + int(m[2]) * 60 + int(m[3]) + int(m[4]) / 1000


def main():
    rows = list(csv.reader(open(AR, newline='', encoding='utf-8-sig')))[1:]
    audio, sr = sf.read(WAV, dtype='float32')
    assert sr == SR, sr
    print(f'audio {len(audio)/sr:.1f}s, segments {len(rows)}', flush=True)

    enc = EncoderClassifier.from_hparams(
        source='speechbrain/spkrec-ecapa-voxceleb',
        savedir=os.path.join(HERE, 'ecapa'),
        run_opts={'device': 'cpu'},
    )

    idx, vecs, durs = [], [], []
    skipped = 0
    for i, r in enumerate(rows):
        t0, t1 = sec(r[2]), sec(r[3])
        if t1 - t0 < MIN_DUR:
            skipped += 1
            continue
        a = max(0, int((t0 - PAD) * sr))
        b = min(len(audio), int((t1 + PAD) * sr))
        clip = audio[a:b]
        if len(clip) < int(MIN_DUR * sr):
            skipped += 1
            continue
        with torch.no_grad():
            e = enc.encode_batch(torch.from_numpy(clip).unsqueeze(0)).squeeze().numpy()
        idx.append(i)
        vecs.append(e)
        durs.append(t1 - t0)
        if len(idx) % 150 == 0:
            print(f'  {len(idx)} embedded', flush=True)

    V = np.stack(vecs)
    V = V / np.linalg.norm(V, axis=1, keepdims=True)
    np.savez(os.path.join(HERE, OUT),
             idx=np.array(idx), vecs=V, durs=np.array(durs))
    print(f'embedded {len(idx)} segments, skipped {skipped} (< {MIN_DUR}s)')


if __name__ == '__main__':
    main()
