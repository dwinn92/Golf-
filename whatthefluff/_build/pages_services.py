"""Service pages — the main organic landing pages."""
from site_config import (SITE, PRICES, icon, trust_strip, testimonials_section, cta_band,
                         faq_block, breadcrumbs, breadcrumb_schema, service_schema)

D = 1  # these pages live in /services/
R = "../"


def _hero(eyebrow, h1, lede, crumbs, chips, price_line, service_key):
    chip_html = "".join(f'<span class="chip">{icon(i, 16)} {t}</span>' for i, t in chips)
    return f'''<section class="page-hero">
  <div class="container">
    {breadcrumbs(crumbs, depth=D)}
    <div class="feature-row" style="align-items:center">
      <div>
        <span class="eyebrow">{eyebrow}</span>
        <h1>{h1}</h1>
        <p class="lede mt-2">{lede}</p>
        <div class="hero-actions">
          <a class="btn btn-primary btn-lg" href="{R}book.html?service={service_key}">Book a free meet &amp; greet {icon('arrow-right', 18)}</a>
          <a class="btn btn-ghost btn-lg" href="#included">What's included</a>
        </div>
        <div class="hero-chips">{chip_html}</div>
      </div>
      <div class="feature-media">
        <div class="card" style="text-align:center;padding:2rem">
          <p class="eyebrow" style="margin-bottom:.6rem">{icon('gift', 14)} From</p>
          <p class="hero-price">{price_line}</p>
          <p class="dim small mt-2">Free meet &amp; greet first, always. No booking fees,
            no contracts, cancel or change with 24 hours' notice.</p>
          <a class="btn btn-green btn-block mt-3" href="{R}pricing.html">See the full price list</a>
        </div>
      </div>
    </div>
  </div>
</section>'''


def _included(title, sub, items, anchor="included"):
    cards = ""
    for i, (ic, h, p) in enumerate(items):
        delay = f" reveal-delay-{i % 3}" if i % 3 else ""
        cards += (f'<div class="card reveal{delay}"><span class="feature-icon'
                  f'{" green" if i % 2 else ""}">{icon(ic, 20)}</span>'
                  f'<h3 class="mt-2">{h}</h3><p>{p}</p></div>')
    return f'''<section class="section" id="{anchor}">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('check-circle', 14)} What's included</span>
      <h2>{title}</h2>
      <p class="lede">{sub}</p>
    </div>
    <div class="grid grid-3">{cards}</div>
  </div>
</section>'''


def _timeline(title, sub, steps):
    items = ""
    for time, head, body in steps:
        items += (f'<li class="reveal"><span class="feature-icon green">{icon("clock", 18)}</span>'
                  f'<span><strong>{time} — {head}</strong><p>{body}</p></span></li>')
    return f'''<section class="section band-cream">
  <div class="container" style="max-width:52rem">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('clock', 14)} A typical day</span>
      <h2>{title}</h2>
      <p class="lede">{sub}</p>
    </div>
    <ul class="feature-list">{items}</ul>
  </div>
</section>'''


