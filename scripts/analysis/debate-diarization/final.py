"""Definitive acoustic cross-check of the 1987 debate attribution.

Config chosen by the sweep in cluster2.py: mean-centre the ECAPA embeddings (removes the
shared session/channel direction), PCA to 60 dims, k-means. No temporal smoothing: the
sweep showed smoothing *lowers* agreement, meaning genuine speaker changes in this debate
really are single-segment, which is what a fast cross-talk argument looks like.

The clustering never sees the Speaker column. It is read only to score afterwards.
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
MIND = 1.5


def sec(t):
    m = re.match(r'(\d+):(\d+):(\d+)\.(\d+)', t.strip())
    return int(m[1]) * 3600 + int(m[2]) * 60 + int(m[3]) + int(m[4]) / 1000


def hms(s):
    return f'{int(s//3600):02d}:{int(s%3600//60):02d}:{int(s%60):02d}'


z = np.load(os.path.join(HERE, 'embeddings.npz'))
idx, V, durs = z['idx'], z['vecs'], z['durs']
rows = list(csv.reader(open(AR, newline='', encoding='utf-8-sig')))[1:]
lab_all = np.array([rows[i][5] for i in idx])

keep = durs >= MIND
I, L = idx[keep], lab_all[keep]
X = V[keep] - V[keep].mean(axis=0)
X = X / np.linalg.norm(X, axis=1, keepdims=True)
Xr = PCA(n_components=60, random_state=0).fit_transform(X)
Xr = Xr / np.linalg.norm(Xr, axis=1, keepdims=True)
times = np.array([sec(rows[i][2]) for i in I])

print(f'Segments >= {MIND}s: {len(I)}  (of {len(rows)} rows). Text-labelled: {(L!="").sum()}')

# ---------- k=2: the two sides ----------
pred = KMeans(n_clusters=2, n_init=25, random_state=0).fit_predict(Xr)
mapping = {}
for c in set(pred):
    votes = Counter(L[i] for i in range(len(pred)) if pred[i] == c and L[i])
    mapping[c] = votes.most_common(1)[0][0]
print('\n=== k=2 acoustic clusters vs text attribution ===')
print('cluster -> dominant text label:', {int(c): v for c, v in mapping.items()})

conf = defaultdict(Counter)
for i in range(len(pred)):
    if L[i]:
        conf[mapping[pred[i]]][L[i]] += 1
names = ['Dr. Rashad Khalifa', 'Sunni Scholars']
hdr = 'acoustic vs text'
print(f'\n{hdr:24s} {names[0]:>20s} {names[1]:>16s}')
ok = tot = 0
for a in names:
    r = conf[a]
    print(f'{a:24s} {r[names[0]]:>20d} {r[names[1]]:>16d}')
    ok += r[a]
    tot += sum(r.values())
print(f'\nAGREEMENT: {ok}/{tot} = {100*ok/tot:.1f}%')
maj = max(Counter(L[L != '']).values()) / (L != '').sum()
print(f'majority-class baseline: {100*maj:.1f}%   cluster sizes: {sorted(Counter(pred).values(), reverse=True)}')

# where do the disagreements sit in time?
dis = [(times[i], I[i], L[i], mapping[pred[i]]) for i in range(len(pred))
       if L[i] and mapping[pred[i]] != L[i]]
print(f'\n{len(dis)} disagreements. Distribution across the recording (5-min bins):')
bins = Counter(int(t // 300) for t, *_ in dis)
tot_bins = Counter(int(times[i] // 300) for i in range(len(pred)) if L[i])
for b in sorted(tot_bins):
    n, d = bins.get(b, 0), tot_bins[b]
    bar = '#' * int(round(30 * n / max(1, d)))
    print(f'  {hms(b*300)}-{hms(b*300+300)}  {n:3d}/{d:3d}  {bar}')

np.savez(os.path.join(HERE, 'final.npz'), I=I, pred=pred, times=times,
         L=L, map0=mapping[0], map1=mapping[1], Xr=Xr)

# ---------- more clusters: does the scholar side split into individuals? ----------
print('\n=== k=4: does the scholars side resolve into individuals? ===')
p4 = KMeans(n_clusters=4, n_init=25, random_state=0).fit_predict(Xr)
for c in sorted(set(p4)):
    m = p4 == c
    v = Counter(L[m][L[m] != ''])
    tot_c = m.sum()
    khal = v.get('Dr. Rashad Khalifa', 0)
    sch = v.get('Sunni Scholars', 0)
    share = khal / max(1, khal + sch)
    print(f'  cluster {c}: n={tot_c:4d}  khalifa={khal:4d} scholars={sch:4d}  '
          f'khalifa-share={share:.2f}  median-dur={np.median(durs[keep][m]):.1f}s')
np.save(os.path.join(HERE, 'p4.npy'), p4)
