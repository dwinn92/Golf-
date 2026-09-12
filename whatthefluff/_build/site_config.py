"""Shared configuration, icons and layout chrome for the What the Fluff site.

Everything a site owner would realistically want to change lives in SITE below.
"""

SITE = {
    "name": "What the Fluff",
    "legal": "What the Fluff Pet Care",
    "owner": "Gemma",
    "tagline": "Dog walking, cat visits & puppy training",
    # The live URL. Change this to the custom domain when you buy one and
    # rebuild — canonicals, Open Graph tags, the sitemap and the schema all
    # follow it.
    "domain": "https://what-the-fluff-36e9.netlify.app",
    "phone_display": "07875 129614",
    "phone_link": "+447875129614",
    "whatsapp": "447875129614",
    "email": "walkieswithgemma@gmail.com",
    "town": "Greenhithe",
    "region": "Kent",
    "postcode": "DA9",          # district only — never publish a home address
    "country": "GB",
    "lat": "51.4487",
    "lon": "0.2842",
    "instagram": "https://www.instagram.com/walkieswithgemma",
    "facebook": "https://www.facebook.com/walkieswithgemmauk",
    "founded": "2020",
    # Leave rating/review_count empty until there is a real, countable number of
    # reviews to point at — an invented aggregateRating is a manual-action risk.
    "rating": "",
    "review_count": "",
    "hours": "Mon–Fri 7:30am–6pm · Sat 8am–2pm",
    "areas": [
        "Greenhithe", "Swanscombe", "Stone", "Knockhall", "Ingress Park",
        "Ebbsfleet", "Northfleet", "Dartford", "Bean", "Betsham",
    ],
}

# TODO: confirm every one of these against what you actually charge.
PRICES = {
    "group_walk": "16",         # 1-hour group walk
    "group_walk_2h": "24",      # 2-hour group walk
    "solo_walk": "22",
    "solo_walk_30": "16",
    "field_session": "25",      # private secure field hire, 1 hour
    "check_in": "13",
    "puppy_visit": "13",
    "training_session": "45",
    "training_package": "160",
    "bundle_5": "75",
}

# --------------------------------------------------------------------------- #
# Icons — 24×24, stroke-based, inherit currentColor.
# --------------------------------------------------------------------------- #
def _svg(body, size=20, fill="none", stroke=True, vb="0 0 24 24"):
    s = ('stroke="currentColor" stroke-width="1.9" stroke-linecap="round" '
         'stroke-linejoin="round" ') if stroke else ""
    return (f'<svg width="{size}" height="{size}" viewBox="{vb}" fill="{fill}" {s}'
            f'aria-hidden="true" focusable="false">{body}</svg>')


