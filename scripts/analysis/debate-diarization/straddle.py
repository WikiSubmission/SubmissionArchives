"""Why does the English cross-check score worse than the Arabic one on the same audio?

Hypothesis: the Arabic captions were cut to the Arabic speech, so each window holds one
voice. The English file is a translation whose cues were laid out to read well (it has 392
overlapping cues from interleaved cross-talk), so a window more often spans two voices.
A window holding two voices yields a blended embedding, which no clustering can place.

Test: for every window in each file, count how many DISTINCT acoustic speakers the
Arabic-derived timeline says are active inside it.
"""
import csv
import os
import re
from collections import Counter

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
D = r'C:\Users\Jonathan\Desktop\SA\data\sources\playlists\video-transcripts'
AR = os.path.join(D, 'Debate Dr Rashad Khalifa Ph D vs Sunni Scholars (1987) - Arabic.csv')
EN = os.path.join(D, 'Debate Dr Rashad Khalifa Ph D vs Sunni Scholars (1987).csv')


def sec(t):
    m = re.match(r'(\d+):(\d+):(\d+)\.(\d+)', t.strip())
    return int(m[1]) * 3600 + int(m[2]) * 60 + int(m[3]) + int(m[4]) / 1000


ar = list(csv.reader(open(AR, newline='', encoding='utf-8-sig')))[1:]
en = list(csv.reader(open(EN, newline='', encoding='utf-8-sig')))[1:]

# Reference speaker timeline from the Arabic k=2 acoustic result (well-aligned windows).
f = np.load(os.path.join(HERE, 'final.npz'), allow_pickle=True)
I, pred = f['I'], f['pred']
map0, map1 = str(f['map0']), str(f['map1'])
tl = []   # (t0, t1, acoustic label)
for j, r in enumerate(I):
    row = ar[int(r)]
    tl.append((sec(row[2]), sec(row[3]), map0 if pred[j] == 0 else map1))
tl.sort()


def voices_in(t0, t1):
    return {lab for (a, b, lab) in tl if not (b <= t0 or a >= t1)}


print(f'{"file":10s} {"windows":>8s} {"1 voice":>9s} {"2 voices":>9s} {"pct 2+":>8s} {"median dur":>11s}')
for tag, rows in (('Arabic', ar), ('English', en)):
    c = Counter()
    durs = []
    for r in rows:
        t0, t1 = sec(r[2]), sec(r[3])
        if t1 - t0 < 1.5:
            continue
        durs.append(t1 - t0)
        c[min(2, len(voices_in(t0, t1)))] += 1
    n = c[1] + c[2]
    print(f'{tag:10s} {n:>8d} {c[1]:>9d} {c[2]:>9d} {100*c[2]/n:>7.1f}% {np.median(durs):>10.2f}s')

# also: raw cue overlap inside each file
for tag, rows in (('Arabic', ar), ('English', en)):
    ov = 0
    for i in range(1, len(rows)):
        if sec(rows[i][2]) + 0.001 < sec(rows[i - 1][3]):
            ov += 1
    print(f'{tag}: {ov} cues start before the previous cue ends')
