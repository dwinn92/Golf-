"""Pricing, areas, about, booking and 404 pages."""
from site_config import (SITE, PRICES, icon, logo_svg, trust_strip, testimonials_section,
                         cta_band, faq_block, breadcrumbs, breadcrumb_schema)

D = 0
R = ""


# --------------------------------------------------------------------------- #
# Pricing
# --------------------------------------------------------------------------- #
def pricing():
    rows = [
        ("Group adventure walk", "1 hour", f"£{PRICES['group_walk']}",
         "Small matched group, collection and drop-off, GPS route, photo report"),
        ("Group adventure walk", "2 hours", f"£{PRICES['group_walk_2h']}",
         "The full empty-the-tank walk. Same group, twice the sniffing"),
        ("Group walk — block of 5", "5 × 1 hour", f"£{PRICES['bundle_5']}",
         "Save £5. Used within 3 weeks, any days you like"),
        ("Private field session", "1 hour", f"£{PRICES['field_session']}",
         "Secure fenced field, your dog only — perfect for recall practice"),
        ("Solo walk", "60 minutes", f"£{PRICES['solo_walk']}",
         "One-to-one, quiet routes, training built in"),
        ("Solo walk — short", "30 minutes", f"£{PRICES['solo_walk_30']}",
         "Perfect for seniors, post-op recovery and hot days"),
        ("Cat visit / pet check-in", "30 minutes", f"£{PRICES['check_in']}",
         "Food, water, litter, medication, play, post and plants"),
        ("Two visits in one day", "2 × 30 minutes", "£24",
         "Recommended for kittens, seniors and medicated pets"),
        ("Puppy pop-in", "30 minutes", f"£{PRICES['puppy_visit']}",
         "Toilet break, meal, short training, settle"),
        ("Training — single session", "60 minutes", f"£{PRICES['training_session']}",
         "In your home or on your route, written plan included"),
        ("Training — puppy package", "4 × 60 minutes", f"£{PRICES['training_package']}",
         "Save £20, plus 8 weeks of WhatsApp support"),
        ("Extra pet, same household", "per visit", "£3",
         "Second dog on a walk, extra cat at a check-in"),
        ("Bank holiday surcharge", "per visit", "+50%",
         "Christmas Day, Boxing Day and New Year's Day booked by 1 December"),
        ("Meet &amp; greet", "30 minutes", "Free",
         "Always. Every time. No obligation to book anything"),
    ]
    table_rows = "".join(
        f"<tr><td><strong>{n}</strong></td><td>{d}</td><td><strong>{p}</strong></td><td class='dim'>{x}</td></tr>"
        for n, d, p, x in rows)

    faqs = [
        ("How and when do I pay?",
         "<p>Bank transfer, monthly in arrears for regular clients — you get an itemised invoice on "
         "the 1st listing every walk and visit. One-offs and holiday cover are paid in advance. No "
         "booking fees, no card surcharges, no joining fee.</p>"),
        ("Do prices go up in winter or at peak times?",
         "<p>No. The price is the price whether it's a bright June morning or a horizontal-rain "
         "February afternoon. The only exception is the bank holiday surcharge, which is listed "
         "above.</p>"),
        ("What's your cancellation policy?",
         "<p>Cancel or move a walk with 24 hours' notice and there's no charge. Inside 24 hours the "
         "slot is charged in full, because it can't be refilled that late. Holiday bookings can be "
         "cancelled free up to seven days before.</p>"),
        ("Is there a minimum booking?",
         "<p>No minimum and no contract. Most families settle into two or three walks a week, but "
         "one-offs are genuinely welcome — including the emergency 'my meeting moved' ones.</p>"),
        ("Do you charge for travel?",
         f"<p>Not within the areas listed on the <a href='areas.html'>areas page</a>. Further out, "
         f"ask — if I'm already passing, it's usually still the standard price.</p>"),
        ("What if I have two dogs?",
         "<p>The second dog from the same household is £3 rather than a second full walk, as long as "
         "they're happy walking together. They still take two of the spaces in the group.</p>"),
    ]
    faq_html, faq_schema = faq_block(faqs)

    body = f'''<section class="page-hero">
  <div class="container">
    {breadcrumbs([("Home", "index.html"), ("Prices", None)])}
    <div class="section-head reveal">
      <span class="eyebrow">{icon('gift', 14)} Prices</span>
      <h1>Every price, on one page</h1>
      <p class="lede">No "contact us for a quote", no packages you have to decode. This is what
        things cost in {SITE['town']}, and it includes travel, treats, towels, GPS tracking and
        photos.</p>
      <div class="hero-actions">
        <a class="btn btn-primary btn-lg" href="book.html">Book a free meet &amp; greet {icon('arrow-right', 18)}</a>
        <a class="btn btn-ghost btn-lg" href="tel:{SITE['phone_link']}">{icon('phone', 18)} {SITE['phone_display']}</a>
      </div>
    </div>
  </div>
</section>
{trust_strip()}

<section class="section">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('paw', 14)} Most booked</span>
      <h2>The three people ask for most</h2>
    </div>
    <div class="grid grid-3 price-grid">
      <div class="card price-card reveal">
        <h3>Solo walk</h3>
        <p class="dim small">One-to-one, at your dog's pace, on the quiet routes.</p>
        <p class="amount"><sup>£</sup>{PRICES['solo_walk']} <small>/ 60 min</small></p>
        <ul>
          <li>{icon('check', 16)} Reactive, nervous or elderly dogs welcome</li>
          <li>{icon('check', 16)} Training built into every walk</li>
          <li>{icon('check', 16)} 30-minute option £{PRICES['solo_walk_30']}</li>
        </ul>
        <a class="btn btn-ghost btn-block" href="book.html?service=solo-walk">Book a solo walk</a>
      </div>
      <div class="card price-card featured reveal reveal-delay-1">
        <span class="badge-pill pink">Most popular</span>
        <h3>Group adventure walk</h3>
        <p class="dim small">An hour of woods, water and friends — or two, if they've got it in
          them. Small, matched groups.</p>
        <p class="amount"><sup>£</sup>{PRICES['group_walk']} <small>/ 1 hour</small></p>
        <ul>
          <li>{icon('check', 16)} Two-hour walk £{PRICES['group_walk_2h']}</li>
          <li>{icon('check', 16)} Collection, drop-off, GPS route and photos</li>
          <li>{icon('check', 16)} Block of five £{PRICES['bundle_5']}</li>
        </ul>
        <a class="btn btn-primary btn-block" href="book.html?service=group-walk">Book a group walk</a>
      </div>
      <div class="card price-card reveal reveal-delay-2">
        <h3>Cat visit / check-in</h3>
        <p class="dim small">Your pets, your house, your routine — kept exactly as it is.</p>
        <p class="amount"><sup>£</sup>{PRICES['check_in']} <small>/ 30 min</small></p>
        <ul>
          <li>{icon('check', 16)} Food, water, litter and medication</li>
          <li>{icon('check', 16)} Post, plants, curtains and lights</li>
          <li>{icon('check', 16)} Two visits a day £24</li>
        </ul>
        <a class="btn btn-ghost btn-block" href="book.html?service=cat-visit">Book a check-in</a>
      </div>
    </div>

    <div class="mt-5 reveal">
      <h2 class="mb-3">The full list</h2>
      <div class="table-wrap card" style="padding:0">
        <table class="data-table">
          <thead><tr><th>Service</th><th>Length</th><th>Price</th><th>What's included</th></tr></thead>
          <tbody>{table_rows}</tbody>
        </table>
      </div>
      <p class="small dim">Prices are per visit and include everything listed. Multi-pet discount
        applies to additional pets in the same household.</p>
    </div>

    <div class="grid grid-3 mt-5">
      <div class="card reveal"><span class="feature-icon">{icon('heart', 20)}</span>
        <h3 class="mt-2">Free meet &amp; greet</h3>
        <p>Half an hour, at your home, before you commit to anything at all.</p></div>
      <div class="card reveal reveal-delay-1"><span class="feature-icon green">{icon('calendar', 20)}</span>
        <h3 class="mt-2">No contracts</h3>
        <p>Change days, pause for a holiday or stop entirely. Just tell me.</p></div>
      <div class="card reveal reveal-delay-2"><span class="feature-icon">{icon('check-circle', 20)}</span>
        <h3 class="mt-2">24-hour cancellation</h3>
        <p>Life happens. Give me a day's notice and there's nothing to pay.</p></div>
    </div>
  </div>
</section>

<section class="section band-cream">
  <div class="container" style="max-width:52rem">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('message', 14)} Money questions</span>
      <h2>Payment, cancellations and the small print</h2>
    </div>
    {faq_html}
  </div>
</section>
{testimonials_section()}
{cta_band(title="Know exactly what you'll pay")}'''

    schema = [faq_schema, breadcrumb_schema([("Home", ""), ("Prices", "pricing.html")])]
    return ("pricing.html", dict(
        title=f"Dog Walking Prices in {SITE['town']} | From £{PRICES['group_walk']} | {SITE['name']}",
        description=(f"{SITE['town']} pet care prices in full: group walks £{PRICES['group_walk']}, "
                     f"solo walks £{PRICES['solo_walk']}, cat visits £{PRICES['check_in']}, training "
                     f"from £{PRICES['training_session']}. No booking fees, no contracts."),
        path="pricing.html", body=body, active="pricing", schema=schema), "monthly", "0.9")


