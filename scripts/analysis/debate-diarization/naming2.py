"""Rigorous test of the hypothesis SCHOLAR-A == Sheikh Abdul Aziz.

Evidence classes:
  (a) Vocative adjacency. At every moment the name "Abdul Aziz" is spoken as an address or
      as the target of a reply, which scholar cluster holds the adjacent scholar speech?
  (b) Set-piece ownership. The long Sunna-preservation monologue and the "be honest with
      me" appeal are the principal scholar's turns. Khalifa answers the appeal by naming
      Abdul Aziz, so whoever owns it is Abdul Aziz.
  (c) Null model. If scholar speech were split between A and B in proportion to their
      totals, how surprising is the observed run of A?
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

f = np.load(os.path.join(HERE, 'final.npz'), allow_pickle=True)
I, times = f['I'], f['times']
p4 = np.load(os.path.join(HERE, 'p4.npy'))
rows = list(csv.reader(open(AR, newline='', encoding='utf-8-sig')))[1:]
en = list(csv.reader(open(EN, newline='', encoding='utf-8-sig')))[1:]
ROLE = {1: 'KHALIFA', 0: 'SCHOLAR-A', 2: 'SCHOLAR-B', 3: 'MIXED'}
pos = {int(r): j for j, r in enumerate(I)}


def sec(t):
    m = re.match(r'(\d+):(\d+):(\d+)\.(\d+)', t.strip())
    return int(m[1]) * 3600 + int(m[2]) * 60 + int(m[3]) + int(m[4]) / 1000


def clusters_in(t0, t1, scholars_only=True):
    """Cluster labels for embedded segments whose start falls in [t0,t1]."""
    out = []
    for j, tt in enumerate(times):
        if t0 <= tt <= t1:
            r = ROLE[p4[j]]
            if scholars_only and r not in ('SCHOLAR-A', 'SCHOLAR-B'):
                continue
            out.append(r)
    return Counter(out)


# --- (a) vocative adjacency --------------------------------------------------
print('=== (a) scholar speech adjacent to each "Abdul Aziz" mention ===')
anchors = [
    (75,  'before', '"this is the response to Sheikh Abdul Aziz"'),
    (534, 'after',  'Khalifa: "Sheikh Abdul Aziz ... you are challenging GOD"'),
    (534, 'before', '(the passage Khalifa is rebutting)'),
    (648, 'after',  '"O Sheikh Abdul Aziz, so the answer..."'),
]
tally = Counter()
for row, side, note in anchors:
    t = sec(rows[row][2])
    w = (t - 30, t - 0.5) if side == 'before' else (t + 0.5, t + 30)
    c = clusters_in(*w)
    tally.update(c)
    print(f'  ar{row:4d} {side:6s} {dict(c)}   {note}')
print(f'  TOTAL adjacent scholar segments: {dict(tally)}')

# --- (b) set-piece ownership -------------------------------------------------
print('\n=== (b) who owns the principal scholar set-pieces? ===')
pieces = [
    (480, 503, 'the long Sunna-preservation monologue (en 480-503)'),
    (535, 544, 'the "be honest with me" appeal (en 535-544) -> Khalifa names him at en 564'),
    (551, 563, 'the "latecomer to Arabic" argument (en 551-563)'),
    (443, 463, 'the "past centuries / rightly-guided Caliphs" block (en 443-463)'),
]
for a, b, note in pieces:
    t0, t1 = sec(en[a][2]), sec(en[b][3])
    print(f'  {note}\n      {t0/60:5.1f}-{t1/60:5.1f} min  {dict(clusters_in(t0, t1))}')

# --- (c) null model ----------------------------------------------------------
nA = int((p4 == 0).sum())
nB = int((p4 == 2).sum())
pA = nA / (nA + nB)
a_obs, b_obs = tally['SCHOLAR-A'], tally['SCHOLAR-B']
n = a_obs + b_obs
from math import comb
pval = sum(comb(n, k) * pA**k * (1 - pA)**(n - k) for k in range(a_obs, n + 1))
print(f'\n=== (c) null model ===')
print(f'  overall scholar split: A={nA} B={nB}  -> P(A) = {pA:.3f}')
print(f'  adjacent to the name:  A={a_obs} B={b_obs}')
print(f'  P(>= {a_obs} of {n} are A by chance) = {pval:.4g}')
