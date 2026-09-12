"""The home page."""
from site_config import (SITE, PRICES, icon, stars, logo_svg, trust_strip,
                         testimonials_section, cta_band, faq_block)

HOME_FAQS = [
    (f"How much does a dog walker cost in {SITE['town']}?",
     f"<p>A 60-minute small-group adventure walk is <strong>£{PRICES['group_walk']}</strong>, and a "
     f"solo one-to-one walk is <strong>£{PRICES['solo_walk']}</strong>. In-home cat visits and pet "
     f"check-ins are <strong>£{PRICES['check_in']}</strong> per 30-minute visit, and a block of five "
     f"group walks is <strong>£{PRICES['bundle_5']}</strong> — a week of walks for the price of "
     f"four and a half. Everything is listed openly on the "
     f"<a href='pricing.html'>prices page</a>; there are no booking fees, no peak-time surcharges "
     f"and no lock-in contracts.</p>"),
    ("Are you insured, DBS checked and first aid trained?",
     "<p>All three. I hold full public liability and care-custody-control insurance, an enhanced "
     "DBS certificate, and a certified canine first aid qualification that I refresh every two "
     "years. I bring the paperwork to the meet &amp; greet so you can see it for yourself — you "
     "shouldn't have to ask a stranger for proof before handing over a key.</p>"),
    ("How many dogs are on a group walk?",
     "<p>Four, maximum. Most walkers take six to eight. Four means I can actually watch every dog, "
     "keep recall tight, and match personalities properly — the bouncy teenagers go out together, "
     "the gentle seniors get the calmer route. Your dog is never thrown into a group they haven't "
     "been introduced to.</p>"),
    ("What happens at the free meet &amp; greet?",
     "<p>I come to your home for about 30 minutes. We do the boring-but-important bits — vet "
     "details, feeding, medication, quirks, recall, the neighbour's cat they hate — and your dog "
     "gets to decide whether they like me (they usually do; I come with cheese). You'll get keys "
     "sorted, paperwork signed and a schedule agreed. It costs nothing and there's no obligation "
     "to book.</p>"),
    ("Do you look after cats and other pets too?",
     f"<p>Yes — in-home cat visits are one of my favourite parts of the week. A 30-minute check-in "
     f"covers feeding, fresh water, litter trays, medication, play or a lap-sit, plus post, plants, "
     f"curtains and lights so the house looks lived in. I also do rabbits, guinea pigs, small "
     f"furries and fish. <a href='services/pet-check-ins.html'>See what's included</a>.</p>"),
    ("How will I know my pet is okay?",
     "<p>Every walk and visit ends with a report card in your phone: photos, where you went, how "
     "far, toilet notes, mood, food eaten and anything I noticed. Group walks are tracked live on "
     "a Tractive GPS so you can see the route, not just take my word for it.</p>"),
    ("My dog is reactive or nervous — can you still help?",
     "<p>Very often, yes. Reactive and anxious dogs go out solo on quiet field and canal routes at "
     "off-peak times, at their pace, with a longer settle-in period of two or three visits before "
     "anything changes. Tell me everything at the meet &amp; greet — including the embarrassing "
     "bits. I have never once judged a dog for being a dog.</p>"),
    ("How do you get into my home?",
     "<p>Whatever suits you: a coded key safe (my preference, and I'll help you fit one), a key "
     "held securely, or you letting me in. Keys are tagged with a code — never your name, address "
     "or your pet's name — stored in a locked box, and handed straight back if you stop booking.</p>"),
    ("Can I book a one-off walk, or does it have to be regular?",
     "<p>Both work. Regular weekly slots get priority and the block-booking price; one-offs and "
     "holiday cover are welcome whenever I have space. Change or cancel with 24 hours' notice and "
     "there's no charge.</p>"),
    (f"Which areas do you cover?",
     f"<p>{', '.join(SITE['areas'][:-1])} and {SITE['areas'][-1]} — roughly a 15-minute drive "
     f"around {SITE['town']}. Just outside? <a href='areas.html'>Check the areas page</a> or ask; "
     f"if I'm already passing your road, I can usually make it work.</p>"),
]