# --------------------------------------------------------------------------- #
# Areas
# --------------------------------------------------------------------------- #
AREA_COPY = {
    "Greenhithe": ("Home turf, and where most days start. Short pick-ups, flexible timings and the "
                   "occasional emergency slot when your day falls apart — plus the Thames on the "
                   "doorstep for a proper riverside sniff.",
                   "the Thames Path and Ingress Park"),
    "Swanscombe": ("A minute up the road, with Swanscombe Heritage Park and the peninsula's open "
                   "grassland close by — big skies, big smells and space to actually stretch out.",
                   "Swanscombe Heritage Park"),
    "Stone": ("Stone Lodge and the fields behind it make for flat, easy walking, which suits "
              "senior dogs and anyone recovering from an op.",
              "Stone Lodge and the surrounding fields"),
    "Knockhall": ("Quiet residential streets on the hill above the river. A popular postcode for "
                  "lunchtime cat visits and puppy pop-ins while owners are at work.",
                  "the Knockhall streets down to the riverside"),
    "Ingress Park": ("Landscaped riverside grounds and a lot of young dogs in flats and townhouses "
                     "who genuinely need their two hours out.",
                     "the Ingress Abbey grounds and riverside path"),
    "Ebbsfleet": ("Garden City new-builds, small gardens and a lot of first-time owners — puppy "
                  "pop-ins and socialisation walks make up most of the Ebbsfleet week.",
                  "Springhead Park and the Ebbsfleet green spaces"),
    "Northfleet": ("A short hop along the A226. Riverside routes and quiet green pockets, good for "
                   "dogs who'd rather not meet half the neighbourhood.",
                   "the riverside paths towards Gravesend"),
    "Dartford": ("Spoilt for choice — Central Park, Brooklands Lakes and the wide open heath. The "
                 "best off-lead recall practice anywhere nearby.",
                 "Dartford Heath and Central Park"),
    "Bean": ("Village lanes with the woods right there. A favourite for slow, sniffy walks and for "
             "dogs who find busier parks a bit much.",
             "the woodland around Bean and Darenth Country Park"),
    "Betsham": ("Out towards Southfleet — lanes, farmland and almost nobody about, which is exactly "
                "why the nervous dogs go there.",
                "the lanes towards Southfleet"),
}


