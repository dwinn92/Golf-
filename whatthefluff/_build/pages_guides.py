"""Guides — the top-of-funnel content that brings people in from search."""
import json
from site_config import (SITE, PRICES, icon, cta_band, faq_block, breadcrumbs,
                         breadcrumb_schema, testimonials_section)

D = 1
R = "../"

GUIDES = [
    {
        "slug": "dog-walker-cost-uk.html",
        "tag": "Prices",
        "title": "How Much Does a Dog Walker Cost in 2026?",
        "h1": "How much does a dog walker cost in 2026?",
        "desc": ("What UK dog walkers charge in 2026, what changes the price, what should be "
                 "included as standard, and the questions to ask before you hand over a key."),
        "published": "2026-01-14",
        "modified": "2026-09-01",
        "read": "7 min read",
        "lede": ("Somewhere between £12 and £25 an hour, depending on where you live and what you're "
                 "actually buying. Here's how that breaks down — and how to tell a fair price from a "
                 "worrying one."),
    },
    {
        "slug": "how-long-can-you-leave-a-cat-alone.html",
        "tag": "Cats",
        "title": "How Long Can You Leave a Cat Alone?",
        "h1": "How long can you leave a cat alone?",
        "desc": ("How long it is safe to leave a cat alone, how many visits a day they need, and "
                 "why a sitter usually beats a cattery — from a professional pet sitter."),
        "published": "2026-03-02",
        "modified": "2026-08-19",
        "read": "6 min read",
        "lede": ("Cats are independent, not self-sufficient. The honest answer is 24 hours for a "
                 "healthy adult cat — and here's what changes that number."),
    },
    {
        "slug": "puppy-socialisation-checklist.html",
        "tag": "Puppies",
        "title": "Puppy Socialisation Checklist (8–16 Weeks)",
        "h1": "The puppy socialisation checklist",
        "desc": ("A week-by-week socialisation checklist for puppies aged 8 to 16 weeks: what to "
                 "introduce, how to do it safely before vaccinations, and what backfires."),
        "published": "2026-05-11",
        "modified": "2026-09-05",
        "read": "8 min read",
        "lede": ("You have about eight weeks to show your puppy that the world is fine. Here's "
                 "exactly what to cover, and how to do it without overwhelming them."),
    },
]


def _article_schema(g):
    return json.dumps({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": g["h1"],
        "description": g["desc"],
        "datePublished": g["published"],
        "dateModified": g["modified"],
        "author": {"@type": "Person", "name": SITE["owner"],
                   "url": f"{SITE['domain']}/about.html"},
        "publisher": {"@id": f"{SITE['domain']}/#business"},
        "mainEntityOfPage": {"@type": "WebPage", "@id": f"{SITE['domain']}/guides/{g['slug']}"},
        "image": f"{SITE['domain']}/assets/img/og.png",
        "inLanguage": "en-GB",
    }, ensure_ascii=False)