def icon(name, size=20):
    paths = {
        "check": '<path d="M20 6 9 17l-5-5"/>',
        "check-circle": '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.6-4.9"/>',
        "arrow-right": '<path d="M5 12h14m-6-6 6 6-6 6"/>',
        "shield": '<path d="M12 3 5 6v5.5c0 4.2 2.9 7.7 7 9.5 4.1-1.8 7-5.3 7-9.5V6l-7-3Z"/>',
        "first-aid": '<path d="M12 3 5 6v5.5c0 4.2 2.9 7.7 7 9.5 4.1-1.8 7-5.3 7-9.5V6l-7-3Z"/><path d="M12 9v6m-3-3h6"/>',
        "id-card": '<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16.2c.7-1.4 1.8-2 3-2s2.3.6 3 2M14 10h4M14 14h3"/>',
        "map-pin": '<path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
        "phone": '<path d="M6.3 3.5h3l1.5 4-2 1.3a12 12 0 0 0 5.4 5.4l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.3 5.7a2 2 0 0 1 2-2.2Z"/>',
        "mail": '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 5.5L20 7"/>',
        "camera": '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.4"/>',
        "route": '<circle cx="6" cy="18" r="2.6"/><circle cx="18" cy="6" r="2.6"/><path d="M8.6 17.2c4.6-.6 6.9-2 6.9-5.2 0-2.8-2.6-3.6-6-3.9"/>',
        "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
        "star": '<path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 17l-5.3 2.8 1.1-5.9L3.5 9.8l5.9-.8L12 3.6Z"/>',
        "star-solid": '<path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 17l-5.3 2.8 1.1-5.9L3.5 9.8l5.9-.8L12 3.6Z" fill="currentColor" stroke="none"/>',
        "calendar": '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3.5v3M16 3.5v3"/>',
        "key": '<circle cx="8" cy="15" r="3.5"/><path d="m10.6 12.6 7-7M16 6.8l2 2M13.6 9.2l2 2"/>',
        "heart": '<path d="M12 20s-7-4.4-7-9.2A4 4 0 0 1 12 8.4a4 4 0 0 1 7-2.5c0 4.8-7 14.1-7 14.1Z"/>',
        "heart-solid": '<path d="M12 20.5S4 15.6 4 10.4a4.4 4.4 0 0 1 8-2.6 4.4 4.4 0 0 1 8 2.6c0 5.2-8 10.1-8 10.1Z" fill="currentColor" stroke="none"/>',
        "paw": ('<ellipse cx="7" cy="10.5" rx="2.1" ry="2.8" transform="rotate(-18 7 10.5)"/>'
                '<ellipse cx="11.3" cy="7.6" rx="2.1" ry="2.9"/>'
                '<ellipse cx="16.4" cy="9.4" rx="2.1" ry="2.8" transform="rotate(18 16.4 9.4)"/>'
                '<path d="M12 12.6c3 0 5.4 2 5.4 4.2 0 1.7-1.5 2.8-3.3 2.5-1.4-.2-2.7-.2-4.1 0-1.8.3-3.3-.8-3.3-2.5 0-2.2 2.4-4.2 5.3-4.2Z"/>'),
        "dog": ('<path d="M4.5 7.5 6 4l3 2h6l3-2 1.5 3.5V13a7.5 7.5 0 0 1-15 0V7.5Z"/>'
                '<path d="M9.6 11.5h.01M14.4 11.5h.01"/><path d="M12 14.2c-.9 0-1.6.6-1.6 1.3 0 .8.7 1.3 1.6 1.3s1.6-.5 1.6-1.3c0-.7-.7-1.3-1.6-1.3Z"/>'),
        "cat": ('<path d="M4.5 9 5 4.2 8.6 7h6.8L19 4.2 19.5 9v3.5a7.5 7.5 0 0 1-15 0V9Z"/>'
                '<path d="M9.5 12h.01M14.5 12h.01"/><path d="M12 14.4v1.4m0 0c-.6.8-1.6 1-2.4.6m2.4-.6c.6.8 1.6 1 2.4.6"/>'),
        "graduation": '<path d="M12 4 2.8 8.4 12 12.8l9.2-4.4L12 4Z"/><path d="M6.6 10.7v4.6c0 1.6 2.4 2.9 5.4 2.9s5.4-1.3 5.4-2.9v-4.6M21 8.8v5"/>',
        "message": '<path d="M20.5 11.6c0 4-3.8 7.2-8.5 7.2a10 10 0 0 1-2.6-.3L4.5 20.5l1.3-3.6a6.8 6.8 0 0 1-2.3-5.3c0-4 3.8-7.2 8.5-7.2s8.5 3.2 8.5 7.2Z"/>',
        "sparkle": '<path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z"/><path d="M18.6 15.5 19.4 18l2.4.8-2.4.8-.8 2.4-.8-2.4L15.4 19l2.4-.8.8-2.5Z"/>',
        "users": '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.2c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6"/><path d="M16 5.8a3.2 3.2 0 0 1 0 6.2m1 2.8c2 .5 3.3 2 3.8 4.4"/>',
        "whatsapp": ('<path d="M3.5 20.5 5 16.3a7.8 7.8 0 1 1 3 3l-4.5 1.2Z"/>'
                     '<path d="M9.3 9.2c.3-.7.6-.7.9-.7h.6c.2 0 .5 0 .7.6l.7 1.7c.1.2.1.4 0 .6l-.5.7c-.1.2-.2.4 0 .7a6 6 0 0 0 2.7 2.3c.3.1.5.1.7-.1l.6-.7c.2-.2.4-.2.6-.1l1.7.8c.2.1.4.3.4.5v.6c0 .4-.3.9-.8 1.1-1 .5-2.3.4-4-.4a10.4 10.4 0 0 1-4.4-4.3c-.7-1.4-.7-2.6-.1-3.3Z"/>'),
        "instagram": '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17 7h.01"/>',
        "facebook": '<path d="M14.5 8.5h2.2V5.6h-2.4c-2.2 0-3.6 1.4-3.6 3.6v1.9H8.3v3h2.4V21h3.1v-6.9h2.4l.5-3h-2.9V9.6c0-.7.3-1.1 1.1-1.1Z"/>',
        "gift": '<rect x="3.5" y="9" width="17" height="11" rx="2.5"/><path d="M3.5 13h17M12 9v11"/><path d="M12 9S10.8 5 8.7 5a2 2 0 0 0 0 4M12 9s1.2-4 3.3-4a2 2 0 0 1 0 4"/>',
        "leaf": '<path d="M5 19c0-7 4.5-12 14-12 0 8.5-4.6 12.4-10 12.4-1.6 0-3-.4-4-.4Z"/><path d="M5 19c2.5-3.6 5.5-6 9-7.5"/>',
        "chevron-down": '<path d="m6 9.5 6 6 6-6"/>',
        "play": '<circle cx="12" cy="12" r="9"/><path d="m10 8.5 6 3.5-6 3.5v-7Z"/>',
        "home": '<path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-8.5Z"/><path d="M9.5 20.5v-6h5v6"/>',
    }
    return _svg(paths.get(name, paths["paw"]), size=size)