# --------------------------------------------------------------------------- #
# Dog walking
# --------------------------------------------------------------------------- #
def dog_walking():
    faqs = [
        (f"How much is dog walking in {SITE['town']}?",
         f"<p>£{PRICES['group_walk']} for a 60-minute small-group walk, £{PRICES['solo_walk']} for a "
         f"60-minute solo walk, or £{PRICES['solo_walk_30']} for a 30-minute solo. A block of five "
         f"group walks is £{PRICES['bundle_5']}. Collection, drop-off, towels, treats and the GPS "
         f"tracking are all included in the price.</p>"),
        ("How long is a walk, really?",
         "<p>Sixty minutes of actual walking — the clock starts when we reach the field, not when I "
         "leave my drive. Travel time is mine to absorb, not yours to pay for.</p>"),
        ("Where do the walks happen?",
         "<p>Bluebell Woods, the canal towpath, Marsden meadows and the big enclosed field off "
         "Priory Lane, rotated through the week so nobody gets bored. Routes are chosen for the "
         "group that day — muddy and adventurous for the young ones, flat and sniffy for seniors.</p>"),
        ("What happens in bad weather?",
         "<p>We still go. Dogs need the day out and I own extremely unflattering waterproofs. In "
         "genuine danger — ice, thunder, heat above 24°C — walks switch to a shorter lead walk or "
         "an in-home enrichment visit at the same price, and I'll message you first.</p>"),
        ("Is my dog insured while they're with you?",
         "<p>Yes. I carry full public liability plus care, custody and control cover, which is the "
         "part that actually matters when a dog is in someone else's hands. Certificates are shown "
         "at the meet &amp; greet.</p>"),
        ("Do you walk dogs who pull, bark or aren't great with other dogs?",
         "<p>Constantly. Pullers get harness and loose-lead work built into the walk. Dogs who find "
         "other dogs difficult go solo on quiet routes at quiet times — and if you'd like to change "
         "that, the <a href='puppy-training.html'>training sessions</a> pick up where the walk "
         "leaves off.</p>"),
        ("Will my dog be in a van with other dogs?",
         "<p>Yes — in a purpose-fitted, ventilated van with individual crates, harnesses and a "
         "temperature alarm. Never loose, never crated together, never left unattended.</p>"),
        ("Can I have the same day and time every week?",
         "<p>That's how most families book, and regular slots get priority when the diary fills up. "
         "One-off and ad-hoc walks are welcome whenever there's space.</p>"),
    ]
    faq_html, faq_schema = faq_block(faqs, depth=D)

    body = _hero(
        f"{icon('dog', 14)} Dog walking in {SITE['town']}",
        "Group dog walking that wears them out properly",
        "Sixty minutes of woods, water and rabbit smells with a maximum of four carefully matched "
        "dogs — then home, towelled off and fast asleep before you've finished your coffee.",
        [("Home", "index.html"), ("Services", "services/"), ("Dog walking", None)],
        [("users", "Max 4 dogs"), ("route", "GPS tracked"), ("camera", "Photos every walk"),
         ("shield", "Fully insured")],
        f'<sup>£</sup>{PRICES["group_walk"]}<small>/ 60 min</small>',
        "group-walk") + trust_strip()

    body += _included(
        "Everything that happens between pick-up and sofa",
        "One price. No extras invented later.",
        [("home", "Collection &amp; drop-off",
          "I let myself in, harness up, and bring them home again — fed if you'd like, always with "
          "fresh water down."),
         ("users", "A group of four, matched properly",
          "By size, pace and play style. Your dog meets the group gradually, never dropped into the "
          "deep end on day one."),
         ("route", "Live Tractive GPS",
          "The route, the distance and the time are recorded on every walk and shared with you — no "
          "taking anyone's word for it."),
         ("camera", "Photo report card",
          "Photos, distance, toilets, mood, and anything I noticed — a limp, a sore ear, a new "
          "favourite friend."),
         ("leaf", "Paws, ears and belly towelled",
          "Microfibre towels, muddy-dog wipes and a proper check-over before they come back in "
          "your house."),
         ("first-aid", "First aid kit in the van",
          "Canine first aid certified, with your vet's number saved and a tick tool in the glovebox.")])

    body += _timeline(
        "What a Tuesday looks like for your dog",
        "Give or take a heroic puddle.",
        [("10:45", "Pick-up", "I arrive, say a very embarrassing hello, harness on, quick toilet "
                              "break in the garden, then into their own crate in the van."),
         ("11:00", "Boots on the ground",
          "Bluebell Woods loop. Long-line for the recall learners, off-lead for the reliable ones, "
          "sniffing encouraged relentlessly — a good sniff tires a dog out more than a fast mile."),
         ("11:40", "Water, games, more sniffing",
          "Recall practice with actual cheese, a paddle in the stream if it's warm, then a calm "
          "walk back to settle everyone down."),
         ("12:05", "Home",
          "Towel-off, water bowl topped up, a tidy-up of any mud on the floor, and a message with "
          "photos before I've pulled off your drive."),
         ("12:10", "The best nap of their week", "You get the photo. They get the sofa.")])

    body += f'''<section class="section" id="solo">
  <div class="container feature-row">
    <div class="reveal">
      <span class="eyebrow">{icon('heart', 14)} Solo walks</span>
      <h2>Some dogs want the whole hour to themselves</h2>
      <p class="lede mt-2">Reactive, anxious, recovering, elderly, or simply not a fan of other
        dogs — a solo walk is not a downgrade. It is exactly the same hour, built entirely around
        one dog.</p>
      <ul class="feature-list">
        <li><span class="feature-icon">{icon('clock', 20)}</span><span><strong>Quiet times, quiet routes</strong>
          <p>Early, late, and the paths where we're unlikely to meet anyone at all.</p></span></li>
        <li><span class="feature-icon green">{icon('graduation', 20)}</span><span><strong>Training built in</strong>
          <p>Loose lead, engagement, distance work around triggers — at your dog's pace, never over threshold.</p></span></li>
        <li><span class="feature-icon">{icon('message', 20)}</span><span><strong>Honest updates</strong>
          <p>Including the hard days. You'll always know exactly how it went.</p></span></li>
      </ul>
      <p class="price-note">£{PRICES['solo_walk']} for 60 minutes · £{PRICES['solo_walk_30']} for 30 minutes</p>
      <a class="btn btn-green mt-3" href="{R}book.html?service=solo-walk">Ask about a solo walk {icon('arrow-right', 18)}</a>
    </div>
    <div class="feature-media reveal reveal-delay-1">
      <img src="{R}assets/img/pet-shepherd.png" alt="German shepherd enjoying a one-to-one walk"
           width="420" height="420" loading="lazy" decoding="async"
           style="border-radius:999px;box-shadow:var(--shadow-lg);margin-inline:auto;max-width:340px">
    </div>
  </div>
</section>'''

    body += testimonials_section(depth=D)
    body += f'''<section class="section band-cream">
  <div class="container" style="max-width:52rem">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('message', 14)} Dog walking questions</span>
      <h2>The things people ask before booking</h2>
    </div>
    {faq_html}
  </div>
</section>'''
    body += cta_band(depth=D, title="Let's get them out there",
                     sub="Free meet &amp; greet, then a walk slot that's yours every week.")

    schema = [
        service_schema("Dog walking",
                       f"Small-group and solo dog walking in {SITE['town']} — maximum four dogs, "
                       f"GPS tracked, photo updates after every walk.",
                       "services/dog-walking.html", PRICES["group_walk"], "per 60-minute walk"),
        faq_schema,
        breadcrumb_schema([("Home", ""), ("Services", "services/"),
                           ("Dog walking", "services/dog-walking.html")]),
    ]
    return ("services/dog-walking.html", dict(
        title=f"Dog Walking in {SITE['town']} | Max 4 Dogs | {SITE['name']}",
        description=(f"Insured dog walking in {SITE['town']} from £{PRICES['group_walk']}. Small "
                     f"groups of four, solo walks for nervous dogs, GPS routes and photos after every "
                     f"walk."),
        path="services/dog-walking.html", body=body, active="services", depth=D, schema=schema),
        "monthly", "0.9")