def _shell(g, toc, prose, extra_schema=None):
    others = [o for o in GUIDES if o["slug"] != g["slug"]]
    related = "".join(f'''<article class="card post-card reveal">
        <span class="tag">{o['tag']}</span>
        <h3><a href="{o['slug']}">{o['h1']}</a></h3>
        <p class="dim small">{o['lede']}</p>
        <a class="link-arrow" href="{o['slug']}">Read the guide {icon('arrow-right', 16)}</a>
      </article>''' for o in others)

    toc_html = "".join(f'<li><a href="#{i}">{t}</a></li>' for i, t in toc)

    body = f'''<section class="page-hero">
  <div class="container" style="max-width:46rem">
    {breadcrumbs([("Home", "index.html"), ("Guides", "guides/"), (g["tag"], None)], depth=D)}
    <span class="eyebrow">{icon('sparkle', 14)} {g['tag']}</span>
    <h1>{g['h1']}</h1>
    <p class="lede mt-2">{g['lede']}</p>
    <p class="post-meta mt-3">By {SITE['owner']} · Updated {g['modified']} · {g['read']}</p>
  </div>
</section>

<section class="section" style="padding-top:2rem">
  <div class="container prose mx-auto">
    <nav class="toc" aria-label="On this page">
      <h2>On this page</h2>
      <ol>{toc_html}</ol>
    </nav>
    {prose}
    <div class="author-box">
      <img src="{R}assets/img/pet-golden.png" alt="" width="62" height="62" loading="lazy" decoding="async">
      <div>
        <strong>Written by {SITE['owner']}, {SITE['name']}</strong>
        <small>Insured, DBS-checked dog walker, pet sitter and force-free trainer in
          {SITE['town']}, {SITE['region']} since {SITE['founded']}.
          <a href="{R}about.html">More about me</a>.</small>
      </div>
    </div>
  </div>
</section>

<section class="section band-pink">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('paw', 14)} Keep reading</span>
      <h2>More guides</h2>
    </div>
    <div class="grid grid-2" style="max-width:56rem;margin-inline:auto">{related}</div>
  </div>
</section>
{cta_band(depth=D)}'''

    schema = [_article_schema(g), breadcrumb_schema(
        [("Home", ""), ("Guides", "guides/"), (g["h1"], f"guides/{g['slug']}")])]
    if extra_schema:
        schema += extra_schema
    return (f"guides/{g['slug']}", dict(
        title=f"{g['title']} | {SITE['name']}",
        description=g["desc"], path=f"guides/{g['slug']}", body=body, active="guides",
        depth=D, schema=schema,
        article={"published": g["published"], "modified": g["modified"]}), "yearly", "0.6")