def areas():
    blocks = ""
    for i, area in enumerate(SITE["areas"]):
        copy, spot = AREA_COPY[area]
        slug = area.lower().replace(" ", "-")
        blocks += f'''<article class="card reveal{f" reveal-delay-{i % 3}" if i % 3 else ""}" id="{slug}">
      <span class="feature-icon{" green" if i % 2 else ""}">{icon('map-pin', 20)}</span>
      <h3 class="mt-2">Dog walking in {area}</h3>
      <p>{copy}</p>
      <p class="small dim mt-2">{icon('leaf', 14)} Green space nearby: {spot}</p>
      <a class="link-arrow mt-2" href="book.html">Book in {area} {icon('arrow-right', 16)}</a>
    </article>'''

    faqs = [
        ("I'm just outside your areas — can you still come?",
         f"<p>Ask. If you're within about fifteen minutes of {SITE['town']} and your timing fits an "
         f"existing round, the answer is usually yes at the standard price. Further than that and "
         f"I'd rather recommend someone closer than give your pet a long van journey.</p>"),
        ("Do you charge extra for travel?",
         "<p>No travel charges anywhere on this page. The price you see on the "
         "<a href='pricing.html'>prices page</a> is the price you pay.</p>"),
        ("How quickly can you start?",
         "<p>Usually within a week: a meet &amp; greet in the next few days, then your first walk. "
         "September and January are the busiest months — if you're planning ahead for a new puppy or "
         "a return to the office, message me early.</p>"),
    ]
    faq_html, faq_schema = faq_block(faqs)

    body = f'''<section class="page-hero">
  <div class="container">
    {breadcrumbs([("Home", "index.html"), ("Areas covered", None)])}
    <div class="feature-row" style="align-items:center">
      <div class="reveal">
        <span class="eyebrow">{icon('map-pin', 14)} Areas covered</span>
        <h1>Dog walking and pet visits around {SITE['town']}</h1>
        <p class="lede mt-2">Ten villages, roughly a fifteen-minute drive from {SITE['town']}
          centre. Here's where I walk, what the routes are like and how the week is usually laid
          out.</p>
        <div class="hero-actions">
          <a class="btn btn-primary btn-lg" href="book.html">Check availability {icon('arrow-right', 18)}</a>
          <a class="btn btn-ghost btn-lg" href="https://wa.me/{SITE['whatsapp']}" rel="noopener">
            {icon('whatsapp', 18)} Ask on WhatsApp</a>
        </div>
      </div>
      <div class="feature-media reveal reveal-delay-1">
        <div class="card">
          <h2 class="mb-2" style="font-size:1.5rem">The short version</h2>
          <ul class="feature-list" style="margin-top:0">
            <li><span class="feature-icon">{icon('map-pin', 18)}</span><span><strong>10 villages covered</strong>
              <p>Everywhere within about fifteen minutes of {SITE['town']} centre.</p></span></li>
            <li><span class="feature-icon green">{icon('gift', 18)}</span><span><strong>No travel charges</strong>
              <p>The price on the price list is the price you pay, wherever you are on this page.</p></span></li>
            <li><span class="feature-icon">{icon('calendar', 18)}</span><span><strong>Usually starting within a week</strong>
              <p>Meet &amp; greet in the next few days, first walk right after.</p></span></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>
{trust_strip()}

<section class="section">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('map-pin', 14)} Village by village</span>
      <h2>Where I walk, and what it's like there</h2>
    </div>
    <div class="grid grid-3">{blocks}</div>
  </div>
</section>

<section class="section band-cream">
  <div class="container" style="max-width:52rem">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('message', 14)} Coverage questions</span>
      <h2>Not quite on the list?</h2>
    </div>
    {faq_html}
  </div>
</section>
{cta_band(title=f"Walking in {SITE['town']} since {SITE['founded']}")}'''

    schema = [faq_schema, breadcrumb_schema([("Home", ""), ("Areas covered", "areas.html")])]
    return ("areas.html", dict(
        title=f"Areas Covered | Dog Walker near {SITE['town']} | {SITE['name']}",
        description=(f"Dog walking, cat visits and pet check-ins across "
                     f"{', '.join(SITE['areas'][:3])} and every village within 15 minutes of "
                     f"{SITE['town']}. No travel charges."),
        path="areas.html", body=body, active="areas", schema=schema), "monthly", "0.7")


