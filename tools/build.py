#!/usr/bin/env python3
"""Bundle the Fairway artifacts by inlining the shared WHS engine.

Usage: python3 tools/build.py [output-dir]   (default: dist/)
"""
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent.parent
out_dir = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "dist"
out_dir.mkdir(parents=True, exist_ok=True)

whs = (root / "js" / "whs.js").read_text()
ukdir = (root / "data" / "uk-courses.json").read_text()
store = (root / "artifact" / "stores" / "store-artifact.js").read_text()

for src in (root / "artifact").glob("*.html"):
    text = src.read_text()
    marker = "/* @inject:whs */"
    if marker not in text:
        raise SystemExit(f"{src}: missing {marker} marker")
    text = text.replace(marker, whs)
    text = text.replace("/* @inject:ukdir */", "var UK_DIRECTORY = " + ukdir + ";")
    text = text.replace("/* @inject:store */", store)
    (out_dir / src.name).write_text(text)
    print(f"built {out_dir / src.name}")
