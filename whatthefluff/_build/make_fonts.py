#!/usr/bin/env python3
"""Download the brand fonts and subset them to the glyphs this site actually uses.

    python3 _build/make_fonts.py

Plus Jakarta Sans and Baloo 2 keep the full Latin set (client names, future copy
and anything typed into a form still need to render). Caveat is only ever used
for a short handwritten signature, so it is cut right down.

Writes assets/fonts/*.woff2 and assets/css/fonts.css.
"""
import glob
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FONT_DIR = os.path.join(ROOT, "assets/fonts")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/125.0 Safari/537.36")

GOOGLE = ("https://fonts.googleapis.com/css2"
          "?family=Baloo+2:wght@500..800"
          "&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,400..600"
          "&family=Caveat:wght@500..700&display=swap")

# Latin-1 plus the punctuation the copy uses (curly quotes, dashes, ellipsis, £, ·, ★).
LATIN = ("U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,"
         "U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212,U+2215,U+2605,U+2665,U+FEFF,U+FFFD")
HAND = "U+0020,U+0041-005A,U+0061-007A,U+0027,U+002C,U+002E,U+0021,U+003F,U+2018-2019"

FACES = [
    # family, style, unicodes, output name
    ("Plus Jakarta Sans", "normal", LATIN, "plus-jakarta-sans-normal.woff2"),
    ("Plus Jakarta Sans", "italic", LATIN, "plus-jakarta-sans-italic.woff2"),
    ("Baloo 2", "normal", LATIN, "baloo-2-normal.woff2"),
    ("Caveat", "normal", HAND, "caveat-normal.woff2"),
]


def fetch_css():
    return subprocess.run(["curl", "-sS", "-H", f"User-Agent: {UA}", GOOGLE],
                          capture_output=True, text=True, check=True).stdout


def source_urls(css):
    """family -> style -> url of the widest Latin source we can subset from."""
    found = {}
    for block in css.split("@font-face")[1:]:
        fam = re.search(r"font-family: '([^']+)'", block).group(1)
        style = "italic" if "font-style: italic" in block else "normal"
        urange = re.search(r"unicode-range: ([^;]+);", block).group(1)
        if not urange.startswith("U+0000-00FF"):
            continue  # the plain latin subset carries every glyph we need
        url = re.search(r"url\((https://[^)]+)\)", block).group(1)
        found[(fam, style)] = url
    return found


def main():
    from fontTools import subset  # noqa: F401  (import check before downloading)

    os.makedirs(FONT_DIR, exist_ok=True)
    for old in glob.glob(os.path.join(FONT_DIR, "*.woff2")):
        os.remove(old)

    urls = source_urls(fetch_css())
    faces_css = []
    for family, style, unicodes, out_name in FACES:
        url = urls.get((family, style))
        if not url:
            print(f"  !! no source for {family} {style}")
            continue
        raw = os.path.join(FONT_DIR, "_tmp.woff2")
        subprocess.run(["curl", "-sS", "-o", raw, url], check=True)
        out = os.path.join(FONT_DIR, out_name)
        subprocess.run([
            sys.executable, "-m", "fontTools.subset", raw,
            f"--unicodes={unicodes}",
            "--layout-features=kern,liga,clig,calt,ccmp,locl,mark,mkmk",
            "--flavor=woff2", "--with-zopfli", "--no-hinting",
            "--desubroutinize", "--drop-tables+=DSIG",
            f"--output-file={out}",
        ], check=True)
        if family == "Caveat":  # pin the variable axis; we only use one weight
            subprocess.run([sys.executable, "-m", "fontTools.varLib.instancer", out,
                            "wght=600", "--output", out], check=True)
        os.remove(raw)
        weight = "500 800" if family == "Baloo 2" else ("400 600" if family == "Caveat"
                                                        else "300 800")
        if family == "Plus Jakarta Sans" and style == "italic":
            weight = "400 600"
        faces_css.append(
            f"@font-face{{font-family:'{family}';font-style:{style};font-weight:{weight};"
            f"font-display:swap;src:url('../fonts/{out_name}') format('woff2');}}")
        print(f"  {out_name:<34} {os.path.getsize(out) / 1024:6.1f} KB")

    header = ("/* Brand fonts, self-hosted and subset to the glyphs this site uses.\n"
              "   Baloo 2, Plus Jakarta Sans and Caveat — SIL Open Font License 1.1.\n"
              "   Regenerate with: python3 _build/make_fonts.py */\n")
    with open(os.path.join(ROOT, "assets/css/fonts.css"), "w", encoding="utf-8") as fh:
        fh.write(header + "\n".join(faces_css) + "\n")


if __name__ == "__main__":
    print("Subsetting fonts…")
    main()
