import csv, os, re, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from attrib import SPANS

D = 'data/sources/playlists/video-transcripts'
EN = os.path.join(D, 'Debate Dr Rashad Khalifa Ph D vs Sunni Scholars (1987).csv')
AR = os.path.join(D, 'Debate Dr Rashad Khalifa Ph D vs Sunni Scholars (1987) - Arabic.csv')


def sec(t):
    m = re.match(r'(\d+):(\d+):(\d+)\.(\d+)', t.strip())
    return int(m[1]) * 3600 + int(m[2]) * 60 + int(m[3]) + int(m[4]) / 1000


def load(p):
    rows = list(csv.reader(open(p, newline='', encoding='utf-8-sig')))
    return rows[0], rows[1:]


def write(p, hdr, data):
    with open(p, 'w', newline='', encoding='utf-8') as fh:
        w = csv.writer(fh, quoting=csv.QUOTE_MINIMAL)
        w.writerow(hdr)
        w.writerows(data)


# ---- English: apply the read-through attribution directly ----
# Rows the text could not settle but the audio could. Kept as an explicit second layer
# rather than folded into SPANS, so the provenance of every label stays visible: SPANS is
# what reading the argument established, AUDIO_RESOLVED is what ECAPA speaker embeddings
# established for rows left blank. Each of these had >=1.2s of single-voice support in the
# confident half of the k-means margin, from the Arabic timeline (whose windows were
# measured to hold exactly one voice each).
AUDIO_RESOLVED = {
    23: 'Sunni Scholars', 27: 'Dr. Rashad Khalifa', 179: 'Sunni Scholars',
    243: 'Sunni Scholars', 436: 'Dr. Rashad Khalifa', 629: 'Sunni Scholars',
    744: 'Dr. Rashad Khalifa', 943: 'Sunni Scholars',
    1084: 'Sunni Scholars', 1085: 'Sunni Scholars', 1086: 'Sunni Scholars',
}

hdr, en = load(EN)
labels = [''] * len(en)
for a, b, lab in SPANS:
    for i in range(a, b + 1):
        labels[i] = lab
for i, lab in AUDIO_RESOLVED.items():
    assert labels[i] == '', f'row {i} was already attributed as {labels[i]!r}'
    labels[i] = lab
assert len(en) == 1193
for r, lab in zip(en, labels):
    r[5] = lab
write(EN, hdr, en)
print('English:', Counter(labels))

# ---- Arabic: propagate by timestamp overlap ----
# The two files caption one recording and are aligned to within about a second, so an
# Arabic cue's speaker is whoever holds the floor in the English file over the same
# wall-clock window. Each Arabic row takes the label of the English rows its
# [start,end] window overlaps, weighted by how much time they share. Ties and
# no-overlap fall back to unattributed rather than to a guess.
hdrA, ar = load(AR)
en_iv = [(sec(r[2]), sec(r[3]), lab) for r, lab in zip(en, labels)]
out = []
for r in ar:
    a0, a1 = sec(r[2]), sec(r[3])
    if a1 <= a0:
        a1 = a0 + 0.001
    score = Counter()
    for e0, e1, lab in en_iv:
        if e1 <= a0 or e0 >= a1:
            continue
        if not lab:
            continue
        score[lab] += min(a1, e1) - max(a0, e0)
    if score:
        top = score.most_common()
        # require a clear winner: the leader must hold most of the shared time
        if len(top) == 1 or top[0][1] > top[1][1] * 1.5:
            r[5] = top[0][0]
        else:
            r[5] = ''
    else:
        r[5] = ''
    out.append(r)
write(AR, hdrA, out)
print('Arabic:', Counter(r[5] for r in out))
