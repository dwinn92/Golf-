#!/usr/bin/env python3
"""Build the deployable web app from the shared UI source.

The artifact and the web app share one UI. The differences are confined to
the boot/data layer, which is swapped here:

  artifact : claude.use('db')  -> per-artifact document store
  web      : Supabase          -> Postgres with auth + row level security
"""
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "web" / "dist"
out.mkdir(parents=True, exist_ok=True)

src = (root / "artifact" / "fairway-social.html").read_text()
whs = (root / "js" / "whs.js").read_text()
ukdir = (root / "data" / "uk-courses.json").read_text()
supa = (root / "web" / "js" / "supa.js").read_text()
authui = (root / "web" / "js" / "auth-ui.js").read_text()
appglue = (root / "web" / "js" / "app-web.js").read_text()
storejs = (root / "web" / "js" / "store-supabase.js").read_text()
auth_html = (root / "web" / "auth.html").read_text()
auth_css = (root / "web" / "auth.css").read_text()

# The <title> line and the artifact script tags are artifact-specific.
body = src
body = body.replace("<title>Fairway</title>\n", "")
body = re.sub(r"<script>\s*/\* @inject:whs \*/\s*</script>", "", body)
body = re.sub(r"<script>\s*/\* @inject:ukdir \*/\s*</script>", "", body)
body = re.sub(r"<script>\s*/\* @inject:store \*/\s*</script>", "", body)

# Take the shared UI script out; it is re-emitted after the data layer so the
# Supabase adapter is in place before the UI boots.
m = re.search(r"<script>\n(/\* Fairway — wireframe-faithful.*?)</script>\s*$", body, re.S)
if not m:
    raise SystemExit("could not find the shared UI script block")
ui_js = m.group(1)
body = body[: m.start()]

# Rewire the UI's boot and persistence calls onto Supabase.
# The artifact boots itself; on the web the session decides when to boot.
ui_js = ui_js.replace("  boot();\n", "  window.__fairwayBoot = boot;\n")

styles_end = body.index("</style>")
body = body[:styles_end] + auth_css + body[styles_end:]

html = f"""<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1F6B4A">
<title>Fairway — golf handicap tracker</title>
<meta name="description" content="Track your World Handicap System index with your friends: score entry, trends, results and a UK course directory.">
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png">
<link rel="icon" type="image/svg+xml" href="/icons/fairway-icon.svg">
<!-- iOS ignores the manifest's icons and looks for this one. -->
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Fairway">
<link rel="manifest" href="/manifest.webmanifest">
</head>
<body>
{auth_html}
{body}
<script src="/vendor/supabase.js"></script>
<script src="/config.js"></script>
<script>
{whs}</script>
<script>
{"var UK_DIRECTORY = " + ukdir + ";"}
</script>
<script>
{supa}</script>
<script>
{storejs}</script>
<script>
{authui}</script>
<script>
{appglue}</script>
<script>
{ui_js}</script>
</body>
</html>
"""

(out / "index.html").write_text(html)
print(f"built {out / 'index.html'} ({len(html) // 1024} KB)")

# Static extras
(out / "manifest.webmanifest").write_text((root / "web" / "manifest.webmanifest").read_text())
(out / "_redirects").write_text("/*  /index.html  200\n")
print(f"built {out / 'manifest.webmanifest'}")

icons_src = root / "web" / "icons"
icons_out = out / "icons"
icons_out.mkdir(exist_ok=True)
for f in sorted(icons_src.iterdir()):
    if f.is_file():
        (icons_out / f.name).write_bytes(f.read_bytes())
print(f"built {icons_out} ({len(list(icons_out.iterdir()))} icons)")

vendor_out = out / "vendor"
vendor_out.mkdir(exist_ok=True)
(vendor_out / "supabase.js").write_text((root / "web" / "vendor" / "supabase.js").read_text())
(out / "sw.js").write_text((root / "web" / "sw.js").read_text())
print(f"built {vendor_out / 'supabase.js'}")

cfg = root / "web" / "config.js"
if cfg.exists():
    (out / "config.js").write_text(cfg.read_text())
    print(f"built {out / 'config.js'}")
else:
    print("NOTE: web/config.js missing — copy config.example.js and fill it in")