def stars(count=5, size=17):
    return f'<span class="stars" aria-hidden="true">{"".join(icon("star-solid", size) for _ in range(count))}</span>'


# --------------------------------------------------------------------------- #
# Logo
# --------------------------------------------------------------------------- #
def logo_svg(cls="", title="What the Fluff", uid="a"):
    """The brand badge, redrawn as SVG so it stays crisp at any size."""
    return f'''<svg class="{cls}" viewBox="0 0 200 200" role="img" aria-label="{title}">
  <defs>
    <linearGradient id="pad-{uid}" x1="0.15" y1="0" x2="0.5" y2="1">
      <stop offset="0" stop-color="#1F4B32"/><stop offset="0.4" stop-color="#2E7049"/><stop offset="1" stop-color="#F5739D"/>
    </linearGradient>
    <path id="arcTop-{uid}" d="M 30,100 A 70,70 0 0 1 170,100" fill="none"/>
    <path id="arcBot-{uid}" d="M 24,108 A 76,76 0 0 0 176,108" fill="none"/>
    <path id="hrt-{uid}" d="M0,5 C-2.6,1.6 -7,0 -7,-3.4 C-7,-6 -5,-7.6 -2.8,-7.6 C-1.4,-7.6 -0.4,-6.8 0,-5.8 C0.4,-6.8 1.4,-7.6 2.8,-7.6 C5,-7.6 7,-6 7,-3.4 C7,0 2.6,1.6 0,5 Z"/>
  </defs>
  <circle cx="100" cy="100" r="97.5" fill="#FDE7EE" stroke="#1F4B32" stroke-width="2.2"/>
  <circle cx="100" cy="100" r="88" fill="none" stroke="#F5739D" stroke-width="4"/>
  <text font-family="'Baloo 2','Plus Jakarta Sans',sans-serif" font-size="29" font-weight="800" fill="#123A25" letter-spacing="2.4">
    <textPath href="#arcTop-{uid}" startOffset="50%" text-anchor="middle">what the</textPath>
  </text>
  <text font-family="'Baloo 2','Plus Jakarta Sans',sans-serif" font-size="33" font-weight="800" fill="#123A25" letter-spacing="2.2">
    <textPath href="#arcBot-{uid}" startOffset="50%" text-anchor="middle">fluff</textPath>
  </text>
  <use href="#hrt-{uid}" transform="translate(38,112) scale(1.25)" fill="#F5739D"/>
  <use href="#hrt-{uid}" transform="translate(162,112) scale(1.25)" fill="#F5739D"/>
  <g transform="translate(0,-4)">
    <g stroke="#1F4B32" stroke-width="4" fill="#FFF8FA">
      <ellipse cx="57" cy="92" rx="12.5" ry="17" transform="rotate(-24 57 92)"/>
      <ellipse cx="82" cy="72" rx="12.5" ry="18.5" transform="rotate(-8 82 72)"/>
      <ellipse cx="118" cy="72" rx="12.5" ry="18.5" transform="rotate(8 118 72)"/>
      <ellipse cx="143" cy="92" rx="12.5" ry="17" transform="rotate(24 143 92)"/>
    </g>
    <g fill="none" stroke="url(#pad-{uid})" stroke-width="4.4" stroke-linecap="round">
      <path d="M100,106 C74,92 54,110 58,132 C62,152 88,158 110,144"/>
      <path d="M100,106 C126,92 146,110 142,132 C138,152 112,158 90,144"/>
      <path d="M100,132 C93,125 85,120 85,113 C85,108 89,104 93,104 C96,104 99,106 100,109 C101,106 104,104 107,104 C111,104 115,108 115,113 C115,120 107,125 100,132 Z"/>
    </g>
  </g>
</svg>'''


