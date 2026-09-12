# What the Fluff — website mock-up

A complete, production-shaped marketing site for **What the Fluff**, a dog walking,
cat visit and puppy training business. Static HTML, no framework, no build step to
deploy — just upload the folder.

Built from the rebrand poster: the logo is redrawn as SVG (so it stays crisp at any
size and can be recoloured), and the palette is sampled straight from the artwork —
deep forest green `#1F4B32`, blush `#FDE7EE`, brand pink `#F5739D`.

```
whatthefluff/
├── index.html                 home page
├── services/                  services hub + 3 service landing pages
├── guides/                    guides hub + 3 long-form articles (organic traffic)
├── pricing.html  areas.html  about.html  book.html  404.html
├── sitemap.xml  robots.txt  manifest.webmanifest  favicon.svg
├── assets/  css · js · img · fonts
└── _build/                    the generator that writes the HTML (see below)
```

---

## ⚠️ Before you publish

Everything below is **illustrative placeholder content** and must be replaced with
real details. Publishing invented reviews or credentials would be misleading — and
the review schema would be a Google penalty waiting to happen.

| What | Where | Currently |
|---|---|---|
| Business name, phone, email, postcode, domain | `_build/site_config.py` → `SITE` | `07700 900123` (Ofcom's reserved fictional range), `whatthefluff.co.uk` |
| Town and village names | `SITE["town"]`, `SITE["areas"]`, `AREA_COPY` in `_build/pages_more.py` | Hartley Green, Oakwood, Willowbrook… — all invented |
| Prices | `_build/site_config.py` → `PRICES` | Plausible 2026 UK mid-market rates |
| **Testimonials** | `TESTIMONIALS` in `_build/site_config.py` | **Written for the mock-up — replace with real reviews** |
| **Rating + review count** | `SITE["rating"]`, `SITE["review_count"]` — also feeds `aggregateRating` schema | **4.9 / 87 is invented** |
| **Stats** (9,400 walks, 120 families) | `pages_home.py`, the `data-count` attributes | **Invented** |
| Credentials (insurance, DBS, first aid) | Throughout the copy | Claimed everywhere — make sure they're all true |
| Social links | `SITE["instagram"]`, `SITE["facebook"]` | Placeholder URLs |
| Pet photos | `assets/img/pack.png`, `pet-*.png` | Cut out of the rebrand poster. Swap in real photos of the actual dogs — they convert better anyway |

The booking form is **front-end only**. It validates, steps through and shows a
success state, but nothing is sent anywhere. See “Wiring up the form” below.

---

## Running it

Any static server:

```sh
cd whatthefluff
python3 -m http.server 8000     # then open http://localhost:8000
```

## Rebuilding

The HTML is generated so that the header, footer, schema and shared sections stay
identical across 14 pages. Edit the Python, not the HTML.

```sh
python3 _build/build.py         # writes all pages + sitemap.xml + robots.txt
python3 _build/make_images.py   # favicon, app icons, Open Graph card (needs Playwright)
python3 _build/make_fonts.py    # re-downloads + subsets the fonts (needs fonttools)
```

- `_build/site_config.py` — all business details, prices, icons, logo, header/footer,
  shared sections (trust strip, testimonials, CTA band), schema builders.
- `_build/pages_home.py`, `pages_services.py`, `pages_more.py`, `pages_guides.py` — page content.
- `build.py` also wraps every `<img>` in a `<picture>` with a WebP source, so the
  markup stays readable and the browser still gets the small file.

---

## What's in it for traffic

- **Local SEO**: `LocalBusiness` + `ProfessionalService` JSON-LD with `areaServed`,
  opening hours, geo, price range, offer catalogue and founder. `Service` schema on
  each service page, `FAQPage` on six pages, `BreadcrumbList` everywhere, `Article`
  on each guide.
- **Landing pages that match how people search**: "dog walker in {town}",
  "cat visits", "puppy training", plus a village-by-village areas page.
- **Guides targeting high-volume informational queries** — what a dog walker costs,
  how long you can leave a cat, a puppy socialisation checklist — each linking back
  into the service and booking pages.
- Unique titles (≤60 chars) and meta descriptions (≤160), canonicals, Open Graph and
  Twitter cards with a custom 1200×630 image, `sitemap.xml`, `robots.txt`.
- Clean semantics: one `<h1>` per page, no heading-level jumps, descriptive alt text,
  breadcrumbs.

## What's in it for conversion

- One primary action everywhere — **Book a free meet & greet** — in the nav, the hero,
  after every section, and in a sticky bar on mobile.
- Risk reversal repeated at each decision point: free, no contract, no payment now,
  24-hour cancellation.
- Trust signals above the fold and in a rolling strip: insured, DBS checked, canine
  first aid, GPS tracked, four dogs maximum.
- Transparent prices on their own page and in-line — no "contact us for a quote".
- A three-step booking form (pick service → pet details → contact) instead of one long
  one, with inline validation and a success state.
- Click-to-call and WhatsApp links on every page for people who hate forms.
- Social proof next to every call to action.

## Wiring up the form

`assets/js/main.js` handles validation and the success state. To actually receive
submissions, pick one:

- **Netlify** — add `name="booking" data-netlify="true"` to the `<form>` in
  `_build/pages_more.py`, rebuild, and remove `e.preventDefault()` from the submit
  handler (or post with `fetch` and keep the success card).
- **Formspree / Getform / Basin** — set `action="https://formspree.io/f/xxxx"`
  `method="POST"`, then `fetch(form.action, { method:'POST', body:new FormData(form) })`
  in the submit handler before showing the success card.
- **Email only** — simplest possible: make the submit button a `mailto:` link.

Then add conversion tracking (GA4 `generate_lead`, or a Meta pixel) inside the same
submit handler.

## Performance and accessibility

- ~350 KB on first load, no framework, no blocking JavaScript (single deferred 8 KB file).
- Fonts self-hosted, subset to the glyphs actually used (Caveat pinned to one weight),
  preloaded, `font-display: swap`.
- Images are WebP with PNG fallbacks, sized, `loading="lazy"` below the fold,
  `fetchpriority="high"` on the hero.
- Every animation is gated behind `prefers-reduced-motion`.
- Colour contrast meets WCAG AA (the CTA pink was darkened from `#F5739D` to a
  `#C2185B → #D6316A` gradient to clear 4.5:1 against white text — the lighter brand
  pink is still used for everything decorative).
- Keyboard accessible: skip link, visible focus rings, Escape closes the mobile menu,
  form steps move focus to the new heading.

## Next steps once it's live

1. Claim and fill in the **Google Business Profile** — for a local pet business it
   drives more enquiries than the website alone. Same name, address and phone as the
   footer, exactly.
2. Ask the last 20 happy clients for a Google review, then swap the real quotes and
   the real rating into `site_config.py`.
3. Add analytics (GA4 or Plausible) and track `book.html` submissions as conversions.
4. Publish one guide a month — seasonal ones do well (fireworks, heatwave paw safety,
   Christmas cat cover).
5. Get listed on local directories and the village Facebook groups with a link.

## Credits

- Logo redrawn as SVG from the brand poster; animal photos cut out of the same poster.
- Fonts: Plus Jakarta Sans, Baloo 2, Caveat — SIL Open Font License 1.1.
- Icons hand-drawn as inline SVG in `_build/site_config.py`, no icon library.