# --------------------------------------------------------------------------- #
def guide_cost():
    g = GUIDES[0]
    faqs = [
        ("Is a dog walker cheaper than doggy daycare?",
         "<p>Per day, yes — a single hour-long walk is typically £14–£18 against £25–£35 for a full "
         "day of daycare. Daycare covers a longer stretch of the day, so the right comparison is "
         "'what does my dog need?', not 'what costs less?'. Many dogs do better with one calm hour "
         "than eight hours of stimulation.</p>"),
        ("Should I tip my dog walker?",
         "<p>Not expected in the UK. A Christmas card with something in it is common and very "
         "gratefully received, but nobody is counting. A Google review is honestly worth more to a "
         "small pet business than a tip.</p>"),
        ("Why do some walkers charge so much less?",
         "<p>Usually one of three reasons: they're walking six to eight dogs at once, they're not "
         "insured, or they're new and undercharging while they build a client base. The third is "
         "fine. The first two are what you're paying to avoid.</p>"),
    ]
    faq_html, faq_schema = faq_block(faqs, depth=D)

    prose = f'''
    <h2 id="short-answer">The short answer</h2>
    <p>In 2026, a one-hour group dog walk in the UK costs <strong>£12–£20</strong>, and a solo walk
      costs <strong>£18–£30</strong>. Thirty-minute visits and puppy pop-ins sit around
      <strong>£10–£15</strong>. In central London and the commuter belt, add roughly 30–50%; in
      rural areas you'll often pay a little less.</p>
    <p>For context, here in {SITE['town']} I charge £{PRICES['group_walk']} for a one-hour group
      walk, £{PRICES['group_walk_2h']} for two hours and £{PRICES['solo_walk']} for a solo one —
      squarely mid-market, and deliberately so.</p>

    <div class="table-wrap">
      <table>
        <thead><tr><th>Service</th><th>Typical UK range</th><th>What you should get</th></tr></thead>
        <tbody>
          <tr><td><strong>Group walk, 60 min</strong></td><td>£12–£20</td>
            <td>Collection, 3–6 dogs, photos, towel-off</td></tr>
          <tr><td><strong>Group walk, 30 min</strong></td><td>£10–£14</td>
            <td>Shorter loop, good for seniors and small breeds</td></tr>
          <tr><td><strong>Solo walk, 60 min</strong></td><td>£18–£30</td>
            <td>One-to-one, route chosen for your dog</td></tr>
          <tr><td><strong>Puppy pop-in, 30 min</strong></td><td>£10–£15</td>
            <td>Toilet break, feed, short training, settle</td></tr>
          <tr><td><strong>Cat visit, 30 min</strong></td><td>£11–£16</td>
            <td>Feed, water, litter, meds, play, home check</td></tr>
          <tr><td><strong>Doggy daycare, full day</strong></td><td>£25–£35</td>
            <td>Licensed premises, supervised play, rest periods</td></tr>
          <tr><td><strong>Overnight home boarding</strong></td><td>£35–£55</td>
            <td>Licensed boarder, your dog stays in their home</td></tr>
        </tbody>
      </table>
    </div>

    <h2 id="what-changes">What actually changes the price</h2>
    <h3>Group size</h3>
    <p>This is the biggest hidden variable, and the one nobody advertises. A walker taking eight dogs
      can charge less per dog than one taking four — but the walk is a fundamentally different
      product. Fewer dogs means more supervision, better recall, calmer dogs and a walker who
      notices the limp. Ask the number before you ask the price.</p>
    <h3>Insurance and checks</h3>
    <p>Proper pet business insurance (public liability <em>plus</em> care, custody and control), an
      enhanced DBS check and a canine first aid certificate cost a walker several hundred pounds a
      year. A walker without them is cheaper for a reason, and the saving lands on you the day
      something goes wrong.</p>
    <h3>Travel and collection</h3>
    <p>Most walkers absorb travel within their patch and charge extra outside it. Check whether the
      advertised hour is 'door to door' or 'boots on the ground' — a 60-minute slot that includes
      20 minutes of driving is really a 40-minute walk.</p>
    <h3>Extras that should not be extras</h3>
    <p>Photos, a towel-off, fresh water, treats and a message afterwards should be included. If any
      of those appear as add-ons, the headline price isn't the real price.</p>

    <h2 id="included">What should always be included</h2>
    <ul>
      <li>Full insurance, shown to you without being asked</li>
      <li>A free meet &amp; greet before any money changes hands</li>
      <li>Written terms covering cancellations, emergencies and vet consent</li>
      <li>A secure key system — coded tags, never your address</li>
      <li>An update after every visit, with photos</li>
      <li>Fresh water down and your dog dried off before they're left</li>
    </ul>

    <h2 id="red-flags">Five red flags</h2>
    <ol>
      <li><strong>No meet &amp; greet.</strong> Anyone happy to take your key sight-unseen is telling
        you something about how they work.</li>
      <li><strong>Vague about group size.</strong> "It depends" usually means "more than you'd like".</li>
      <li><strong>No insurance documents.</strong> Ask for the certificate, not the reassurance.</li>
      <li><strong>Cash only, no invoice.</strong> Fine for a neighbour; not fine for a business
        holding your house key.</li>
      <li><strong>Talk of dominance, alphas or "correcting" dogs.</strong> Modern training doesn't
        work that way, and the dogs who suffer most are the nervous ones.</li>
    </ol>

    <h2 id="save">How to spend less without cutting corners</h2>
    <ul>
      <li><strong>Block-book.</strong> Most walkers discount blocks — mine is
        £{PRICES['bundle_5']} for five walks instead of £{int(PRICES['group_walk']) * 5}.</li>
      <li><strong>Take a fixed weekly slot.</strong> Predictable rounds are cheaper to run, and
        regulars get priority when the diary is full.</li>
      <li><strong>Share a household.</strong> A second dog from the same home is usually a few pounds
        rather than a second full walk.</li>
      <li><strong>Mix walk lengths.</strong> Two 60-minute walks and one 30-minute pop-in often suits
        a dog better than three hours, and costs less.</li>
      <li><strong>Ask about off-peak.</strong> Early morning and mid-afternoon slots are easier to
        fill and sometimes cheaper.</li>
    </ul>

    <h2 id="questions">Questions worth asking before you book</h2>
    <ol>
      <li>How many dogs will mine walk with, and how do you match them?</li>
      <li>Are you insured for care, custody and control — can I see it?</li>
      <li>What happens if my dog is injured and I can't be reached?</li>
      <li>Where do you actually walk, and are dogs off-lead?</li>
      <li>How are keys stored, and what happens to mine if I stop booking?</li>
      <li>What's your cancellation policy — both ways?</li>
    </ol>
    <p>A good walker will answer all six without hesitating, because they've thought about all six.
      If you're in {SITE['town']} or nearby, you can see exactly what I charge on the
      <a href="{R}pricing.html">prices page</a> — there's no "contact us for a quote" anywhere on
      this site.</p>

    <h2 id="faqs">Common questions</h2>
    {faq_html}
    '''
    toc = [("short-answer", "The short answer"), ("what-changes", "What changes the price"),
           ("included", "What should always be included"), ("red-flags", "Five red flags"),
           ("save", "How to spend less safely"), ("questions", "Questions to ask")]
    return _shell(g, toc, prose, [faq_schema])