def logo_mark(cls="", uid="m"):
    """Compact paw-only mark — the badge lettering is unreadable below ~90px."""
    return f'''<svg class="{cls}" viewBox="0 0 200 200" role="img" aria-label="What the Fluff">
  <defs>
    <linearGradient id="mpad-{uid}" x1="0.15" y1="0" x2="0.5" y2="1">
      <stop offset="0" stop-color="#1F4B32"/><stop offset="0.4" stop-color="#2E7049"/><stop offset="1" stop-color="#F5739D"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="96" fill="#FDE7EE" stroke="#1F4B32" stroke-width="5"/>
  <circle cx="100" cy="100" r="84" fill="none" stroke="#F5739D" stroke-width="7"/>
  <g transform="translate(0,4) scale(1.12) translate(-12,-12)">
    <g stroke="#1F4B32" stroke-width="7" fill="#FFF8FA">
      <ellipse cx="57" cy="92" rx="12.5" ry="17" transform="rotate(-24 57 92)"/>
      <ellipse cx="82" cy="72" rx="12.5" ry="18.5" transform="rotate(-8 82 72)"/>
      <ellipse cx="118" cy="72" rx="12.5" ry="18.5" transform="rotate(8 118 72)"/>
      <ellipse cx="143" cy="92" rx="12.5" ry="17" transform="rotate(24 143 92)"/>
    </g>
    <g fill="none" stroke="url(#mpad-{uid})" stroke-width="7.5" stroke-linecap="round">
      <path d="M100,106 C74,92 54,110 58,132 C62,152 88,158 110,144"/>
      <path d="M100,106 C126,92 146,110 142,132 C138,152 112,158 90,144"/>
      <path d="M100,132 C93,125 85,120 85,113 C85,108 89,104 93,104 C96,104 99,106 100,109 C101,106 104,104 107,104 C111,104 115,108 115,113 C115,120 107,125 100,132 Z"/>
    </g>
  </g>
</svg>'''


# --------------------------------------------------------------------------- #
# Page chrome
# --------------------------------------------------------------------------- #
NAV = [
    ("Services", "services/", "services"),
    ("Prices", "pricing.html", "pricing"),
    ("Areas", "areas.html", "areas"),
    ("About", "about.html", "about"),
    ("Guides", "guides/", "guides"),
]


def head(title, description, path, *, image="assets/img/og.png", schema=None,
         depth=0, robots=None, article=None):
    r = "../" * depth
    canonical = f"{SITE['domain']}/{path}" if path else f"{SITE['domain']}/"
    schema_blocks = ""
    for block in (schema or []):
        schema_blocks += f'\n<script type="application/ld+json">{block}</script>'
    robots_tag = f'\n<meta name="robots" content="{robots}">' if robots else ""
    art = ""
    if article:
        art = (f'\n<meta property="article:published_time" content="{article["published"]}">'
               f'\n<meta property="article:modified_time" content="{article.get("modified", article["published"])}">'
               f'\n<meta property="article:author" content="{SITE["owner"]}">')
    return f'''<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{description}">{robots_tag}
<link rel="canonical" href="{canonical}">
<meta name="theme-color" content="#FDE7EE">
<meta name="format-detection" content="telephone=no">
<meta name="author" content="{SITE['name']}">
<meta name="geo.region" content="GB">
<meta name="geo.placename" content="{SITE['town']}">

<meta property="og:type" content="{'article' if article else 'website'}">
<meta property="og:site_name" content="{SITE['name']}">
<meta property="og:locale" content="en_GB">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{SITE['domain']}/{image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="What the Fluff — dog walking, cat visits and puppy training in {SITE['town']}">{art}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{description}">
<meta name="twitter:image" content="{SITE['domain']}/{image}">

<link rel="icon" href="{r}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{r}assets/img/apple-touch-icon.png">
<link rel="manifest" href="{r}manifest.webmanifest">
<link rel="preload" href="{r}assets/fonts/plus-jakarta-sans-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{r}assets/fonts/baloo-2-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{r}assets/css/styles.css">
<script src="{r}assets/js/main.js" defer></script>{schema_blocks}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<div class="scroll-progress" aria-hidden="true"></div>
'''