# --------------------------------------------------------------------------- #
# Pet check-ins / cat visits
# --------------------------------------------------------------------------- #
def pet_check_ins():
    faqs = [
        ("How much is a cat visit or pet check-in?",
         f"<p>£{PRICES['check_in']} for a 30-minute visit, or £24 for two visits in the same day. "
         f"Extra pets in the same home are £3 each. Bank holidays are charged at time and a half — "
         f"and Christmas Day visits are booked early, so ask in November.</p>"),
        ("How many visits a day does my cat need?",
         "<p>One visit a day is enough for a confident, healthy adult cat on a short trip. Two is "
         "kinder for kittens, seniors, cats on medication, cats who eat wet food twice a day, or any "
         "cat who will otherwise spend 24 hours alone. If you're away more than four or five days, "
         "two visits is my honest recommendation.</p>"),
        ("Do you do more than feed them?",
         "<p>Feeding is the quickest bit. A visit includes fresh water, litter trays emptied and "
         "refreshed, a proper look at the cat (eating, drinking, weeing, moving normally), play or a "
         "lap-sit if they want it, plus post picked up, plants watered, curtains and lights changed "
         "so the house doesn't look empty.</p>"),
        ("Can you give medication?",
         "<p>Yes — tablets, liquids, ear drops, subcutaneous fluids and insulin injections at fixed "
         "times, with written instructions agreed at the meet &amp; greet. I log every dose and "
         "photograph the chart so you can see it was done.</p>"),
        ("What about rabbits, guinea pigs, birds or fish?",
         "<p>All welcome. Hutch and run cleaning, hay and veg, water bottles, tank checks and "
         "feeding are part of the same visit price.</p>"),
        ("What if something's wrong while I'm away?",
         "<p>You get a call, not a text. I have your vet's details and your written consent for "
         "emergency treatment on file, and I'll get them there myself. It's happened twice in six "
         "years, and both cats are absolutely fine.</p>"),
        ("Is this better than a cattery?",
         "<p>For most cats, yes. Cats bond to territory more than to people — staying in their own "
         "home, with their own smells, litter tray and windowsill, is far less stressful than a "
         "cattery. It also means no carrier, no car journey and no vaccination requirements.</p>"),
        ("Will you send photos?",
         "<p>Every single visit, even the ones where your cat sat under the bed and judged me from a "
         "distance. You'll get a photo, a note on what they ate and how they seemed, and a wave from "
         "your living room.</p>"),
    ]
    faq_html, faq_schema = faq_block(faqs, depth=D)

    body = _hero(
        f"{icon('cat', 14)} Cat visits &amp; pet check-ins in {SITE['town']}",
        "Your pets stay home. You stop worrying.",
        "Thirty-minute in-home visits for cats, kittens, puppies, rabbits and small furries — fed, "
        "cleaned, medicated, fussed, and photographed so you can actually enjoy being away.",
        [("Home", "index.html"), ("Services", "services/"), ("Cat visits &amp; check-ins", None)],
        [("home", "In your own home"), ("first-aid", "Medication given"),
         ("camera", "Photos every visit"), ("key", "Keys held securely")],
        f'<sup>£</sup>{PRICES["check_in"]}<small>/ 30 min</small>',
        "cat-visit") + trust_strip()

    body += _included(
        "What happens in those thirty minutes",
        "The same routine, every visit, logged and photographed.",
        [("heart", "Food, water, medication",
          "Their food, their bowls, their times. Wet, dry, raw, prescription — exactly as written "
          "down at the meet &amp; greet."),
         ("leaf", "Litter trays &amp; bedding",
          "Scooped, refreshed, and the area swept. Hutches and runs cleaned out for the small "
          "furries."),
         ("users", "Company on their terms",
          "Wand games, a brush, a lap to sit on — or a respectful distance if that's what your cat "
          "prefers. Nobody is dragged out from under a bed."),
         ("check-circle", "A proper health check",
          "Eating, drinking, toileting, breathing, moving. I know what 'off' looks like and I'll "
          "tell you early."),
         ("home", "The house looks lived-in",
          "Post lifted, curtains and lights moved, plants watered, bins out on the right day. A "
          "quiet deterrent that costs nothing extra."),
         ("camera", "Photo update before I leave",
          "Proof of life, proof of dinner, and usually proof of a belly.")])

    body += f'''<section class="section" id="puppy-pop-ins">
  <div class="container feature-row reverse">
    <div class="reveal">
      <span class="eyebrow">{icon('dog', 14)} Puppy pop-ins</span>
      <h2>The lunchtime visit that saves your carpet</h2>
      <p class="lede mt-2">New puppies can't hold on for eight hours, and they shouldn't have to
        learn to. A midday pop-in breaks up the day with a toilet break, a meal, a short bout of
        socialisation and a proper settle.</p>
      <ul class="feature-list">
        <li><span class="feature-icon">{icon('clock', 20)}</span><span><strong>Toilet break at the right time</strong>
          <p>Consistent timing is what makes house training stick — and what stops accidents becoming habits.</p></span></li>
        <li><span class="feature-icon green">{icon('graduation', 20)}</span><span><strong>Five minutes of training</strong>
          <p>Name, sit, settle on a mat, handling practice. Small, kind, repeatable.</p></span></li>
        <li><span class="feature-icon">{icon('heart', 20)}</span><span><strong>Company before the crate</strong>
          <p>Play, then a deliberate wind-down so they sleep instead of screaming at the door.</p></span></li>
      </ul>
      <p class="price-note">£{PRICES['puppy_visit']} per 30-minute pop-in · block-book five for £60</p>
      <a class="btn btn-green mt-3" href="{R}book.html?service=puppy-visit">Book puppy pop-ins {icon('arrow-right', 18)}</a>
    </div>
    <div class="feature-media reveal reveal-delay-1">
      <img src="{R}assets/img/pet-cockapoo.png" alt="Cockapoo puppy waiting for a lunchtime visit"
           width="420" height="420" loading="lazy" decoding="async"
           style="border-radius:999px;box-shadow:var(--shadow-lg);margin-inline:auto;max-width:340px">
    </div>
  </div>
</section>'''

    body += _timeline(
        "Holiday cover, from the cat's point of view",
        "A week away for you. Barely a ripple for them.",
        [("Day 0", "The handover",
          "We meet before you go. I learn the hiding spots, the food, the medication and which "
          "neighbour has the spare key. You get my number and a written care plan."),
         ("8:30 each morning", "Breakfast and a clean-up",
          "Fresh food and water, litter trays done, a check that everyone is eating and behaving "
          "normally."),
         ("Every visit", "Twenty minutes of company",
          "Play for the ones who want it, a quiet brush for the ones who don't, and a look around "
          "the house while I'm there."),
         ("Before I leave", "Photos and a note",
          "What they ate, what they did, how they seemed. Sent straight to your phone, wherever "
          "you are."),
         ("Day you're back", "A tidy house",
          "Bins in, post stacked, trays clean, heating back on if you asked. Walk in and it's just "
          "home.")])

    body += testimonials_section(depth=D)
    body += f'''<section class="section band-cream">
  <div class="container" style="max-width:52rem">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('message', 14)} Check-in questions</span>
      <h2>What owners ask before they go away</h2>
    </div>
    {faq_html}
  </div>
</section>'''
    body += cta_band(depth=D, title="Go away. Properly.",
                     sub="Meet me before you book, hand over the key with confidence, and spend "
                         "your holiday looking at cat photos instead of worrying.")

    schema = [
        service_schema("Cat visits and pet check-ins",
                       f"In-home cat visits, pet check-ins and puppy pop-ins in {SITE['town']} — "
                       f"feeding, litter, medication, play and photo updates every visit.",
                       "services/pet-check-ins.html", PRICES["check_in"], "per 30-minute visit"),
        faq_schema,
        breadcrumb_schema([("Home", ""), ("Services", "services/"),
                           ("Cat visits and pet check-ins", "services/pet-check-ins.html")]),
    ]
    return ("services/pet-check-ins.html", dict(
        title=f"Cat Visits & Pet Check-Ins in {SITE['town']} | {SITE['name']}",
        description=(f"In-home cat sitting, pet check-ins and puppy pop-ins in {SITE['town']} from "
                     f"£{PRICES['check_in']}. Feeding, litter, medication, play and photos every "
                     f"visit."),
        path="services/pet-check-ins.html", body=body, active="services", depth=D, schema=schema),
        "monthly", "0.9")


