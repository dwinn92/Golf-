#!/usr/bin/env python3
"""Render the What the Fluff static site.

    python3 _build/build.py

Writes plain HTML into the project root — no runtime dependencies, nothing to
install, and the output can be dropped on any static host.
"""
import os
import re
import sys
import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

from site_config import SITE  # noqa: E402
import pages_home  # noqa: E402


IMG_TAG = re.compile(r'<img\b[^>]*?>', re.S)


def webp_wrap(html):
    """Serve WebP to browsers that take it, PNG to everyone else.

    Done here rather than in the templates so the markup stays readable.
    """
    def repl(match):
        tag = match.group(0)
        src = re.search(r'src="([^"]+\.png)"', tag)
        if not src:
            return tag
        if not os.path.exists(os.path.join(ROOT, os.path.normpath(
                src.group(1).replace("../", "")))):
            return tag
        srcset = re.search(r'srcset="([^"]+)"', tag)
        sizes = re.search(r'sizes="([^"]+)"', tag)
        candidates = (srcset.group(1) if srcset else src.group(1)).replace(".png", ".webp")
        source = f'<source type="image/webp" srcset="{candidates}"'
        if sizes:
            source += f' sizes="{sizes.group(1)}"'
        return f"<picture>{source}>{tag}</picture>"
    return IMG_TAG.sub(repl, html)


def write(path, html):
    html = webp_wrap(html)
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as fh:
        fh.write(html)
    print(f"  {path:<38} {len(html) / 1024:6.1f} KB")


def build():
    from site_config import page
    pages = []  # (path, changefreq, priority)

    body, schema = pages_home.home()
    write("index.html", page(
        title=f"Dog Walker in {SITE['town']}, {SITE['region']} | {SITE['name']}",
        description=(f"Insured, DBS-checked dog walking, cat visits and puppy training in "
                     f"{SITE['town']}, {SITE['region']}. One and two hour walks, GPS tracked, "
                     f"photos every time. Free meet & greet."),
        path="", body=body, active="home", schema=schema))
    pages.append(("", "weekly", "1.0"))

    try:
        import pages_services
        for path, kwargs, freq, prio in pages_services.all_pages():
            write(path, page(**kwargs))
            pages.append((path, freq, prio))
    except ImportError:
        pass

    try:
        import pages_more
        for path, kwargs, freq, prio in pages_more.all_pages():
            write(path, page(**kwargs))
            if freq:  # 404 is deliberately kept out of the sitemap
                pages.append((path, freq, prio))
    except ImportError:
        pass

    try:
        import pages_guides
        for path, kwargs, freq, prio in pages_guides.all_pages():
            write(path, page(**kwargs))
            pages.append((path, freq, prio))
    except ImportError:
        pass

    # ------------------------------------------------------------------ SEO
    today = datetime.date.today().isoformat()
    pages = [(p[:-len("index.html")] if p.endswith("index.html") else p, f, pr)
             for p, f, pr in pages]
    urls = "".join(
        f"\n  <url><loc>{SITE['domain']}/{p}</loc><lastmod>{today}</lastmod>"
        f"<changefreq>{f}</changefreq><priority>{pr}</priority></url>"
        for p, f, pr in pages)
    write("sitemap.xml",
          '<?xml version="1.0" encoding="UTF-8"?>\n'
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
          f'{urls}\n</urlset>\n')

    write("robots.txt",
          "User-agent: *\n"
          "Allow: /\n"
          "Disallow: /_build/\n\n"
          "# Nothing to hide, everything to sniff.\n"
          f"Sitemap: {SITE['domain']}/sitemap.xml\n")

    write("manifest.webmanifest", f'''{{
  "name": "{SITE['name']} — {SITE['town']} pet care",
  "short_name": "What the Fluff",
  "description": "Dog walking, cat visits and puppy training in {SITE['town']}.",
  "start_url": "/?utm_source=pwa",
  "display": "standalone",
  "background_color": "#FDE7EE",
  "theme_color": "#1F4B32",
  "icons": [
    {{"src": "/assets/img/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"}},
    {{"src": "/assets/img/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"}},
    {{"src": "/assets/img/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}}
  ]
}}
''')

    print(f"\nBuilt {len(pages)} pages into {ROOT}")


if __name__ == "__main__":
    print("Building What the Fluff…")
    build()