# --------------------------------------------------------------------------- #
# About
# --------------------------------------------------------------------------- #
def about():
    import json
    person = json.dumps({
        "@context": "https://schema.org",
        "@type": "Person",
        "name": SITE["owner"],
        "jobTitle": "Dog walker, pet sitter and puppy trainer",
        "worksFor": {"@id": f"{SITE['domain']}/#business"},
        "url": f"{SITE['domain']}/about.html",
        "knowsAbout": ["dog walking", "puppy training", "canine first aid", "cat sitting"],
        "address": {"@type": "PostalAddress", "addressLocality": SITE["town"],
                    "addressRegion": SITE["region"], "addressCountry": SITE["country"]},
    }, ensure_ascii=False)

    body = f'''<section class="page-hero">
  <div class="container">
    {breadcrumbs([("Home", "index.html"), ("About", None)])}
    <div class="feature-row">
      <div class="reveal">
        <span class="eyebrow">{icon('heart-solid', 14)} About</span>
        <h1>Hi, I'm {SITE['owner']}</h1>
        <p class="lede mt-2">I've been walking, feeding, training and thoroughly spoiling the
          animals of {SITE['town']} since {SITE['founded']}. Three business names, one very
          consistent obsession.</p>
        <div class="hero-chips">
          <span class="chip">{icon('shield', 16)} Fully insured</span>
          <span class="chip">{icon('id-card', 16)} Enhanced DBS</span>
          <span class="chip">{icon('first-aid', 16)} Canine first aid &amp; CPR</span>
          <span class="chip">{icon('graduation', 16)} Force-free methods</span>
        </div>
      </div>
      <div class="feature-media reveal reveal-delay-1" style="display:grid;place-items:center">
        <div style="width:min(70vw,320px)">{logo_svg(cls="badge-logo", uid="about")}</div>
      </div>
    </div>
  </div>
</section>
{trust_strip()}

<section class="section">
  <div class="container prose mx-auto">
    <h2>Three names, one obsession</h2>
    <p>Walkies with Gemma started in {SITE['founded']}, walking dogs around {SITE['town']} and
      feeding other people's cats. Then it was <strong>For Fluff's Sake</strong>, briefly, because I
      liked the logo. Now it's <strong>What the Fluff</strong> — and this one is staying, I promise.
      Same me, same dogs, same cat visits, same training. Just a name that makes people smile when it
      drives past.</p>
    <p>Before any of it I volunteered at Battersea Dogs &amp; Cats Home and fostered cats for Bow
      Lodge Cat Rescue, which is where I learned the bits you can't get from a course: how a
      frightened dog actually behaves, how long a cat needs to decide about you, and how much a
      quiet, predictable routine is worth to an animal that's had neither.</p>

    <h2>How I work</h2>
    <p>Walks are a full hour or a full two hours, in small groups matched by size, pace and play
      style. Not a rushed twenty minutes round the block with eight dogs on a coupler — the whole
      point of paying someone is that somebody is genuinely watching.</p>
    <p><strong>I never use the same place more than twice in a week.</strong> Partly enrichment: new
      smells, new ground, a dog who comes home properly satisfied rather than bored. Partly security:
      nobody should be able to predict where I'll be with a van full of other people's dogs.</p>
    <p>I train the way the evidence says to train: rewards, patience and setting dogs up to get it
      right. No prong collars, no e-collars, no shouting, no "showing them who's boss". If a dog is
      struggling, the answer is nearly always more distance and more time — not more pressure.</p>
    <p>And I over-communicate. You'll get photos after every visit, honest notes when something isn't
      right, and a phone call rather than a text if it's important. I'd rather tell you about a limp
      on day one than have you find it on day four.</p>

    <h2>The boring, important paperwork</h2>
    <ul>
      <li><strong>Full pet business insurance</strong> — public liability plus care, custody and
        control, which is the cover that matters when your pet is in someone else's hands.</li>
      <li><strong>Enhanced DBS certificate</strong> — current, and shown at every meet &amp; greet
        without being asked.</li>
      <li><strong>Canine first aid and CPR trained</strong> — kept current, with a kit in the van and
        your vet's details on file.</li>
      <li><strong>Written terms and a care plan</strong> — so everyone knows what happens on a snow
        day, a vet day, or the day your flight is delayed.</li>
    </ul>

    <h2>What you're actually buying</h2>
    <p>Not an hour of walking. You're buying the twenty minutes back in your lunch break, the guilt
      that doesn't follow you into your 2pm meeting, and the dog who's asleep instead of pacing when
      you finally get home.</p>
    <blockquote>“Same me. Same dogs. Same walks, cat visits and training. Just a new name — because
      apparently I cannot be trusted around Canva and a logo idea.”</blockquote>
    <p class="hand" style="font-size:2rem;line-height:1.2">Gemma x</p>

    <div class="author-box">
      <img src="assets/img/pet-golden.png" alt="" width="62" height="62" loading="lazy" decoding="async">
      <div>
        <strong>{SITE['owner']} · {SITE['name']}</strong>
        <small>Dog walker, pet sitter and force-free trainer in {SITE['town']}, {SITE['region']}
          since {SITE['founded']}. {SITE['phone_display']} · {SITE['email']}</small>
      </div>
    </div>
  </div>
</section>
{testimonials_section()}
{cta_band(title="Come and meet the pack")}'''

    schema = [person, breadcrumb_schema([("Home", ""), ("About", "about.html")])]
    return ("about.html", dict(
        title=f"About Gemma | Dog Walker in {SITE['town']} | {SITE['name']}",
        description=(f"Meet Gemma — walking, sitting and training pets in {SITE['town']}, "
                     f"{SITE['region']} since {SITE['founded']}. Insured, DBS checked, canine first "
                     f"aid and CPR trained, ex-Battersea volunteer."),
        path="about.html", body=body, active="about", schema=schema), "yearly", "0.6")