def header(active="", depth=0):
    r = "../" * depth
    links = ""
    for label, href, key in NAV:
        current = ' aria-current="page"' if key == active else ""
        links += f'<a href="{r}{href}"{current}>{label}</a>'
    return f'''<header class="site-header">
  <nav class="nav container-wide" aria-label="Main">
    <a class="brand" href="{r}index.html" aria-label="{SITE['name']} — home">
      {logo_mark(cls="brand-mark", uid="nav")}
      <span class="brand-name">What the Fluff<span>{SITE['town']} pet care</span></span>
    </a>
    <div class="nav-links" id="nav-links">
      {links}
      <a class="btn btn-primary btn-sm" href="{r}book.html">Book a free meet &amp; greet</a>
    </div>
    <div class="nav-cta">
      <a class="nav-phone hide-sm" href="tel:{SITE['phone_link']}">{icon('phone', 18)}<span>{SITE['phone_display']}</span></a>
      <a class="btn btn-primary btn-sm" href="{r}book.html">Book a free meet &amp; greet</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>
</header>
'''


def footer(depth=0):
    r = "../" * depth
    areas = " · ".join(SITE["areas"])
    return f'''<footer class="site-footer">
  <div class="container-wide">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="{r}index.html">
          {logo_mark(cls="brand-mark", uid="foot")}
          <span class="brand-name">What the Fluff<span>{SITE['town']} pet care</span></span>
        </a>
        <p>One and two hour group dog walks, private field sessions, in-home cat visits and pet
        check-ins, and kind puppy training across {SITE['town']}, {SITE['region']} and the
        surrounding villages. Fully insured, DBS checked, canine first aid and CPR trained —
        with photos after every single visit.</p>
        <div class="social-row">
          <a href="{SITE['instagram']}" rel="me noopener" aria-label="Instagram">{icon('instagram')}</a>
          <a href="{SITE['facebook']}" rel="me noopener" aria-label="Facebook">{icon('facebook')}</a>
          <a href="https://wa.me/{SITE['whatsapp']}" rel="noopener" aria-label="WhatsApp">{icon('whatsapp')}</a>
          <a href="mailto:{SITE['email']}" aria-label="Email">{icon('mail')}</a>
        </div>
      </div>
      <div>
        <h2 class="footer-heading">Services</h2>
        <ul class="footer-links">
          <li><a href="{r}services/dog-walking.html">Group dog walking</a></li>
          <li><a href="{r}services/dog-walking.html#solo">Solo &amp; 1-2-1 walks</a></li>
          <li><a href="{r}services/pet-check-ins.html">Cat visits &amp; check-ins</a></li>
          <li><a href="{r}services/pet-check-ins.html#puppy-pop-ins">Puppy pop-ins</a></li>
          <li><a href="{r}services/puppy-training.html">Puppy &amp; obedience training</a></li>
          <li><a href="{r}pricing.html">Prices</a></li>
        </ul>
      </div>
      <div>
        <h2 class="footer-heading">Company</h2>
        <ul class="footer-links">
          <li><a href="{r}about.html">About Gemma</a></li>
          <li><a href="{r}areas.html">Areas covered</a></li>
          <li><a href="{r}guides/">Guides</a></li>
          <li><a href="{r}book.html">Book a meet &amp; greet</a></li>
          <li><a href="{r}index.html#faq">FAQs</a></li>
        </ul>
      </div>
      <div>
        <h2 class="footer-heading">Get in touch</h2>
        <ul class="footer-links">
          <li><a href="tel:{SITE['phone_link']}">{SITE['phone_display']}</a></li>
          <li><a href="mailto:{SITE['email']}">{SITE['email']}</a></li>
          <li><a href="https://wa.me/{SITE['whatsapp']}" rel="noopener">Message on WhatsApp</a></li>
          <li>{SITE['hours']}</li>
        </ul>
      </div>
    </div>
    <p class="tiny dim mt-4">Covering {areas}.</p>
    <div class="footer-bottom">
      <p>© <span data-year>2026</span> {SITE['legal']} · {SITE['town']}, {SITE['region']} · Fully
        insured · DBS checked · Canine first aid &amp; CPR trained</p>
      <p>Formerly Walkies with Gemma, walking here since {SITE['founded']}. Same me, same dogs,
        better name.</p>
    </div>
  </div>
</footer>
'''