# --------------------------------------------------------------------------- #
def guide_cat():
    g = GUIDES[1]
    faqs = [
        ("Can I leave my cat alone for a weekend?",
         "<p>Two nights is the practical limit with someone calling in at least once a day. Without "
         "any visits at all, you're relying on a full bowl, a clean tray and nothing going wrong — "
         "which is a gamble rather than a plan.</p>"),
        ("Are automatic feeders enough?",
         "<p>They solve food, not welfare. A feeder can't notice that your cat hasn't eaten, hasn't "
         "used the tray, is limping, or has shut itself in the airing cupboard. Use one alongside "
         "visits, not instead of them.</p>"),
        ("Is a cattery or a cat sitter better?",
         "<p>For most cats, a sitter. Cats attach to territory more than to people, so staying home "
         "avoids the carrier, the car, the strange smells and the stress. Catteries make more sense "
         "for cats needing intensive medical supervision.</p>"),
    ]
    faq_html, faq_schema = faq_block(faqs, depth=D)

    prose = f'''
    <h2 id="short-answer">The honest answer</h2>
    <p><strong>24 hours</strong> is the sensible maximum for a healthy adult cat with food, water,
      a clean litter tray and a safe home. Up to 48 hours is survivable but not kind. Anything beyond
      that needs someone physically in the house, checking that your cat is eating, drinking,
      toileting and behaving normally.</p>
    <blockquote>The risk isn't loneliness. It's that nobody is there to notice a problem — and cats
      are world-class at hiding problems until they're serious.</blockquote>

    <h2 id="depends">What changes the number</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Your cat</th><th>Maximum alone</th><th>Visits per day</th></tr></thead>
        <tbody>
          <tr><td>Healthy adult, confident, dry food</td><td>24 hours</td><td>1</td></tr>
          <tr><td>Healthy adult, wet food twice daily</td><td>12 hours</td><td>2</td></tr>
          <tr><td>Kitten under 6 months</td><td>4–6 hours</td><td>2–3</td></tr>
          <tr><td>Senior (12+) or arthritic</td><td>12 hours</td><td>2</td></tr>
          <tr><td>On medication at set times</td><td>As per dose</td><td>2 (timed)</td></tr>
          <tr><td>Diabetic or on insulin</td><td>12 hours</td><td>2 (strictly timed)</td></tr>
          <tr><td>Anxious, recently rehomed, or a bonded pair who fight</td><td>12 hours</td><td>2</td></tr>
        </tbody>
      </table>
    </div>

    <h2 id="visits">One visit a day or two?</h2>
    <p>One visit works for a short trip and a confident, healthy, dry-fed cat. Two is the right call
      whenever food is wet, medication is timed, the cat is very young or very old, or you're away
      longer than about four days — by then, a single daily check leaves a 23-hour window in which
      something can go unnoticed.</p>
    <p>A proper visit is not just a food top-up. It should include fresh water, litter trays emptied,
      a look at your cat moving and eating, some play or company if they want it, and the house made
      to look lived in. That's what a 30-minute
      <a href="{R}services/pet-check-ins.html">cat visit</a> covers — at
      £{PRICES['check_in']}, or £24 for two in a day.</p>

    <h2 id="setup">Setting the house up before you go</h2>
    <ul>
      <li><strong>Water in more than one place</strong>, away from the food, ideally one wide bowl
        and one running source. A knocked-over bowl shouldn't be a crisis.</li>
      <li><strong>One litter tray per cat, plus one</strong>, somewhere quiet and never next to the
        food.</li>
      <li><strong>Close off risk rooms</strong> — utility rooms, wardrobes, the loft hatch, the
        washing machine. Cats find the one place you'd never look.</li>
      <li><strong>Leave a radio or TV on a timer</strong> at low volume. It helps more than people
        expect.</li>
      <li><strong>Write it all down</strong>: food, doses, vet details, microchip number, and where
        the hiding spots are. Verbal instructions evaporate on day three.</li>
      <li><strong>Leave your vet written consent for treatment</strong> and an agreed spending limit.
        This is the single most important piece of paper.</li>
    </ul>

    <h2 id="signs">What a good sitter watches for</h2>
    <p>Beyond an empty bowl, the things that actually matter:</p>
    <ul>
      <li>Has food genuinely been eaten, or pushed around?</li>
      <li>Is there urine in the tray? A blocked bladder in a male cat is an emergency within hours.</li>
      <li>Any vomiting, diarrhoea, or straining?</li>
      <li>Is the cat moving normally — jumping, stretching, grooming?</li>
      <li>Third eyelid showing, hiding somewhere new, or unusually vocal?</li>
      <li>Any wounds, especially around the head and base of the tail from a scrap.</li>
    </ul>
    <p>These are the things I photograph and note on every visit, so you get a record rather than a
      thumbs-up emoji.</p>

    <h2 id="cattery">Sitter versus cattery</h2>
    <p>Cats are territorial in a way dogs simply aren't. Removing a cat from its territory, driving
      it somewhere loud and unfamiliar, and surrounding it with other cats it can smell but not
      avoid is genuinely stressful for most of them. Staying home means their smells, their
      windowsill, their routine — plus no carrier battle and no vaccination requirements.</p>
    <p>A cattery makes sense where a cat needs close medical supervision, where a home is being
      renovated, or where a cat has a history of escaping. For everything else, in-home visits win.</p>

    <h2 id="faqs">Common questions</h2>
    {faq_html}
    <p>Planning a trip from {SITE['town']} or nearby? <a href="{R}book.html">Book a free meet &amp;
      greet</a> and I'll come and learn your cat's hiding spots before you go anywhere.</p>
    '''
    toc = [("short-answer", "The honest answer"), ("depends", "What changes the number"),
           ("visits", "One visit a day or two?"), ("setup", "Setting the house up"),
           ("signs", "What a good sitter watches for"), ("cattery", "Sitter vs cattery")]
    return _shell(g, toc, prose, [faq_schema])


