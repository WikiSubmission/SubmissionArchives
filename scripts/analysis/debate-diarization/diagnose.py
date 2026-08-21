"""Does ECAPA carry usable speaker signal on this recording at all?

Direct test, independent of any clustering algorithm: if the embeddings encode speaker,
then pairs of segments the text assigns to the SAME side should be more similar than
pairs it assigns to DIFFERENT sides. Reported as an AUC-style separation plus the raw
distributions, at several minimum-duration thresholds.

This is diagnostic only: it uses the text labels to *evaluate the embeddings*, not to
produce an attribution.
"""
import csv
import os
import re
from collections import Counter

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
D = r'C:\Users\Jonathan\Desktop\SA\data\sources\playlists\video-transcripts'
AR = os.path.join(D, 'Debate Dr Rashad Khalifa Ph D vs Sunni Scholars (1987) - Arabic.csv')

z = np.load(os.path.join(HERE, 'embeddings.npz'))
idx, V, durs = z['idx'], z['vecs'], z['durs']
rows = list(csv.reader(open(AR, newline='', encoding='utf-8-sig')))[1:]
lab = np.array([rows[i][5] for i in idx])

for center in (False, True):
    print(f'\n=== mean-centred: {center}')
    for mind in (0.8, 1.5, 2.5, 4.0):
        keep = (durs >= mind) & (lab != '')
        X, L = V[keep], lab[keep]
        if len(X) < 40 or len(set(L)) < 2:
            print(f'  min {mind}s: too few ({len(X)})')
            continue
        if center:
            X = X - X.mean(axis=0)
            X = X / np.linalg.norm(X, axis=1, keepdims=True)
        Sm = X @ X.T
        same = (L[:, None] == L[None, :])
        iu = np.triu_indices(len(X), k=1)
        s_same = Sm[iu][same[iu]]
        s_diff = Sm[iu][~same[iu]]
        # AUC = P(random same-pair more similar than random diff-pair)
        allv = np.concatenate([s_same, s_diff])
        order = allv.argsort()
        ranks = np.empty(len(allv)); ranks[order] = np.arange(1, len(allv) + 1)
        n1, n2 = len(s_same), len(s_diff)
        auc = (ranks[:n1].sum() - n1 * (n1 + 1) / 2) / (n1 * n2)
        print(f'  min {mind}s  n={len(X):4d}  same={s_same.mean():+.4f}  '
              f'diff={s_diff.mean():+.4f}  gap={s_same.mean()-s_diff.mean():+.4f}  AUC={auc:.4f}')
        print(f'            counts {dict(Counter(L))}')