# --------------------------------------------------------------------------- #
# Puppy & obedience training
# --------------------------------------------------------------------------- #
def puppy_training():
    faqs = [
        ("What age should training start?",
         "<p>The day they come home — usually eight weeks. Early training is mostly about "
         "confidence, handling and a rock-solid name response, not obedience. The critical "
         "socialisation window closes around sixteen weeks, so the first month matters more than "
         "any other.</p>"),
        ("How many sessions will we need?",
         f"<p>Most families do the four-session puppy package (£{PRICES['training_package']}) and "
         f"then dip back in when something new crops up. Single sessions are "
         f"£{PRICES['training_session']}. If four sessions won't be enough for what you're dealing "
         f"with, I'll tell you before you book, not after.</p>"),
        ("What methods do you use?",
         "<p>Reward-based and force-free. Food, play, praise, and setting the environment up so the "
         "right choice is the easy one. No prong collars, no e-collars, no alpha rolls, no shouting. "
         "It isn't only kinder — it's what the evidence supports.</p>"),
        ("Do you train in my house or somewhere else?",
         "<p>Both. We start where the problem actually happens — your hallway, your kitchen, your "
         "front door — then move to the pavement, the park and the places that matter to you.</p>"),
        ("Can you fix pulling on the lead?",
         "<p>Yes, and it's the most common request I get. Expect two or three weeks of consistent "
         "practice rather than a magic session. You'll get a written plan, a harness recommendation "
         "and five-minute daily drills that fit around work.</p>"),
        ("What about barking, jumping up or stealing food?",
         "<p>All standard. These are normal dog behaviours that have been accidentally rewarded — we "
         "work out what's maintaining them, remove the payoff, and teach an alternative that gets "
         "your dog what they wanted in a way you can live with.</p>"),
        ("Do you handle serious aggression or severe separation anxiety?",
         "<p>Not on my own — and anyone who promises otherwise without a referral should worry you. "
         "For those cases I work alongside a qualified clinical behaviourist and your vet, and I'll "
         "point you to the right person rather than taking your money.</p>"),
        ("Can training be combined with walks?",
         "<p>That's the sweet spot. Solo walks with training built in keep the work going between "
         "sessions, and I'll message you short homework clips so everyone in the house is doing the "
         "same thing.</p>"),
    ]
    faq_html, faq_schema = faq_block(faqs, depth=D)

    body = _hero(
        f"{icon('graduation', 14)} Puppy &amp; obedience training in {SITE['town']}",
        "Kind training that survives real life",
        "One-to-one puppy and basic obedience training in your home and on your actual routes — "
        "reward-based, jargon-free, and built around the ten minutes a day you genuinely have.",
        [("Home", "index.html"), ("Services", "services/"), ("Puppy &amp; obedience training", None)],
        [("heart", "Force-free"), ("home", "In your home"), ("message", "Written plan after each session"),
         ("users", "One-to-one")],
        f'<sup>£</sup>{PRICES["training_session"]}<small>/ 60 min</small>',
        "training") + trust_strip()

    body += _included(
        "What we'll actually work on",
        "Pick and mix — the first session starts wherever it hurts most.",
        [("sparkle", "Name, focus and the basics",
          "Sit, down, wait, and a name response that works when there's a squirrel. Foundations "
          "everything else is built on."),
         ("route", "Recall that holds up",
          "Long-line work, chase games and a recall cue you haven't already worn out by shouting it "
          "across a field."),
         ("dog", "Loose lead walking",
          "No more shoulder ache. Harness fitting, rewarding position, and what to do when they "
          "pull anyway."),
         ("home", "House training &amp; settling",
          "Toileting, crate and mat training, and calm when the doorbell goes — the stuff that "
          "makes living together easy."),
         ("users", "Socialisation, done properly",
          "Not 'let every dog say hello'. Careful exposure to sounds, surfaces, people and traffic "
          "at a distance your puppy can cope with."),
         ("graduation", "The four-month wobble",
          "Adolescence hits, recall vanishes, everyone panics. It's normal, it's temporary, and "
          "there's a plan.")])

    body += f'''<section class="section">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('gift', 14)} Packages</span>
      <h2>Two ways to book</h2>
      <p class="lede">Both include written notes, homework clips and WhatsApp support between
        sessions — because the questions never arrive during the session.</p>
    </div>
    <div class="grid grid-2" style="max-width:52rem;margin-inline:auto">
      <div class="card price-card reveal">
        <h3>Single session</h3>
        <p class="dim small">One problem, one hour, one plan. Good for a specific wobble.</p>
        <p class="amount"><sup>£</sup>{PRICES['training_session']} <small>/ 60 min</small></p>
        <ul>
          <li>{icon('check', 16)} 60 minutes in your home or on your route</li>
          <li>{icon('check', 16)} Written plan the same evening</li>
          <li>{icon('check', 16)} Follow-up questions answered free</li>
        </ul>
        <a class="btn btn-ghost btn-block" href="{R}book.html?service=training">Book a session</a>
      </div>
      <div class="card price-card featured reveal reveal-delay-1">
        <span class="badge-pill pink">Best value</span>
        <h3>Puppy package</h3>
        <p class="dim small">Four sessions over six weeks — the full foundation, in order.</p>
        <p class="amount"><sup>£</sup>{PRICES['training_package']} <small>/ 4 sessions</small></p>
        <ul>
          <li>{icon('check', 16)} Save £20 against single sessions</li>
          <li>{icon('check', 16)} Socialisation checklist and progress tracker</li>
          <li>{icon('check', 16)} Unlimited WhatsApp support for eight weeks</li>
          <li>{icon('check', 16)} 10% off walks while you're on the package</li>
        </ul>
        <a class="btn btn-primary btn-block" href="{R}book.html?service=training">Book the package</a>
      </div>
    </div>
  </div>
</section>'''

    body += _timeline(
        "The four-session puppy plan",
        "Roughly a fortnight apart, so there's time to practise.",
        [("Session 1", "Foundations and food",
          "Name, marker word, hand-feeding games, handling for the vet, and getting the house set "
          "up so your puppy can't rehearse the wrong things."),
         ("Session 2", "Toilets, crate and calm",
          "A toileting schedule that works around your day, crate and mat training, and how to "
          "teach 'boring is lovely'."),
         ("Session 3", "Out in the world",
          "Lead skills, traffic, people, other dogs at a safe distance, and the difference between "
          "socialisation and overwhelm."),
         ("Session 4", "Recall and adolescence-proofing",
          "Long-line recall games, the cues worth protecting, and exactly what to do when your "
          "eight-month-old pretends they've never met you.")])

    body += testimonials_section(depth=D)
    body += f'''<section class="section band-cream">
  <div class="container" style="max-width:52rem">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('message', 14)} Training questions</span>
      <h2>Before you book a session</h2>
    </div>
    {faq_html}
  </div>
</section>'''
    body += cta_band(depth=D, title="Let's make life easier",
                     sub="Tell me what's driving you mad. I'll tell you honestly whether one "
                         "session or four is the right answer.")

    schema = [
        service_schema("Puppy and basic obedience training",
                       f"Force-free puppy and obedience training in {SITE['town']} — recall, loose "
                       f"lead walking, house training and socialisation, one-to-one in your home.",
                       "services/puppy-training.html", PRICES["training_session"], "per 60-minute session"),
        faq_schema,
        breadcrumb_schema([("Home", ""), ("Services", "services/"),
                           ("Puppy and obedience training", "services/puppy-training.html")]),
    ]
    return ("services/puppy-training.html", dict(
        title=f"Puppy & Obedience Training in {SITE['town']} | {SITE['name']}",
        description=(f"Force-free puppy and obedience training in {SITE['town']} from "
                     f"£{PRICES['training_session']}. Recall, loose lead, house training and "
                     f"socialisation, one-to-one in your home."),
        path="services/puppy-training.html", body=body, active="services", depth=D, schema=schema),
        "monthly", "0.9")