def home():
    faq_html, faq_schema = faq_block(HOME_FAQS)

    hero = f'''<section class="hero">
  <div class="container-wide hero-inner">
    <div class="hero-copy hero-anim">
      <span class="eyebrow">{icon('map-pin', 14)} Dog walking &amp; pet care in {SITE['town']}</span>
      <h1>The best part of <span class="accent">their day.</span></h1>
      <p class="lede">Small-group adventure walks, in-home cat visits and kind puppy training —
        GPS-tracked, fully insured, and photographed so you see every muddy grin while you're stuck
        in a meeting.</p>
      <div class="hero-actions">
        <a class="btn btn-primary btn-lg" href="book.html">Book a free meet &amp; greet {icon('arrow-right', 18)}</a>
        <a class="btn btn-ghost btn-lg" href="#services">See services &amp; prices</a>
      </div>
      <div class="hero-chips">
        <span class="chip">{icon('shield', 16)} Fully insured</span>
        <span class="chip">{icon('id-card', 16)} DBS checked</span>
        <span class="chip">{icon('first-aid', 16)} Canine first aid</span>
        <span class="chip">{icon('route', 16)} Tractive GPS tracked</span>
      </div>
      <div class="hero-rating">
        <span class="avatar-stack">
          <img src="assets/img/pet-golden.png" alt="" width="40" height="40" loading="lazy" decoding="async">
          <img src="assets/img/pet-lab.png" alt="" width="40" height="40" loading="lazy" decoding="async">
          <img src="assets/img/pet-cockapoo.png" alt="" width="40" height="40" loading="lazy" decoding="async">
          <img src="assets/img/pet-cat.png" alt="" width="40" height="40" loading="lazy" decoding="async">
        </span>
        {stars()}
        <span><strong>{SITE['rating']}</strong> from {SITE['review_count']} local reviews</span>
      </div>
    </div>

    <div class="hero-badge">
      {logo_svg(cls="badge-logo", uid="hero")}
      <div class="sticker sticker-1">
        <span class="sticker-dot">{icon('camera', 18)}</span>
        <span>Walk done · 2:15pm<small>38 photos sent</small></span>
      </div>
      <div class="sticker sticker-2">
        <span class="sticker-dot green">{icon('route', 18)}</span>
        <span>4.2 km tracked<small>Bluebell Woods loop</small></span>
      </div>
    </div>
  </div>

  <div class="hero-pack">
    <svg class="paw-float" style="left:6%;top:14%;--r:-18deg" width="46" height="46" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.5 3.2c1.3 0 2.3 1.5 2.3 3.3S8.8 9.8 7.5 9.8 5.2 8.3 5.2 6.5 6.2 3.2 7.5 3.2Zm9 0c1.3 0 2.3 1.5 2.3 3.3s-1 3.3-2.3 3.3-2.3-1.5-2.3-3.3 1-3.3 2.3-3.3ZM3.6 9.4c1.2-.3 2.5.7 3 2.4.4 1.6-.2 3.2-1.4 3.5-1.2.3-2.5-.7-3-2.4-.4-1.6.2-3.2 1.4-3.5Zm16.8 0c1.2.3 1.8 1.9 1.4 3.5-.5 1.7-1.8 2.7-3 2.4-1.2-.3-1.8-1.9-1.4-3.5.5-1.7 1.8-2.7 3-2.4ZM12 12.6c3.2 0 5.8 2.3 5.8 4.9 0 2-1.7 3.3-3.7 2.9-1.5-.3-2.7-.3-4.2 0-2 .4-3.7-.9-3.7-2.9 0-2.6 2.6-4.9 5.8-4.9Z"/></svg>
    <svg class="paw-float green" style="right:9%;top:8%;--r:22deg" width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.5 3.2c1.3 0 2.3 1.5 2.3 3.3S8.8 9.8 7.5 9.8 5.2 8.3 5.2 6.5 6.2 3.2 7.5 3.2Zm9 0c1.3 0 2.3 1.5 2.3 3.3s-1 3.3-2.3 3.3-2.3-1.5-2.3-3.3 1-3.3 2.3-3.3ZM3.6 9.4c1.2-.3 2.5.7 3 2.4.4 1.6-.2 3.2-1.4 3.5-1.2.3-2.5-.7-3-2.4-.4-1.6.2-3.2 1.4-3.5Zm16.8 0c1.2.3 1.8 1.9 1.4 3.5-.5 1.7-1.8 2.7-3 2.4-1.2-.3-1.8-1.9-1.4-3.5.5-1.7 1.8-2.7 3-2.4ZM12 12.6c3.2 0 5.8 2.3 5.8 4.9 0 2-1.7 3.3-3.7 2.9-1.5-.3-2.7-.3-4.2 0-2 .4-3.7-.9-3.7-2.9 0-2.6 2.6-4.9 5.8-4.9Z"/></svg>
    <img data-parallax src="assets/img/pack.png" srcset="assets/img/pack-660.png 660w, assets/img/pack.png 1320w"
         sizes="(max-width: 1180px) 100vw, 1180px" width="1320" height="386" fetchpriority="high" decoding="async"
         alt="Four happy dogs and a cat peeking over a fence, waiting for their walk">
    <svg class="hero-hill" viewBox="0 0 1440 130" preserveAspectRatio="none" aria-hidden="true">
      <path fill="#1F4B32" d="M0 44c150-26 290-38 420-34 168 5 286 34 470 36 156 2 330-16 550-44v128H0Z"/>
    </svg>
  </div>
</section>'''

    services = f'''<section class="section" id="services">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('paw', 14)} What I do</span>
      <h2>Three ways to make your pet's day</h2>
      <p class="lede">Same me, same dogs, same cat cuddles — just a name you'll actually remember.
        Every service starts with a free meet &amp; greet.</p>
    </div>

    <div class="grid grid-3">
      <article class="card service-card reveal">
        <span class="badge-pill pink">Most booked</span>
        <div class="service-media">
          <img src="assets/img/pet-golden.png" alt="Golden retriever grinning on a group walk" width="122" height="122" loading="lazy" decoding="async">
        </div>
        <div class="service-body">
          <h3>Group dog walking</h3>
          <p>An hour of proper countryside sniffing with a maximum of four carefully matched dogs.</p>
          <ul>
            <li>{icon('check', 16)} Collected and dropped home, paws towelled</li>
            <li>{icon('check', 16)} Live Tractive GPS route on every walk</li>
            <li>{icon('check', 16)} Photo report card before I've left the drive</li>
          </ul>
          <p class="price">From £{PRICES['group_walk']} <span>/ 60-minute walk</span></p>
          <a class="link-arrow" href="services/dog-walking.html">Dog walking details {icon('arrow-right', 16)}</a>
        </div>
      </article>

      <article class="card service-card reveal reveal-delay-1">
        <div class="service-media">
          <img src="assets/img/pet-cat.png" alt="Fluffy cat waiting at home for a check-in visit" width="122" height="122" loading="lazy" decoding="async">
        </div>
        <div class="service-body">
          <h3>Cat visits &amp; pet check-ins</h3>
          <p>Your home, your pet's routine, nothing out of place — just a friendly face at lunchtime.</p>
          <ul>
            <li>{icon('check', 16)} Feeds, fresh water, litter trays, medication</li>
            <li>{icon('check', 16)} Play, fuss or a quiet lap-sit — their choice</li>
            <li>{icon('check', 16)} Post, plants, curtains and lights as standard</li>
          </ul>
          <p class="price">From £{PRICES['check_in']} <span>/ 30-minute visit</span></p>
          <a class="link-arrow" href="services/pet-check-ins.html">Check-in details {icon('arrow-right', 16)}</a>
        </div>
      </article>

      <article class="card service-card reveal reveal-delay-2">
        <div class="service-media">
          <img src="assets/img/pet-cockapoo.png" alt="Cockapoo puppy mid-training session" width="122" height="122" loading="lazy" decoding="async">
        </div>
        <div class="service-body">
          <h3>Puppy &amp; basic obedience</h3>
          <p>Kind, reward-based training that fits around real life and actually sticks.</p>
          <ul>
            <li>{icon('check', 16)} Recall, loose lead, settle, the four-month wobble</li>
            <li>{icon('check', 16)} In your home and on your real-life routes</li>
            <li>{icon('check', 16)} Written plan after every session</li>
          </ul>
          <p class="price">From £{PRICES['training_session']} <span>/ 60-minute session</span></p>
          <a class="link-arrow" href="services/puppy-training.html">Training details {icon('arrow-right', 16)}</a>
        </div>
      </article>
    </div>

    <p class="center dim mt-4 reveal">Also available: solo walks for dogs who like their own space
      (£{PRICES['solo_walk']}), puppy pop-ins (£{PRICES['puppy_visit']}) and holiday cover.
      <a class="link-arrow" href="pricing.html">See all prices {icon('arrow-right', 16)}</a></p>
  </div>
</section>'''

    updates = f'''<section class="section band-cream" id="updates">
  <div class="container feature-row">
    <div class="reveal">
      <span class="eyebrow">{icon('camera', 14)} Never wonder again</span>
      <h2>Every walk lands in your phone</h2>
      <p class="lede mt-2">You're in a meeting. They're knee-deep in a stream. Within minutes of
        getting home you'll know exactly where they went, how far, what they did and whether they
        made a new best friend.</p>
      <ul class="feature-list">
        <li><span class="feature-icon">{icon('route', 20)}</span>
          <span><strong>Live GPS route</strong><p>A Tractive tracker on the group lead, so you see
            the real map — not a promise.</p></span></li>
        <li><span class="feature-icon">{icon('camera', 20)}</span>
          <span><strong>Photo report card</strong><p>Photos, distance, toilet notes, mood and
            anything I spotted — sent after every single visit.</p></span></li>
        <li><span class="feature-icon green">{icon('users', 20)}</span>
          <span><strong>The same familiar face</strong><p>No rota, no stranger at the door. It's me,
            every time, in the same van your dog already recognises.</p></span></li>
        <li><span class="feature-icon green">{icon('key', 20)}</span>
          <span><strong>Keys kept properly</strong><p>Coded tags, locked box, no addresses. Returned
            the moment you stop booking.</p></span></li>
      </ul>
      <a class="btn btn-green mt-4" href="book.html">Start with a free meet &amp; greet {icon('arrow-right', 18)}</a>
    </div>

    <div class="feature-media reveal reveal-delay-1">
      <div class="phone">
        <div class="phone-screen">
          <span class="phone-notch"></span>
          <div class="phone-head">
            <img src="assets/img/pet-golden.png" alt="" width="34" height="34" loading="lazy" decoding="async">
            <span><strong>Gemma · What the Fluff</strong><small>● Walking now</small></span>
          </div>
          <div class="phone-body">
            <div class="msg">Morning! Picking Luna up at 11 🐾<time>10:52</time></div>
            <div class="msg">
              <img src="assets/img/pet-lab.png" alt="" width="120" height="120" loading="lazy" decoding="async" style="width:120px;height:auto">
              She found the world's muddiest puddle. Sorry in advance.<time>12:04</time>
            </div>
            <div class="msg me">Amazing 😂 thank you!<time>12:06</time></div>
          </div>
          <div class="phone-map">
            <span class="phone-map-chip">4.2 km · 58 min · Bluebell Woods</span>
            <svg viewBox="0 0 300 150" preserveAspectRatio="none">
              <rect width="300" height="150" fill="#EEF6F0"/>
              <path d="M0 96c34 0 40-40 74-40s42 54 84 54 46-52 78-52 44 22 64 22" stroke="#DCEBE1" stroke-width="16" fill="none" stroke-linecap="round"/>
              <path class="route" d="M18 118c30-6 26-56 62-58s40 50 76 46 44-46 74-46"/>
              <circle cx="18" cy="118" r="6" fill="#1F4B32"/>
              <circle cx="230" cy="60" r="6" fill="#E0457F"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>'''

    stats = f'''<section class="section-sm">
  <div class="container stats reveal">
    <div class="stat"><p class="num"><span data-count="9400" data-suffix="+">9,400+</span></p><p>walks &amp; visits completed</p></div>
    <div class="stat"><p class="num"><span data-count="120" data-suffix="+">120+</span></p><p>local families on the books</p></div>
    <div class="stat"><p class="num"><span data-count="4.9" data-decimals="1">4.9</span><i>★</i></p><p>average review score</p></div>
    <div class="stat"><p class="num"><span data-count="4">4</span></p><p>dogs per group walk, max</p></div>
  </div>
</section>'''

    why = f'''<section class="section band-pink" id="why">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('sparkle', 14)} Why families stay</span>
      <h2>Care you'd give them yourself</h2>
      <p class="lede">Anyone can hold a lead. These are the bits that make the difference on a wet
        Tuesday in February.</p>
    </div>
    <div class="grid grid-3">
      <div class="card reveal"><span class="feature-icon">{icon('users', 20)}</span>
        <h3 class="mt-2">Four dogs. Never more.</h3>
        <p>Matched by size, pace and personality. Small enough that I can watch every single one of
          them, all of the time.</p></div>
      <div class="card reveal reveal-delay-1"><span class="feature-icon green">{icon('first-aid', 20)}</span>
        <h3 class="mt-2">Trained for the bad day</h3>
        <p>Canine first aid certified and refreshed, with a pet first aid kit in the van and your
          vet on speed dial. You hope it never matters. It's there anyway.</p></div>
      <div class="card reveal reveal-delay-2"><span class="feature-icon">{icon('shield', 20)}</span>
        <h3 class="mt-2">Insured, DBS checked, boringly professional</h3>
        <p>Full public liability and care-custody-control cover, enhanced DBS certificate, written
          terms. Shown at the meet &amp; greet without you having to ask.</p></div>
      <div class="card reveal"><span class="feature-icon green">{icon('heart', 20)}</span>
        <h3 class="mt-2">Force-free, always</h3>
        <p>No prong collars, no shouting, no dominance nonsense. Rewards, patience and a genuinely
          silly amount of cheese.</p></div>
      <div class="card reveal reveal-delay-1"><span class="feature-icon">{icon('calendar', 20)}</span>
        <h3 class="mt-2">Life-proof flexibility</h3>
        <p>Shift changed? Meeting overran? Message me. Change or cancel with 24 hours' notice, and
          no contract ever ties you in.</p></div>
      <div class="card reveal reveal-delay-2"><span class="feature-icon green">{icon('leaf', 20)}</span>
        <h3 class="mt-2">Routes they actually love</h3>
        <p>Bluebell woods, canal towpaths, the big field with the rabbit smells. Rotated weekly so
          nobody gets bored — including me.</p></div>
    </div>
  </div>
</section>'''

    steps = f'''<section class="section" id="how">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('play', 14)} How it works</span>
      <h2>Booked in three easy steps</h2>
      <p class="lede">From first message to first walk is usually under a week — often a lot less.</p>
    </div>
    <div class="steps">
      <svg class="steps-path" viewBox="0 0 1000 80" preserveAspectRatio="none" aria-hidden="true">
        <path d="M170 40C300 -10 380 70 500 40s200-70 330-10"/>
      </svg>
      <div class="step reveal">
        <div class="step-num">1</div>
        <h3>Say hello</h3>
        <p>Fill in the form, call or WhatsApp me. Tell me about your pet, your postcode and the days
          you're after. I'll reply within the hour.</p>
      </div>
      <div class="step reveal reveal-delay-1">
        <div class="step-num">2</div>
        <h3>Free meet &amp; greet</h3>
        <p>I come round for half an hour. Your pet sniffs me, we sort keys, paperwork and quirks, and
          you decide — no pressure, no charge.</p>
      </div>
      <div class="step reveal reveal-delay-2">
        <div class="step-num">3</div>
        <h3>Walkies</h3>
        <p>Your slot is yours. Photos, GPS map and a full report land in your phone after every walk
          or visit, forever.</p>
      </div>
    </div>
    <div class="center mt-5 reveal">
      <a class="btn btn-primary btn-lg" href="book.html">Book your free meet &amp; greet {icon('arrow-right', 18)}</a>
      <p class="small dim mt-2">No card details. No contract. Just a cuppa and a very enthusiastic hello.</p>
    </div>
  </div>
</section>'''

    pricing = f'''<section class="section band-cream" id="pricing">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('gift', 14)} Simple prices</span>
      <h2>No booking fees. No surprises.</h2>
      <p class="lede">Prices below are per pet and include everything — travel, towels, treats,
        photos and the GPS tracking.</p>
    </div>
    <div class="grid grid-3">
      <div class="card price-card reveal">
        <h3>Solo walk</h3>
        <p class="dim small">For dogs who prefer their own company, are reactive, elderly or still
          learning the ropes.</p>
        <p class="amount"><sup>£</sup>{PRICES['solo_walk']} <small>/ 60 min</small></p>
        <ul>
          <li>{icon('check', 16)} One-to-one, your dog's pace</li>
          <li>{icon('check', 16)} Quiet routes at off-peak times</li>
          <li>{icon('check', 16)} 30-minute option £{PRICES['solo_walk_30']}</li>
        </ul>
        <a class="btn btn-ghost btn-block" href="book.html?service=solo-walk">Book a solo walk</a>
      </div>

      <div class="card price-card featured reveal reveal-delay-1">
        <span class="badge-pill pink">Most popular</span>
        <h3>Group adventure walk</h3>
        <p class="dim small">An hour of sniffing, splashing and being a dog — with four friends,
          maximum.</p>
        <p class="amount"><sup>£</sup>{PRICES['group_walk']} <small>/ 60 min</small></p>
        <ul>
          <li>{icon('check', 16)} Live GPS route &amp; photo report</li>
          <li>{icon('check', 16)} Collection and drop-off included</li>
          <li>{icon('check', 16)} 5-walk block £{PRICES['bundle_5']} (save £5)</li>
        </ul>
        <a class="btn btn-primary btn-block" href="book.html?service=group-walk">Book a group walk</a>
      </div>

      <div class="card price-card reveal reveal-delay-2">
        <h3>Cat visit / check-in</h3>
        <p class="dim small">Cats, kittens, puppies, rabbits and small furries — fed, cleaned,
          fussed and photographed.</p>
        <p class="amount"><sup>£</sup>{PRICES['check_in']} <small>/ 30 min</small></p>
        <ul>
          <li>{icon('check', 16)} Feeding, water, litter &amp; meds</li>
          <li>{icon('check', 16)} Post, plants, curtains, lights</li>
          <li>{icon('check', 16)} Two visits a day £24</li>
        </ul>
        <a class="btn btn-ghost btn-block" href="book.html?service=cat-visit">Book a check-in</a>
      </div>
    </div>
    <p class="price-note center reveal">Training from £{PRICES['training_session']} per session or
      £{PRICES['training_package']} for the four-session puppy package. Multi-pet discount of £3 per
      extra pet in the same home. <a class="link-arrow" href="pricing.html">Full price list {icon('arrow-right', 16)}</a></p>
  </div>
</section>'''

    about = f'''<section class="section band-green" id="about">
  <div class="container feature-row">
    <div class="reveal">
      <span class="eyebrow on-green">{icon('heart-solid', 14)} Hello, I'm {SITE['owner']}</span>
      <h2>Same me. Same dogs. Same cat visits and training.</h2>
      <p class="lede mt-2">I've been walking {SITE['town']}'s dogs for six years — first as Walkies
        with Gemma, briefly as For Fluff's Sake, and now as What the Fluff, because apparently I
        cannot be trusted around Canva and a logo idea.</p>
      <p class="mt-2">What hasn't changed: I take four dogs, not eight. I send photos every time. I
        learn which lamp post your dog must sniff and I let them. And I treat your home and your keys
        the way I'd want a stranger to treat mine.</p>
      <p class="hand mt-3" style="font-size:1.9rem;line-height:1">Gemma x</p>
      <div class="flex wrap gap-1 mt-3">
        <a class="btn btn-white" href="about.html">My story {icon('arrow-right', 18)}</a>
        <a class="btn btn-primary" href="book.html">Meet me and the pack</a>
      </div>
    </div>
    <div class="feature-media reveal reveal-delay-1">
      <div class="grid grid-2" style="gap:1rem">
        <div class="cta-card"><strong>{icon('id-card', 18)} Enhanced DBS certificate</strong>
          <p class="small">Checked, current, and shown at every meet &amp; greet.</p></div>
        <div class="cta-card"><strong>{icon('shield', 18)} Full pet business insurance</strong>
          <p class="small">Public liability plus care, custody and control cover.</p></div>
        <div class="cta-card"><strong>{icon('first-aid', 18)} Canine first aid certified</strong>
          <p class="small">Refreshed every two years. Kit in the van, always.</p></div>
        <div class="cta-card"><strong>{icon('graduation', 18)} Force-free training methods</strong>
          <p class="small">Reward-based, evidence-led, no fear or force. Ever.</p></div>
      </div>
    </div>
  </div>
</section>'''

    areas_list = "".join(
        f'<a class="area-chip" href="areas.html#{a.lower().replace(" ", "-")}">{icon("map-pin", 15)} {a}</a>'
        for a in SITE["areas"])
    areas = f'''<section class="section" id="areas">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('map-pin', 14)} Where I walk</span>
      <h2>Covering {SITE['town']} and the villages around it</h2>
      <p class="lede">Roughly a 15-minute drive from {SITE['town']} centre. If your road isn't
        listed, ask anyway — I'm often nearby.</p>
    </div>
    <div class="area-grid justify-center reveal" style="justify-content:center">{areas_list}</div>
    <p class="center mt-4 reveal"><a class="link-arrow" href="areas.html">See all areas covered {icon('arrow-right', 16)}</a></p>
  </div>
</section>'''

    faq = f'''<section class="section band-cream" id="faq">
  <div class="container" style="max-width:52rem">
    <div class="section-head center reveal">
      <span class="eyebrow">{icon('message', 14)} Good questions</span>
      <h2>Everything you're about to ask</h2>
      <p class="lede">And a few things you might not think of until the first day.</p>
    </div>
    {faq_html}
    <p class="center mt-4 reveal dim">Still wondering something?
      <a class="link-arrow" href="https://wa.me/{SITE['whatsapp']}" rel="noopener">Ask me on WhatsApp {icon('arrow-right', 16)}</a></p>
  </div>
</section>'''

    body = (hero + trust_strip() + services + updates + stats + why + steps
            + testimonials_section() + pricing + about + areas + faq + cta_band())
    # the LocalBusiness node is added to every page by site_config.page()
    return body, [faq_schema]