def mobile_cta(depth=0):
    r = "../" * depth
    return f'''<div class="mobile-cta">
  <a class="btn btn-ghost" href="tel:{SITE['phone_link']}">{icon('phone', 18)} Call</a>
  <a class="btn btn-primary" href="{r}book.html">Book free meet &amp; greet</a>
</div>
'''


def close():
    return "</body>\n</html>\n"


def page(*, title, description, path, body, active="", depth=0, schema=None,
         image="assets/img/og.png", robots=None, article=None):
    # Every page carries the business node so the @id references in Service,
    # Article and Person schema always resolve, whichever page Google lands on.
    schema = [local_business_schema()] + list(schema or [])
    return (head(title, description, path, image=image, schema=schema, depth=depth,
                 robots=robots, article=article)
            + header(active, depth)
            + '<main id="main">\n' + body + '\n</main>\n'
            + footer(depth) + mobile_cta(depth) + close())


# --------------------------------------------------------------------------- #
# Reusable content blocks
# --------------------------------------------------------------------------- #
def breadcrumbs(items, depth=0):
    """items: list of (label, href_or_None)."""
    r = "../" * depth
    lis = ""
    for label, href in items:
        lis += f'<li><a href="{r}{href}">{label}</a></li>' if href else f'<li>{label}</li>'
    return f'<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>{lis}</ol></nav>'


def breadcrumb_schema(items):
    """items: list of (name, url_path)."""
    els = []
    for i, (name, url) in enumerate(items, start=1):
        els.append('{"@type":"ListItem","position":%d,"name":"%s","item":"%s/%s"}'
                   % (i, name, SITE["domain"], url))
    return ('{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[%s]}'
            % ",".join(els))


def faq_block(items, depth=0):
    """items: list of (question, html answer). Returns (html, schema json)."""
    html = '<div class="faq">'
    for i, (q, a) in enumerate(items):
        html += (f'<details class="reveal"{" open" if i == 0 else ""}><summary>{q}</summary>'
                 f'<div class="faq-body">{a}</div></details>')
    html += '</div>'
    import json
    schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q,
             "acceptedAnswer": {"@type": "Answer", "text": _strip_tags(a)}}
            for q, a in items
        ],
    }
    return html, json.dumps(schema, ensure_ascii=False)


def _strip_tags(html):
    import re
    text = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", text).strip()