# --------------------------------------------------------------------------- #
# Services hub
# --------------------------------------------------------------------------- #
def services_index():
    cards = [
        ("pet-golden", "Group dog walking", "dog-walking.html",
         f"From £{PRICES['group_walk']} / 60 min",
         "Four dogs maximum, matched by pace and personality, GPS tracked and photographed.",
         ["Collection and drop-off", "Live GPS route", "Photo report card", "Towel-off before home"]),
        ("pet-shepherd", "Solo &amp; 1-2-1 walks", "dog-walking.html#solo",
         f"From £{PRICES['solo_walk']} / 60 min",
         "For dogs who are reactive, nervous, elderly, recovering — or simply prefer their own company.",
         ["Quiet routes, quiet times", "Training built in", "Same walker every time", "30-minute option"]),
        ("pet-cat", "Cat visits &amp; pet check-ins", "pet-check-ins.html",
         f"From £{PRICES['check_in']} / 30 min",
         "Cats, rabbits and small furries cared for in their own home while you're away.",
         ["Food, water, medication", "Litter trays and bedding", "Post, plants and lights", "Photos every visit"]),
        ("pet-lab", "Puppy pop-ins", "pet-check-ins.html#puppy-pop-ins",
         f"From £{PRICES['puppy_visit']} / 30 min",
         "The lunchtime break that makes house training stick and stops the day feeling endless.",
         ["Toilet break on schedule", "Five minutes of training", "Play then a proper settle", "Photo update"]),
        ("pet-cockapoo", "Puppy &amp; obedience training", "puppy-training.html",
         f"From £{PRICES['training_session']} / session",
         "Force-free one-to-one training in your home and on the routes you actually walk.",
         ["Recall and loose lead", "House training and settling", "Socialisation done properly", "Written plan each time"]),
    ]
    grid = ""
    for i, (img, name, href, price, blurb, bullets) in enumerate(cards):
        lis = "".join(f'<li>{icon("check", 16)} {b}</li>' for b in bullets)
        grid += f'''<article class="card service-card reveal{f" reveal-delay-{i % 3}" if i % 3 else ""}">
      <div class="service-media">
        <img src="{R}assets/img/{img}.png" alt="" width="122" height="122" loading="lazy" decoding="async">
      </div>
      <div class="service-body">
        <h3>{name}</h3>
        <p>{blurb}</p>
        <ul>{lis}</ul>
        <p class="price">{price}</p>
        <a class="link-arrow" href="{href}">See details {icon('arrow-right', 16)}</a>
      </div>
    </article>'''

    body = f'''<section class="page-hero">
  <div class="container">
    {breadcrumbs([("Home", "index.html"), ("Services", None)], depth=D)}
    <div class="feature-row" style="align-items:center">
      <div class="reveal">
        <span class="eyebrow">{icon('paw', 14)} Services</span>
        <h1>Everything I do for {SITE['town']}'s animals</h1>
        <p class="lede mt-2">Walks, visits and training — all from the same familiar face, all
          insured, all with photos afterwards. Start with a free meet &amp; greet and we'll work out
          what your pet actually needs.</p>
        <div class="hero-actions">
          <a class="btn btn-primary btn-lg" href="{R}book.html">Book a free meet &amp; greet {icon('arrow-right', 18)}</a>
          <a class="btn btn-ghost btn-lg" href="{R}pricing.html">See all prices</a>
        </div>
      </div>
      <div class="feature-media reveal reveal-delay-1">
        <div class="pack-ledge">
          <img src="{R}assets/img/pack-660.png" width="660" height="193" decoding="async"
               alt="Four dogs and a cat peeking over a fence, waiting for their walk">
        </div>
      </div>
    </div>
  </div>
</section>
{trust_strip()}
<section class="section">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('paw', 14)} Pick your service</span>
      <h2>Five ways I can help</h2>
      <p class="lede">Mix and match — most families end up with two walks and a training session,
        or a week of cat visits twice a year.</p>
    </div>
    <div class="grid grid-3">{grid}</div>
  </div>
</section>
{testimonials_section(depth=D)}
{cta_band(depth=D)}'''

    schema = [breadcrumb_schema([("Home", ""), ("Services", "services/")])]
    return ("services/index.html", dict(
        title=f"Pet Care Services in {SITE['town']} | {SITE['name']}",
        description=(f"Dog walking, cat visits, pet check-ins, puppy pop-ins and force-free "
                     f"training in {SITE['town']}. Insured, DBS checked, photos every visit."),
        path="services/", body=body, active="services", depth=D, schema=schema),
        "monthly", "0.8")


def all_pages():
    return [services_index(), dog_walking(), pet_check_ins(), puppy_training()]