# --------------------------------------------------------------------------- #
def guide_puppy():
    g = GUIDES[2]
    faqs = [
        ("Can I socialise my puppy before their vaccinations are finished?",
         "<p>Yes, and you must. Carry them outside, drive them around, visit friends with healthy "
         "vaccinated dogs, and let them watch the world from your arms or a car boot. The risk of "
         "under-socialisation causes far more problems in practice than the small, manageable risk "
         "of early, careful exposure.</p>"),
        ("How much socialisation is too much?",
         "<p>If your puppy is frozen, frantic, refusing food or trying to leave, you've gone too far. "
         "Two or three short, positive outings a week beat a daily marathon. Quality and recovery "
         "time matter more than volume.</p>"),
        ("My puppy is scared of everything — is it too late?",
         "<p>No. After sixteen weeks it takes longer and needs more structure, but fearful dogs can "
         "absolutely learn that the world is safe. Work under threshold, pair scary things with "
         "brilliant food, and get help early rather than after the first growl.</p>"),
    ]
    faq_html, faq_schema = faq_block(faqs, depth=D)

    prose = f'''
    <h2 id="why">Why weeks 8–16 matter so much</h2>
    <p>Puppies have a sensitive period for socialisation that closes at around sixteen weeks. Inside
      that window, new things are filed as "normal". Outside it, new things are filed as "suspicious"
      and need much more work to un-file. It is the single highest-return training you will ever do,
      and the deadline is real.</p>
    <p>Socialisation is not "meeting as many dogs as possible". It's <em>positive, controlled
      exposure</em> — your puppy noticing something new while feeling safe, and ideally while eating
      something excellent.</p>

    <h2 id="rules">Three rules that stop it backfiring</h2>
    <ol>
      <li><strong>Distance is your dial.</strong> If your puppy can't eat, you're too close. Move
        back until they can, then stay there.</li>
      <li><strong>Let them choose.</strong> Never carry a puppy towards something frightening or let
        strangers loom over them. Approach should always be the puppy's decision.</li>
      <li><strong>Short and sweet.</strong> Five brilliant minutes then home. Puppies consolidate
        learning in their sleep — which they need eighteen hours of a day.</li>
    </ol>

    <h2 id="checklist">The checklist</h2>
    <h3>People</h3>
    <ul>
      <li>Men with beards, deep voices, hats and hoods</li>
      <li>Children — at a distance first, calm and supervised</li>
      <li>Wheelchairs, walking sticks, prams and mobility scooters</li>
      <li>High-vis jackets, uniforms, motorbike helmets</li>
      <li>Umbrellas going up (from ten metres away, with cheese)</li>
    </ul>
    <h3>Sounds</h3>
    <ul>
      <li>Hoover, hairdryer, washing machine on spin</li>
      <li>Doorbell, smoke alarm chirp, phone ringtone</li>
      <li>Traffic, bin lorries, motorbikes, sirens</li>
      <li>Fireworks and thunder — via a sound-desensitisation track at low volume</li>
    </ul>
    <h3>Surfaces and places</h3>
    <ul>
      <li>Grass, gravel, tarmac, metal drain covers, wet decking</li>
      <li>Stairs, car boots, vet waiting rooms (just to visit and leave)</li>
      <li>Pet shops, garden centres, quiet cafés, the school run from across the road</li>
    </ul>
    <h3>Handling</h3>
    <ul>
      <li>Paws, ears, mouth, tail, collar holds — paired with food every time</li>
      <li>Brushing, nail file, being lifted, being held still for ten seconds</li>
      <li>A mock vet exam: on a table, temperature-free, treats throughout</li>
    </ul>
    <h3>Dogs</h3>
    <ul>
      <li>Two or three <em>known, vaccinated, sensible</em> adult dogs — not a free-for-all</li>
      <li>Watching dogs walk past at a distance, calmly, while eating</li>
      <li>Learning to disengage: see the dog, look back at you, get paid</li>
    </ul>

    <h2 id="week-by-week">Week by week</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Age</th><th>Focus</th><th>Looks like</th></tr></thead>
        <tbody>
          <tr><td>8–9 weeks</td><td>Home and handling</td>
            <td>Name games, crate and mat, household sounds at low volume, carrying outside</td></tr>
          <tr><td>9–10 weeks</td><td>Car and street</td>
            <td>Short car trips ending somewhere nice, watching traffic from your arms</td></tr>
          <tr><td>10–12 weeks</td><td>People and surfaces</td>
            <td>Visitors with treats, novel surfaces in the garden, vet reception visits</td></tr>
          <tr><td>12–14 weeks</td><td>Other dogs and the wider world</td>
            <td>Calm meetings with known adult dogs, first proper walks, lead skills</td></tr>
          <tr><td>14–16 weeks</td><td>Generalising</td>
            <td>Same skills in new places, longer settles in cafés, recall on a long line</td></tr>
        </tbody>
      </table>
    </div>

    <h2 id="mistakes">The five most common mistakes</h2>
    <ol>
      <li><strong>Waiting for the second vaccination.</strong> By then you've lost half the window.
        Carry them out from day one.</li>
      <li><strong>Puppy free-for-alls.</strong> Uncontrolled play with rude dogs teaches puppies that
        other dogs are either terrifying or a party — neither helps on a lead at fourteen months.</li>
      <li><strong>Forcing contact.</strong> "He needs to get used to it" is how fear gets built.</li>
      <li><strong>Skipping sleep.</strong> An over-tired puppy looks like a badly behaved one. Aim
        for 18 hours of sleep a day, enforced with a crate or pen.</li>
      <li><strong>Stopping at sixteen weeks.</strong> Adolescence re-tests everything at 6–12 months.
        Keep going, just with less intensity.</li>
    </ol>

    <h2 id="help">When to get help</h2>
    <p>Get help early if your puppy freezes, growls, snaps, hides, or won't take food in a situation
      most puppies handle. Early is cheap and quick; late is neither. In {SITE['town']} I run
      <a href="{R}services/puppy-training.html">one-to-one puppy training</a> in your home, and
      <a href="{R}services/pet-check-ins.html#puppy-pop-ins">lunchtime pop-ins</a> that keep the
      toilet training and the socialisation ticking along while you're at work.</p>

    <h2 id="faqs">Common questions</h2>
    {faq_html}
    '''
    toc = [("why", "Why weeks 8–16 matter"), ("rules", "Three rules"),
           ("checklist", "The checklist"), ("week-by-week", "Week by week"),
           ("mistakes", "Common mistakes"), ("help", "When to get help")]
    return _shell(g, toc, prose, [faq_schema])


