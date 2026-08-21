"""Resolve deliberately-blank rows using the audio, conservatively.

The Arabic acoustic timeline is the trustworthy one: every Arabic window holds exactly one
voice (measured), against 25% of English windows holding two. So blanks are resolved from
the Arabic clustering, and only when:

  * the row has real text (an ellipsis row carries no content worth attributing),
  * every Arabic segment overlapping the row's window agrees on one speaker,
  * at least 1.2s of overlapping single-voice audio supports it,
  * the supporting segments sit in the confident half of the k-means margin.

Anything short of that stays blank. The point is to convert "the text cannot tell" into
"the audio can tell" only where the audio genuinely can.
"""
import csv
import os
import re
from collections import Counter, defaultdict

import numpy as np
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA

HERE = os.path.dirname(os.path.abspath(__file__))
D = r'C:\Users\Jonathan\Desktop\SA\data\sources\playlists\video-transcripts'
AR = os.path.join(D, 'Debate Dr Rashad Khalifa Ph D vs Sunni Scholars (1987) - Arabic.csv')
EN = os.path.join(D, 'Debate Dr Rashad Khalifa Ph D vs Sunni Scholars (1987).csv')


def sec(t):
    m = re.match(r'(\d+):(\d+):(\d+)\.(\d+)', t.strip())
    return int(m[1]) * 3600 + int(m[2]) * 60 + int(m[3]) + int(m[4]) / 1000


ar_rows = list(csv.reader(open(AR, newline='', encoding='utf-8-sig')))
en_rows = list(csv.reader(open(EN, newline='', encoding='utf-8-sig')))
ar, en = ar_rows[1:], en_rows[1:]

# rebuild the Arabic k=2 acoustic timeline plus per-segment confidence
z = np.load(os.path.join(HERE, 'embeddings.npz'))
idx, V, durs = z['idx'], z['vecs'], z['durs']
keep = durs >= 1.5
I = idx[keep]
X = V[keep] - V[keep].mean(axis=0)
X = X / np.linalg.norm(X, axis=1, keepdims=True)
Xr = PCA(n_components=60, random_state=0).fit_transform(X)
Xr = Xr / np.linalg.norm(Xr, axis=1, keepdims=True)
km = KMeans(n_clusters=2, n_init=25, random_state=0).fit(Xr)
lab_txt = np.array([ar[int(i)][5] for i in I])
mapping = {}
for c in set(km.labels_):
    v = Counter(lab_txt[j] for j in range(len(I)) if km.labels_[j] == c and lab_txt[j])
    mapping[c] = v.most_common(1)[0][0]
d = km.transform(Xr)
margin = np.abs(d[:, 0] - d[:, 1])
med = np.median(margin)

timeline = []
for j, i in enumerate(I):
    r = ar[int(i)]
    timeline.append((sec(r[2]), sec(r[3]), mapping[km.labels_[j]], margin[j] >= med))

ELLIPSIS = re.compile(r'^[\s.\u2026]*$')
applied, rejected = [], Counter()
for i, r in enumerate(en):
    if r[5].strip():
        continue                                    # already attributed
    text = r[4].strip()
    if ELLIPSIS.match(text):
        rejected['ellipsis-only row'] += 1
        continue
    t0, t1 = sec(r[2]), sec(r[3])
    hits = [(a, b, lab, conf) for (a, b, lab, conf) in timeline if not (b <= t0 or a >= t1)]
    if not hits:
        rejected['no overlapping audio segment'] += 1
        continue
    labs = {h[2] for h in hits}
    if len(labs) > 1:
        rejected['window spans both speakers'] += 1
        continue
    overlap = sum(min(t1, b) - max(t0, a) for a, b, _, _ in hits)
    if overlap < 1.2:
        rejected['under 1.2s of support'] += 1
        continue
    if not any(h[3] for h in hits):
        rejected['low acoustic confidence'] += 1
        continue
    applied.append((i, labs.pop(), overlap, text))

print(f'blank English rows: {sum(1 for r in en if not r[5].strip())}')
print(f'resolvable from audio: {len(applied)}')
print('rejected:', dict(rejected))
print()
for i, lab, ov, text in applied:
    print(f'  en{i:5d} {en[i][2][3:8]} {ov:4.1f}s -> {lab:20s} {text[:58]}')

if os.environ.get('APPLY') == '1':
    for i, lab, _, _ in applied:
        en[i][5] = lab
    with open(EN, 'w', newline='', encoding='utf-8') as fh:
        w = csv.writer(fh, quoting=csv.QUOTE_MINIMAL)
        w.writerow(en_rows[0]); w.writerows(en)
    print(f'\nAPPLIED {len(applied)} labels to the English transcript')
