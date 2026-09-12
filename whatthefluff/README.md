# What the Fluff — website mock-up

**Live at [what-the-fluff-36e9.netlify.app](https://what-the-fluff-36e9.netlify.app)**
(Netlify project `what-the-fluff-36e9`). Rename the project or add a custom domain
in the Netlify dashboard; when the domain changes, update `SITE["domain"]` in
`_build/site_config.py` and rebuild so the canonicals, Open Graph tags, sitemap
and schema follow it.

A complete, production-shaped marketing site for **What the Fluff** — Gemma's dog
walking, cat visit and puppy training business in Greenhithe, Kent (formerly
*Walkies with Gemma*, briefly *For Fluff's Sake*). Static HTML, no framework,
nothing to install to deploy — upload the folder.

Built from the rebrand poster: the logo is redrawn as SVG (so it stays crisp at
any size and can be recoloured), and the palette is sampled straight from the
artwork — deep forest green `#1F4B32`, blush `#FDE7EE`, brand pink `#F5739D`.

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

## What's real, and where it came from

These details are taken from the public *Walkies with Gemma* listings and are used
throughout the site. Check them anyway — listings go stale.

| Detail | Used for |
|---|---|
| Greenhithe, Kent (DA9) | Every page title, the areas page, `LocalBusiness` schema |
| 07875 129614 | Click-to-call, WhatsApp, footer, schema |
| walkieswithgemma@gmail.com | Footer, booking page, schema |
| [facebook.com/walkieswithgemmauk](https://www.facebook.com/walkieswithgemmauk/) · [instagram.com/walkieswithgemma](https://www.instagram.com/walkieswithgemma/) | Footer, reviews section, `sameAs` schema |
| Trading since 2020 | About page, stats row, "since 2020" lines |
| 1 and 2 hour group walks, private field sessions, cat visits, small animal care, in-home pet sitting | Services, pricing, schema offer catalogue |
| Never the same place more than twice a week — security and enrichment | A differentiator, used on the home page, dog walking page and FAQs |
| Fully insured · DBS checked · canine first aid **and CPR** trained | Trust strip, FAQs, about page |
| Volunteered at Battersea, fostered for Bow Lodge Cat Rescue | About page |

Sources: the Google listing you shared, the
[Nextdoor page](https://nextdoor.co.uk/pages/gl-dog-walking-pet-care-greenhithe-england/),
and the Facebook and Instagram profiles. Note `walkieswithgemma.co.uk` is now a
parked domain — worth checking whether it can be recovered, or buying one for the
new name.

## ⚠️ Before you point customers at it

It's live, but four things still need Gemma's word.

1. **Prices.** Everything in `PRICES` (`_build/site_config.py`) is a plausible
   north-Kent rate, not her rate: £16 for a one-hour group walk, £24 for two
   hours, £22 solo, £25 private field, £13 cat visit, £45 training. Change them
   and rebuild.
2. **Reviews.** `TESTIMONIALS` in `_build/site_config.py` is **deliberately
   empty** — I won't write fake reviews, and invented ones are both dishonest and
   a Google manual-action risk. While it's empty the reviews section shows a
   "the reviews live on Facebook and Instagram" panel instead. Paste real quotes
   in (there's a worked example in the comment above the list) and the scrolling
   wall of reviews appears automatically. Set `rating` and `review_count` in
   `SITE` only once there's a real, countable number — that's what switches the
   `aggregateRating` schema back on.
3. **Claims to confirm.** The site says photo updates after every visit, Tractive
   GPS on every walk, collection and drop-off, a towel-off before they're left,
   a 24-hour cancellation policy, bank transfer monthly in arrears, and a
   ventilated van with individual crates. All are normal and all are on-brand —
   but they're claims about her business, so she should confirm each one. Search
   the `_build/` files for any phrase to change it.
4. **Group size.** The strongest thing a small walker can say is a hard number —
   "never more than four dogs". I didn't know hers, so the copy says "small,
   matched groups" throughout. If there's a real cap, search for
   `small, matched group` and put the number in; it will lift conversion more
   than anything else on the page.

Also: the animal photos are cut out of the rebrand poster — swap in real photos of
the actual dogs when there's time, because they convert better than stock.

The site is currently crawlable. If you'd rather it stayed out of Google until the
prices are confirmed, add this to `netlify.toml` and redeploy:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Robots-Tag = "noindex"
```

The booking form is **front-end only**. It validates, steps through and shows a
success state, but nothing is sent anywhere yet. See "Wiring up the form" below.

---

## Deploying

The site is linked to the Netlify project in `.netlify/state.json`, and
`netlify.toml` publishes this folder as-is (no build step) with long cache headers
on the fonts and images, a few tidy redirects, and the generator source blocked
from the web. To redeploy after a rebuild:

```sh
python3 _build/build.py
npx -y @netlify/mcp@latest --site-id 4f47ec2f-807b-43b7-9d37-9b78bbf06c67
```

or drag this folder onto app.netlify.com, or connect the repo with base directory
`whatthefluff`.

## Running it

Any static server:

```sh
cd whatthefluff
python3 -m http.server 8000     # then open http://localhost:8000
```

## Rebuilding

The HTML is generated so the header, footer, schema and shared sections stay
identical across 14 pages. Edit the Python, not the HTML.

```sh
python3 _build/build.py         # writes all pages + sitemap.xml + robots.txt
python3 _build/make_images.py   # favicon, app icons, Open Graph card (needs Playwright)
python3 _build/make_fonts.py    # re-downloads + subsets the fonts (needs fonttools)
```

- `_build/site_config.py` — business details, prices, testimonials, icons, logo,
  header/footer, shared sections (trust strip, reviews, CTA band), schema builders.
- `_build/pages_home.py`, `pages_services.py`, `pages_more.py`, `pages_guides.py` — page content.
- `build.py` also wraps every `<img>` in a `<picture>` with a WebP source, so the
  markup stays readable and the browser still gets the small file.

---

## What's in it for traffic

- **Local SEO**: `LocalBusiness` + `ProfessionalService` JSON-LD with `areaServed`
  (all ten villages), opening hours, geo, founding date, offer catalogue and
  founder. `Service` schema on each service page, `FAQPage` on six pages,
  `BreadcrumbList` everywhere, `Article` on each guide.
- **Landing pages that match how people search**: "dog walker in Greenhithe",
  "cat visits", "puppy training", plus a village-by-village areas page covering
  Swanscombe, Stone, Knockhall, Ingress Park, Ebbsfleet, Northfleet, Dartford,
  Bean and Betsham.
- **Guides targeting high-volume informational queries** — what a dog walker
  costs, how long you can leave a cat, a puppy socialisation checklist — each
  linking back into the service and booking pages.
- Unique titles (≤60 chars) and meta descriptions (≤160), canonicals, Open Graph
  and Twitter cards with a custom 1200×630 image, `sitemap.xml`, `robots.txt`.
- Clean semantics: one `<h1>` per page, no heading-level jumps, descriptive alt
  text, breadcrumbs.

## What's in it for conversion

- One primary action everywhere — **Book a free meet & greet** — in the nav, the
  hero, after every section, and in a sticky bar on mobile.
- Risk reversal at each decision point: free, no contract, no payment now,
  24-hour cancellation.
- Trust signals above the fold and in a rolling strip: insured, DBS checked,
  canine first aid and CPR, GPS tracked, 1 and 2 hour walks, routes rotated.
- Transparent prices on their own page and in-line — no "contact us for a quote".
- A three-step booking form (pick service → pet details → contact) instead of one
  long one, with inline validation and a success state.
- Click-to-call and WhatsApp links on every page for people who hate forms.

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

Then add conversion tracking (GA4 `generate_lead`, or a Meta pixel) inside the
same submit handler.

## Performance and accessibility

- ~350 KB on first load, no framework, no blocking JavaScript (one deferred 8 KB file).
- Fonts self-hosted, subset to the glyphs actually used (Caveat pinned to one
  weight), preloaded, `font-display: swap`.
- Images are WebP with PNG fallbacks, sized, `loading="lazy"` below the fold,
  `fetchpriority="high"` on the hero.
- Every animation is gated behind `prefers-reduced-motion`.
- Colour contrast meets WCAG AA (the CTA pink was darkened from `#F5739D` to a
  `#C2185B → #D6316A` gradient to clear 4.5:1 against white text — the lighter
  brand pink is still used for everything decorative).
- Keyboard accessible: skip link, visible focus rings, Escape closes the mobile
  menu, form steps move focus to the new heading.

## Next steps once it's live

1. Update the **Google Business Profile** to the new name — Google allows a
   rename, and keeping the existing profile keeps the reviews and the map
   position that took five years to earn. Do not create a new listing.
2. Same on Facebook and Instagram: rename the existing pages rather than starting
   again, and put the new URL in both bios.
3. Ask the last 20 happy clients for a Google review, then paste the best three or
   four into `TESTIMONIALS`.
4. Add analytics (GA4 or Plausible) and track `book.html` submissions as conversions.
5. Publish one guide a month — seasonal ones do well (fireworks, heatwave paw
   safety, Christmas cat cover).
6. Get listed in the Greenhithe, Swanscombe and Dartford community Facebook groups
   and on Nextdoor with a link.

## Credits

- Logo redrawn as SVG from the brand poster; animal photos cut out of the same poster.
- Fonts: Plus Jakarta Sans, Baloo 2, Caveat — SIL Open Font License 1.1.
- Icons hand-drawn as inline SVG in `_build/site_config.py`, no icon library.
