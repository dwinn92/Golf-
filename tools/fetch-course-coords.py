#!/usr/bin/env python3
"""Fetch UK golf-course centre coordinates from OpenStreetMap.

Whole-country Overpass queries time out, so the UK is covered in small
bounding-box tiles; each tile is cached on disk and retried independently.
Re-running resumes from wherever it got to.
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

OUT = sys.argv[1] if len(sys.argv) > 1 else "tiles"
os.makedirs(OUT, exist_ok=True)

TILES = [
    (49.8, 51.6, -6.5, -2.0), (49.8, 51.6, -2.0, 2.2),
    (51.6, 53.0, -6.5, -2.5), (51.6, 53.0, -2.5, 0.4), (51.6, 53.0, 0.4, 2.2),
    (53.0, 54.4, -6.5, -2.5), (53.0, 54.4, -2.5, 0.6),
    (54.4, 55.9, -8.5, -4.5), (54.4, 55.9, -4.5, -0.5),
    (55.9, 57.5, -7.5, -3.5), (55.9, 57.5, -3.5, -1.0),
    (57.5, 61.2, -8.7, -0.5),
]
HOSTS = ["https://overpass.kumi.systems/api/interpreter",
         "https://overpass-api.de/api/interpreter",
         "https://overpass.private.coffee/api/interpreter"]


def fetch(i, box):
    path = os.path.join(OUT, "t%d.json" % i)
    if os.path.exists(path):
        try:
            with open(path) as f:
                return len(json.load(f).get("elements", []))
        except Exception:
            pass
    s, n, w, e = box
    q = ('[out:json][timeout:120];('
         'way["leisure"="golf_course"](%s,%s,%s,%s);'
         'relation["leisure"="golf_course"](%s,%s,%s,%s););out tags center;'
         % (s, w, n, e, s, w, n, e))
    for attempt in range(4):
        for host in HOSTS:
            try:
                req = urllib.request.Request(
                    host, data=urllib.parse.urlencode({"data": q}).encode(),
                    headers={"User-Agent": "fairway-golf/1.0 (course directory)"})
                with urllib.request.urlopen(req, timeout=150) as r:
                    body = r.read()
                data = json.loads(body)
                els = data.get("elements", [])
                with open(path, "wb") as f:
                    f.write(body)
                return len(els)
            except Exception as err:
                print("    tile %d via %s: %s" % (i, host.split('/')[2], str(err)[:60]))
                time.sleep(5)
        time.sleep(20)
    return None


total = 0
for i, box in enumerate(TILES, 1):
    n = fetch(i, box)
    print("tile %2d/%d: %s" % (i, len(TILES), "%d courses" % n if n is not None else "FAILED"))
    sys.stdout.flush()
    if n:
        total += n
print("total elements across tiles:", total)
