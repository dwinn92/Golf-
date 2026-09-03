#!/usr/bin/env python3
"""Validate data/uk-courses.json. Exits non-zero on any problem."""
import json
import math
import re
import sys

d = json.load(open('data/uk-courses.json'))
rows = d['courses']
problems = []


def dist(a, b):
    R = 3958.8
    la1, lo1, la2, lo2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return R * 2 * math.asin(math.sqrt(h))


# --- shape ---
for i, r in enumerate(rows):
    if len(r) != 8:
        problems.append('row %d has %d fields, expected 8: %r' % (i, len(r), r[:2]))
        continue
    name, region, town, holes, par, yards, lat, lon = r
    if not name or not isinstance(name, str):
        problems.append('row %d has no name' % i)
    if region not in ('E', 'S', 'W', 'N'):
        problems.append('%s: bad region %r' % (name, region))
    if par and not (25 <= par <= 80):
        problems.append('%s: implausible par %r' % (name, par))
    if yards and not (1000 <= yards <= 8500):
        problems.append('%s: implausible yardage %r' % (name, yards))
    if lat or lon:
        # everything must sit inside the UK bounding box
        if not (49.5 <= lat <= 61.5 and -9.0 <= lon <= 2.5):
            problems.append('%s: coordinate outside the UK: %s,%s' % (name, lat, lon))

# --- duplicates ---
seen = {}
for r in rows:
    k = (r[0].lower(), r[1], r[2].lower())
    if k in seen:
        problems.append('duplicate row: %s (%s)' % (r[0], r[2]))
    seen[k] = True

# --- known locations, matched by substring the way a person would search ---
KNOWN = [
    ('royal birkdale', (53.617, -3.024)), ('royal county down', (54.222, -5.888)),
    ('royal porthcawl', (51.487, -3.712)), ('hunstanton', (52.955, 0.514)),
    ('carnoustie', (56.499, -2.712)), ('wentworth', (51.398, -0.596)),
    ('turnberry', (55.313, -4.836)), ('muirfield', (56.049, -2.816)),
    ('royal lytham', (53.744, -3.037)), ('woodhall spa', (53.145, -0.212)),
    ('sunningdale', (51.383, -0.640)), ('royal dornoch', (57.874, -4.026)),
    ('ganton', (54.148, -0.475)), ('royal portrush', (55.207, -6.633)),
]
located = [r for r in rows if len(r) == 8 and r[6]]
for needle, truth in KNOWN:
    cands = [r for r in located if needle in r[0].lower()]
    if not cands:
        problems.append('no located course matches %r' % needle)
        continue
    best = min(cands, key=lambda r: dist((r[6], r[7]), truth))
    e = dist((best[6], best[7]), truth)
    if e >= 3:
        problems.append('%s: nearest match %r is %.1f mi from the real course' % (needle, best[0], e))

withc = len(located)
print('courses: %d | with coordinates: %d (%.0f%%) | with par: %d | championship cards: %d'
      % (len(rows), withc, 100.0 * withc / len(rows),
         sum(1 for r in rows if r[4]), sum(1 for r in rows if r[5])))
if problems:
    print('\nPROBLEMS (%d):' % len(problems))
    for p in problems[:25]:
        print('  -', p)
    sys.exit(1)
print('all checks passed')
