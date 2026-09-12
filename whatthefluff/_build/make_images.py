#!/usr/bin/env python3
"""Generate the favicon, app icons and Open Graph card.

    python3 _build/make_images.py

Needs Playwright's Chromium (node) to rasterise; the SVG favicon is written
directly and needs nothing at all.
"""
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

from site_config import SITE, logo_svg, logo_mark, icon  # noqa: E402

PW = "/opt/node22/lib/node_modules/playwright"


def favicon():
    svg = logo_mark(uid="fav").replace('<svg class=""', '<svg xmlns="http://www.w3.org/2000/svg"')
    svg = svg.replace('<svg class="" viewBox', '<svg xmlns="http://www.w3.org/2000/svg" viewBox')
    if "xmlns" not in svg:
        svg = svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ', 1)
    with open(os.path.join(ROOT, "favicon.svg"), "w", encoding="utf-8") as fh:
        fh.write(svg)
    print("  favicon.svg")


RENDER_HTML = """<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="FONTS"><style>
  html,body{{margin:0;padding:0;background:transparent}}
  .stage{{width:{w}px;height:{h}px;display:grid;place-items:center;{bg}}}
  .stage > svg,.stage > div{{width:{inner}px;height:{inner}px}}
</style></head><body><div class="stage">{content}</div></body></html>"""


OG_HTML = """<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="{css}">
<style>
  body {{ margin:0; width:1200px; height:630px; overflow:hidden; }}
  .og {{
    position:relative; width:1200px; height:630px; box-sizing:border-box; overflow:hidden;
    background:
      radial-gradient(640px 380px at 84% 4%, rgba(245,115,157,.38), transparent 62%),
      linear-gradient(180deg,#FFF6FA 0%, #FDE7EE 100%);
    font-family:'Plus Jakarta Sans',sans-serif;
  }}
  .og-hill {{ position:absolute; left:0; right:0; bottom:0; height:132px; background:#1F4B32; z-index:1; }}
  .og-copy {{ position:absolute; left:66px; top:72px; width:652px; z-index:3; }}
  .og-eyebrow {{ display:inline-flex; align-items:center; gap:8px; background:#fff; color:#C2185B;
    font-size:17px; font-weight:800; letter-spacing:.14em; text-transform:uppercase;
    padding:9px 18px; border-radius:999px; margin-bottom:24px; box-shadow:0 6px 18px rgba(14,42,27,.10); }}
  .og h1 {{ font-size:58px; line-height:1.03; letter-spacing:-.032em; color:#123A25; margin:0 0 20px; font-weight:800; }}
  .og h1 span {{ color:#E0457F; }}
  .og p {{ font-size:22px; color:#42544A; margin:0; font-weight:600; }}
  .og-chips {{ display:flex; gap:10px; margin-top:26px; }}
  .og-chips span {{ background:rgba(255,255,255,.9); border:1px solid rgba(18,58,37,.1);
    border-radius:999px; padding:10px 18px; font-size:18px; font-weight:800; color:#123A25; }}
  .og-badge {{ position:absolute; right:74px; top:52px; width:252px; z-index:3;
    filter:drop-shadow(0 22px 34px rgba(18,58,37,.22)); }}
  .og-pack {{ position:absolute; right:0px; bottom:0; width:706px; z-index:2;
    filter:drop-shadow(0 18px 22px rgba(14,42,27,.22)); }}
</style></head><body>
<div class="og">
  <div class="og-hill"></div>
  <div class="og-copy">
    <span class="og-eyebrow">{town} pet care</span>
    <h1>Dog walking, cat visits<br>&amp; <span>puppy training</span></h1>
    <p>Insured · DBS checked · 1 &amp; 2 hour walks · Photos every visit</p>
    <div class="og-chips"><span>whatthefluff.co.uk</span><span>{phone}</span></div>
  </div>
  {badge}
  <img class="og-pack" src="{pack}" alt="">
</div>
</body></html>"""


def _shot(html, out, width, height, scale=1, clip=True):
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, dir=ROOT) as fh:
        fh.write(html)
        tmp = fh.name
    js = f"""
const {{ chromium }} = require('{PW}');
(async () => {{
  const b = await chromium.launch();
  const p = await b.newPage({{ viewport: {{ width: {width}, height: {height} }}, deviceScaleFactor: {scale} }});
  await p.goto('file://{tmp}', {{ waitUntil: 'networkidle' }});
  await p.waitForTimeout(600);
  await p.screenshot({{ path: '{out}', omitBackground: {str(not clip).lower()} }});
  await b.close();
}})();
"""
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as fh:
        fh.write(js)
        jsf = fh.name
    subprocess.run(["node", jsf], check=True)
    os.unlink(tmp)
    os.unlink(jsf)
    print(f"  {os.path.relpath(out, ROOT)}")


def icons():
    fonts = os.path.join(ROOT, "assets/css/fonts.css")
    img = os.path.join(ROOT, "assets/img")

    # Square app icons — paw mark, blush ground so it reads on any home screen.
    for size, name, inner, bg in [
        (192, "icon-192.png", 192, "background:#FDE7EE"),
        (512, "icon-512.png", 512, "background:#FDE7EE"),
        (512, "icon-maskable.png", 360, "background:#FDE7EE"),
        (180, "apple-touch-icon.png", 180, "background:#FDE7EE"),
    ]:
        html = RENDER_HTML.format(w=size, h=size, inner=inner, bg=bg,
                                  content=logo_mark(uid=name[:5])).replace("FONTS", fonts)
        _shot(html, os.path.join(img, name), size, size)

    # Full badge with lettering, for schema.org logo + anywhere the name must read.
    html = RENDER_HTML.format(w=512, h=512, inner=512, bg="background:transparent",
                              content=logo_svg(uid="png")).replace("FONTS", fonts)
    _shot(html, os.path.join(img, "logo.png"), 512, 512, clip=False)

    # Open Graph / Twitter card.
    og = OG_HTML.format(css=fonts, town=SITE["town"], phone=SITE["phone_display"],
                        badge=logo_svg(cls="og-badge", uid="og"),
                        pack=os.path.join(img, "pack.png"))
    _shot(og, os.path.join(img, "og.png"), 1200, 630)


if __name__ == "__main__":
    print("Generating brand images…")
    favicon()
    icons()