# --------------------------------------------------------------------------- #
# Booking
# --------------------------------------------------------------------------- #
def book():
    services = [
        ("group-walk", "dog", "Group dog walk", f"£{PRICES['group_walk']} / 60 min"),
        ("solo-walk", "heart", "Solo dog walk", f"£{PRICES['solo_walk']} / 60 min"),
        ("cat-visit", "cat", "Cat visit / check-in", f"£{PRICES['check_in']} / 30 min"),
        ("puppy-visit", "home", "Puppy pop-in", f"£{PRICES['puppy_visit']} / 30 min"),
        ("training", "graduation", "Training session", f"£{PRICES['training_session']} / 60 min"),
        ("not-sure", "message", "Not sure yet", "Let's talk it through"),
    ]
    choices = "".join(f'''<label class="choice">
        <input type="radio" name="service" value="{v}" required>
        <span class="choice-icon">{icon(ic, 20)}</span>
        <span><strong>{label}</strong><small>{price}</small></span>
      </label>''' for v, ic, label, price in services)

    days = "".join(f'''<label class="choice" style="justify-content:center;text-align:center">
        <input type="checkbox" name="days" value="{d}">
        <span><strong>{d}</strong></span>
      </label>''' for d in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"])

    body = f'''<section class="page-hero">
  <div class="container">
    {breadcrumbs([("Home", "index.html"), ("Book a meet &amp; greet", None)])}
    <div class="feature-row" style="align-items:center">
      <div class="reveal">
        <span class="eyebrow">{icon('calendar', 14)} Free meet &amp; greet</span>
        <h1>Let's get you booked in</h1>
        <p class="lede mt-2">Three quick steps, about sixty seconds. I reply within the hour during
          working hours — and I'll always tell you honestly if I don't have the slot you need.</p>
        <div class="hero-chips">
          <span class="chip">{icon('check-circle', 16)} No payment now</span>
          <span class="chip">{icon('check-circle', 16)} No contract</span>
          <span class="chip">{icon('check-circle', 16)} No obligation</span>
        </div>
      </div>
      <div class="feature-media reveal reveal-delay-1">
        <div class="card">
          <h2 class="mb-2" style="font-size:1.5rem">What happens next</h2>
          <ul class="feature-list" style="margin-top:0">
            <li><span class="feature-icon">{icon('message', 18)}</span><span><strong>1. I reply today</strong>
              <p>A message with the slots I have, and honest advice on what your pet needs.</p></span></li>
            <li><span class="feature-icon green">{icon('home', 18)}</span><span><strong>2. We meet at yours</strong>
              <p>Half an hour, free. Paperwork, keys, quirks — and a very enthusiastic hello.</p></span></li>
            <li><span class="feature-icon">{icon('paw', 18)}</span><span><strong>3. First walk or visit</strong>
              <p>Usually within a week. Photos land in your phone before I've left your road.</p></span></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container" style="max-width:44rem">
    <form class="form-card" data-multistep novalidate>
      <div class="steps-progress" aria-hidden="true">
        <span class="dot"><i></i></span><span class="dot"><i></i></span><span class="dot"><i></i></span>
      </div>

      <div class="form-step is-active">
        <h2 style="font-size:1.6rem">What does your pet need?</h2>
        <p class="dim small mb-3">Pick the closest option — we can change it at the meet &amp; greet.</p>
        <fieldset style="border:0;padding:0">
          <legend class="sr-only">Service</legend>
          <div class="choice-grid">{choices}</div>
          <p class="field-error" style="margin-top:.75rem">Please choose a service.</p>
        </fieldset>
        <div class="form-actions">
          <button class="btn btn-primary btn-block" type="button" data-next>Next {icon('arrow-right', 18)}</button>
        </div>
      </div>

      <div class="form-step">
        <h2 style="font-size:1.6rem">Tell me about them</h2>
        <p class="dim small mb-3">The quirks are the useful part.</p>
        <div class="field-row">
          <div class="field">
            <label for="pet-name">Pet's name</label>
            <input id="pet-name" name="pet_name" type="text" required placeholder="Luna">
            <span class="field-error">Please add your pet's name.</span>
          </div>
          <div class="field">
            <label for="pet-type">Breed or type</label>
            <input id="pet-type" name="pet_type" type="text" placeholder="Cockapoo, 8 months">
          </div>
        </div>
        <div class="field">
          <label>Which days are you after? <span class="hint">Optional — tick any that work</span></label>
          <div class="choice-grid" style="grid-template-columns:repeat(auto-fit,minmax(5.5rem,1fr))">{days}</div>
        </div>
        <div class="field">
          <label for="notes">Anything I should know? <span class="hint">Optional</span></label>
          <textarea id="notes" name="notes" placeholder="Pulls on the lead, terrified of the bin lorry, will sell her soul for cheese."></textarea>
        </div>
        <div class="form-actions">
          <button class="btn btn-ghost" type="button" data-prev>Back</button>
          <button class="btn btn-primary" type="button" data-next style="flex:1">Next {icon('arrow-right', 18)}</button>
        </div>
      </div>

      <div class="form-step">
        <h2 style="font-size:1.6rem">How do I reach you?</h2>
        <p class="dim small mb-3">I'll message first — nobody likes a surprise phone call.</p>
        <div class="field">
          <label for="name">Your name</label>
          <input id="name" name="name" type="text" autocomplete="name" required placeholder="Sarah Hughes">
          <span class="field-error">Please add your name.</span>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="phone">Mobile</label>
            <input id="phone" name="phone" type="tel" autocomplete="tel" required placeholder="07700 900123">
            <span class="field-error">Please add a number I can reach you on.</span>
          </div>
          <div class="field">
            <label for="email">Email <span class="hint">Optional</span></label>
            <input id="email" name="email" type="email" autocomplete="email" placeholder="you@email.com">
          </div>
        </div>
        <div class="field">
          <label for="postcode">Postcode</label>
          <input id="postcode" name="postcode" type="text" autocomplete="postal-code" required
                 placeholder="{SITE['postcode']}">
          <span class="field-error">Postcode helps me check I cover your road.</span>
        </div>
        <div class="form-actions">
          <button class="btn btn-ghost" type="button" data-prev>Back</button>
          <button class="btn btn-primary" type="submit" style="flex:1">Request my free meet &amp; greet {icon('heart-solid', 18)}</button>
        </div>
        <p class="tiny dim mt-2">By sending this you're only asking for a chat — nothing is booked
          and no payment is taken. Your details are used to arrange the meet &amp; greet and nothing
          else.</p>
      </div>
    </form>

    <div class="form-card form-success" role="status">
      <div class="success-check">{icon('check', 40)}</div>
      <h2>Got it, <span data-name-slot>thank you</span>!</h2>
      <p class="lede mt-2">Your request is in. I'll be in touch within the hour during working hours
        — usually much sooner — to arrange your free meet &amp; greet.</p>
      <p class="dim small mt-3">In a hurry? Call {SITE['phone_display']} or message me on WhatsApp
        and I'll pick it up between walks.</p>
      <div class="flex wrap gap-1 justify-center mt-4">
        <a class="btn btn-primary" href="https://wa.me/{SITE['whatsapp']}" rel="noopener">
          {icon('whatsapp', 18)} Message on WhatsApp</a>
        <a class="btn btn-ghost" href="index.html">Back to the site</a>
      </div>
    </div>

    <div class="grid grid-3 mt-5">
      <div class="card reveal"><span class="feature-icon">{icon('clock', 20)}</span>
        <h3 class="mt-2">Replies within the hour</h3>
        <p>Between 7:30am and 6pm, Monday to Friday. Saturdays until 2pm.</p></div>
      <div class="card reveal reveal-delay-1"><span class="feature-icon green">{icon('phone', 20)}</span>
        <h3 class="mt-2">Rather just call?</h3>
        <p><a class="link-arrow" href="tel:{SITE['phone_link']}">{SITE['phone_display']}</a> — if I'm
          mid-walk, leave a message and I'll ring straight back.</p></div>
      <div class="card reveal reveal-delay-2"><span class="feature-icon">{icon('shield', 20)}</span>
        <h3 class="mt-2">No commitment</h3>
        <p>The meet &amp; greet is free and you're under no obligation to book anything afterwards.</p></div>
    </div>
  </div>
</section>'''

    schema = [breadcrumb_schema([("Home", ""), ("Book a meet and greet", "book.html")])]
    return ("book.html", dict(
        title=f"Book a Free Meet & Greet | {SITE['name']}",
        description=(f"Book a free, no-obligation meet & greet with {SITE['name']} in {SITE['town']}. "
                     f"Dog walks, cat visits, pet check-ins and puppy training. I reply within the "
                     f"hour."),
        path="book.html", body=body, active="book", schema=schema), "monthly", "0.9")


# --------------------------------------------------------------------------- #
# 404
# --------------------------------------------------------------------------- #
def not_found():
    body = f'''<section class="page-hero" style="min-height:62vh;display:grid;place-items:center;text-align:center">
  <div class="container" style="max-width:40rem">
    <div style="width:min(48vw,168px);margin-inline:auto">{logo_svg(cls="badge-logo", uid="404")}</div>
    <h1 class="mt-4">What the fluff?</h1>
    <p class="lede mt-2">This page has run off with someone's tennis ball. Let's get you back to
      something useful.</p>
    <div class="flex wrap gap-1 justify-center mt-4">
      <a class="btn btn-primary btn-lg" href="index.html">Back to the home page</a>
      <a class="btn btn-ghost btn-lg" href="services/">See services</a>
    </div>
    <p class="small dim mt-4">Or call {SITE['phone_display']} — that always works.</p>
  </div>
</section>'''
    return ("404.html", dict(
        title=f"Page not found | {SITE['name']}",
        description="That page has wandered off. Head back to the home page or give Gemma a call.",
        path="404.html", body=body, robots="noindex, follow"), "yearly", "0.1")


def all_pages():
    pages = [pricing(), areas(), about(), book()]
    nf = not_found()
    # 404 stays out of the sitemap
    return pages + [(nf[0], nf[1], None, None)]
