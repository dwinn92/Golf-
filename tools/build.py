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

for src in (root / "artifact").glob("*.html"):
    text = src.read_text()
    marker = "/* @inject:whs */"
    if marker not in text:
        raise SystemExit(f"{src}: missing {marker} marker")
    (out_dir / src.name).write_text(text.replace(marker, whs))
    print(f"built {out_dir / src.name}")