def local_business_schema():
    import json
    services = [
        ("Group dog walking", f"From £{PRICES['group_walk']} per 60-minute walk"),
        ("Solo dog walking", f"From £{PRICES['solo_walk']} per 60-minute walk"),
        ("Cat visits and pet check-ins", f"From £{PRICES['check_in']} per visit"),
        ("Puppy pop-ins", f"From £{PRICES['puppy_visit']} per visit"),
        ("Puppy and basic obedience training", f"From £{PRICES['training_session']} per session"),
    ]
    data = {
        "@context": "https://schema.org",
        "@type": ["LocalBusiness", "ProfessionalService"],
        "@id": f"{SITE['domain']}/#business",
        "name": SITE["name"],
        "alternateName": ["Walkies with Gemma", "For Fluff's Sake"],
        "description": (f"One and two hour group dog walks, private field sessions, in-home cat "
                        f"visits and pet check-ins, and puppy training in {SITE['town']}, "
                        f"{SITE['region']}. Fully insured, DBS checked, canine first aid and CPR "
                        f"trained. Established {SITE['founded']}."),
        "url": SITE["domain"] + "/",
        "telephone": SITE["phone_display"],
        "email": SITE["email"],
        "image": f"{SITE['domain']}/assets/img/og.png",
        "logo": f"{SITE['domain']}/assets/img/logo.png",
        "priceRange": "££",
        "currenciesAccepted": "GBP",
        "paymentAccepted": "Bank transfer, card",
        "founder": {"@type": "Person", "name": SITE["owner"], "jobTitle": "Dog walker and trainer"},
        "address": {
            "@type": "PostalAddress",
            "addressLocality": SITE["town"],
            "addressRegion": SITE["region"],
            "postalCode": SITE["postcode"],
            "addressCountry": SITE["country"],
        },
        "geo": {"@type": "GeoCoordinates", "latitude": SITE["lat"], "longitude": SITE["lon"]},
        "hasMap": f"https://www.google.com/maps/search/?api=1&query={SITE['town']}+{SITE['region']}",
        "areaServed": [{"@type": "Place", "name": a} for a in SITE["areas"]],
        "openingHoursSpecification": [
            {"@type": "OpeningHoursSpecification",
             "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
             "opens": "07:30", "closes": "18:00"},
            {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Saturday"],
             "opens": "08:00", "closes": "14:00"},
        ],
        "sameAs": [SITE["instagram"], SITE["facebook"]],
        "foundingDate": SITE["founded"],
        "knowsAbout": ["dog walking", "puppy training", "cat sitting", "pet care", "canine first aid"],
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Pet care services",
            "itemListElement": [
                {"@type": "Offer",
                 "itemOffered": {"@type": "Service", "name": n, "serviceType": n,
                                 "provider": {"@id": f"{SITE['domain']}/#business"}},
                 "description": d, "priceCurrency": "GBP"}
                for n, d in services
            ],
        },
    }
    # Only ever emitted once there are real, countable reviews behind it.
    if SITE["rating"] and SITE["review_count"]:
        data["aggregateRating"] = {
            "@type": "AggregateRating",
            "ratingValue": SITE["rating"],
            "reviewCount": SITE["review_count"],
            "bestRating": "5",
        }
    return json.dumps(data, ensure_ascii=False)


def service_schema(name, description, url, price, unit="per visit"):
    import json
    data = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": name,
        "serviceType": name,
        "description": description,
        "url": f"{SITE['domain']}/{url}",
        "provider": {"@id": f"{SITE['domain']}/#business"},
        "areaServed": [{"@type": "Place", "name": a} for a in SITE["areas"]],
        "offers": {
            "@type": "Offer",
            "price": price,
            "priceCurrency": "GBP",
            "availability": "https://schema.org/InStock",
            "description": f"From £{price} {unit}",
            "url": f"{SITE['domain']}/book.html",
        },
    }
    return json.dumps(data, ensure_ascii=False)


# --------------------------------------------------------------------------- #
# Shared sections
# --------------------------------------------------------------------------- #
TRUST_ITEMS = [
    ("shield", "Fully insured"),
    ("id-card", "DBS checked"),
    ("first-aid", "Canine first aid &amp; CPR trained"),
    ("route", "Tractive GPS on every walk"),
    ("camera", "Photo report after every visit"),
    ("users", "1 &amp; 2 hour group walks"),
    ("leaf", "Routes rotated every week"),
    ("heart", "Free meet &amp; greet"),
    ("calendar", f"Walking {SITE['town']}'s dogs since {SITE['founded']}"),
]


def trust_strip():
    items = "".join(f'<span class="marquee-item">{icon(i, 19)}{t}</span>' for i, t in TRUST_ITEMS)
    return f'''<section class="trust-strip" aria-label="Why you can relax">
  <div class="marquee" data-marquee>{items}</div>
</section>'''


# Real client reviews only. Paste them in as
#     (quote, who, where, portrait)
# where portrait is one of pet-golden / pet-lab / pet-cockapoo / pet-shepherd /
# pet-cat (or "" for no photo). Copy them word for word from Facebook, Google or
# Nextdoor and use the name as the reviewer wrote it — first name and initial is
# plenty. While this list is empty the site shows the "reviews live over here"
# panel below instead, so nothing on the page is ever made up.
TESTIMONIALS = []