# --------------------------------------------------------------------------- #
def guides_index():
    cards = "".join(f'''<article class="card post-card reveal">
      <span class="tag">{g['tag']}</span>
      <h3><a href="{g['slug']}">{g['h1']}</a></h3>
      <p class="dim">{g['lede']}</p>
      <p class="post-meta">{SITE['owner']} · {g['read']}</p>
      <a class="link-arrow" href="{g['slug']}">Read the guide {icon('arrow-right', 16)}</a>
    </article>''' for g in GUIDES)

    body = f'''<section class="page-hero">
  <div class="container">
    {breadcrumbs([("Home", "index.html"), ("Guides", None)], depth=D)}
    <div class="section-head reveal">
      <span class="eyebrow">{icon('sparkle', 14)} Guides</span>
      <h1>Straight answers about looking after your pet</h1>
      <p class="lede">The questions I get asked most, written down properly. No fluff.
        Well — some fluff.</p>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container">
    <h2 class="sr-only">All guides</h2>
    <div class="grid grid-3">{cards}</div>
  </div>
</section>
{testimonials_section(depth=D)}
{cta_band(depth=D, title="Rather just ask me?",
          sub="Every question on this site started as a message from a real owner. Send yours.")}'''

    schema = [breadcrumb_schema([("Home", ""), ("Guides", "guides/")])]
    return ("guides/index.html", dict(
        title=f"Pet Care Guides | Dog Walking, Cats & Puppies | {SITE['name']}",
        description=("Practical guides from a professional dog walker and pet sitter: what dog "
                     "walkers cost, how long you can leave a cat, and a puppy socialisation "
                     "checklist."),
        path="guides/", body=body, active="guides", depth=D, schema=schema), "monthly", "0.7")


def all_pages():
    return [guides_index(), guide_cost(), guide_cat(), guide_puppy()]