def testimonials_section(depth=0):
    r = "../" * depth

    if not TESTIMONIALS:
        return f'''<section class="section band-pink" id="reviews">
  <div class="container" style="max-width:52rem">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('heart-solid', 14)} Wall of woof</span>
      <h2>Happy dogs in {SITE['town']} since {SITE['founded']}</h2>
      <p class="lede">The reviews live where the photos live — on Facebook and Instagram, with
        muddy paws attached. Have a scroll before you book.</p>
    </div>
    <div class="grid grid-2 reveal">
      <a class="card" href="{SITE['facebook']}" rel="noopener">
        <span class="feature-icon">{icon('facebook', 20)}</span>
        <h3 class="mt-2">Recommendations on Facebook</h3>
        <p>Client recommendations, walk photos and the daily chaos, posted since
          {SITE['founded']}.</p>
        <span class="link-arrow mt-2">Read the reviews {icon('arrow-right', 16)}</span>
      </a>
      <a class="card" href="{SITE['instagram']}" rel="noopener">
        <span class="feature-icon green">{icon('instagram', 20)}</span>
        <h3 class="mt-2">Every walk on Instagram</h3>
        <p>Nearly 2,000 posts of other people's dogs having the best hour of their day.</p>
        <span class="link-arrow mt-2">See the pack {icon('arrow-right', 16)}</span>
      </a>
    </div>
    <p class="center dim small mt-4 reveal">Happy to put you in touch with a current client before
      you book — just ask.</p>
  </div>
</section>'''

    def card(t):
        quote, who, where, img = t
        photo = (f'<img src="{r}assets/img/{img}.png" alt="" width="42" height="42" '
                 f'loading="lazy" decoding="async">') if img else ""
        return (f'<figure class="quote"><span class="stars" aria-hidden="true">'
                f'{"".join(icon("star-solid", 16) for _ in range(5))}</span>'
                f'<p>“{quote}”</p><figcaption>{photo}'
                f'<span><strong>{who}</strong><small>{where}</small></span></figcaption></figure>')

    half = max(1, (len(TESTIMONIALS) + 1) // 2)
    row1 = "".join(card(t) for t in TESTIMONIALS[:half])
    row2 = "".join(card(t) for t in TESTIMONIALS[half:]) or row1
    summary = ""
    if SITE["rating"] and SITE["review_count"]:
        summary = f'''
  <div class="container center mt-4">
    <p class="rating-summary">{stars()} <strong>{SITE['rating']} out of 5</strong>
      <span class="dim">from {SITE['review_count']} reviews across Google &amp; Facebook</span></p>
  </div>'''
    return f'''<section class="section band-pink" id="reviews">
  <div class="container section-head center reveal">
    <span class="eyebrow">{icon('heart-solid', 14)} Wall of woof</span>
    <h2>What {SITE['town']} says</h2>
    <p class="lede">The reviews that matter most come with muddy paws attached.</p>
  </div>
  <div class="testimonial-rows">
    <div class="t-row" data-marquee>{row1}</div>
    <div class="t-row reverse" data-marquee>{row2}</div>
  </div>{summary}
</section>'''


def cta_band(depth=0, title="Ready when you are", sub=None, primary="Book a free meet &amp; greet"):
    r = "../" * depth
    sub = sub or ("Every booking starts with a free, no-obligation meet &amp; greet — a cuppa, a "
                  "sniff, a chat about your pet's quirks. No contracts, no pressure.")
    return f'''<section class="section band-green cta-band" id="book-cta">
  <div class="container reveal">
    <span class="eyebrow on-green">{icon('paw', 14)} Let's meet the fluff</span>
    <h2>{title}</h2>
    <p class="lede mx-auto measure mt-2">{sub}</p>
    <div class="flex wrap gap-1 justify-center mt-4">
      <a class="btn btn-primary btn-lg" href="{r}book.html">{primary} {icon('arrow-right', 18)}</a>
      <a class="btn btn-white btn-lg" href="tel:{SITE['phone_link']}">{icon('phone', 18)} {SITE['phone_display']}</a>
    </div>
    <div class="grid grid-3 mt-5" style="text-align:left">
      <div class="cta-card"><strong>{icon('clock', 18)} Replies within the hour</strong>
        <p class="small">Usually a lot faster. Message on WhatsApp if that's easier.</p></div>
      <div class="cta-card"><strong>{icon('calendar', 18)} Flexible days</strong>
        <p class="small">Regular slots or one-offs. Change or cancel with 24 hours' notice.</p></div>
      <div class="cta-card"><strong>{icon('shield', 18)} Insured &amp; DBS checked</strong>
        <p class="small">Paperwork shown at the meet &amp; greet, no need to ask.</p></div>
    </div>
  </div>
</section>'''
