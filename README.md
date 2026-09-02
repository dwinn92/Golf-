# Fairway — WHS Handicap Tracker

A personal golf handicap app implementing the **World Handicap System** as operated by
**England Golf** (2024 Rules of Handicapping revision). No build step, no dependencies,
no server — open `index.html` in a browser and your data stays in `localStorage`.

## Features

- **Handicap Index** — average of your best 8 score differentials from the last 20 rounds,
  with the official small-record selection table (from 3 scores upward, including the
  −2.0 / −1.0 initial adjustments).
- **Score differentials** — `(113 ÷ Slope) × (Adjusted Gross − Course Rating − PCC)`,
  with PCC (−1 to +3) supported on every score.
- **Safeguards** — soft cap (growth above Low HI + 3.0 halved), hard cap (Low HI + 5.0),
  exceptional score reductions (−1.0 / −2.0 applied across the most recent 20
  differentials), and the 54.0 maximum index.
- **Low Handicap Index** tracked over the 365 days preceding your most recent round,
  active once you have a 20-score record.
- **Score entry** — quick adjusted-gross total, or hole-by-hole with automatic
  **net double bogey** adjustment from your Course Handicap and each hole's stroke index
  (par + 5 cap before you have an index, per the rules for new players).
- **Course & Playing Handicap calculator** — Course Handicap includes the England Golf
  `(Course Rating − Par)` adjustment; Playing Handicap allowances for common formats
  (95% singles stroke play, 100% match play, 90% fourball, etc.), plus a per-hole
  strokes-received chart when hole data is available.
- **Courses** — store the courses/tees you play (par, Course Rating, Slope Rating and
  optional hole-by-hole par/stroke index, validated against the tee par).
- **Dashboard** — index progression chart, latest-20 differential strip with your
  counting 8 highlighted, Low HI and best-round stats.
- **Backup** — export/import your full record as JSON.

## Running

Open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Tests

The calculation engine (`js/whs.js`) is pure and covered by unit tests:

```sh
node tests/whs.test.js
```

## Scope & disclaimers

- 18-hole rounds only (9-hole expected-score conversion is not implemented).
- The bundled courses are **samples with fictional ratings** — add your real courses
  from the scorecard.
- This is a personal tracker. Your official Handicap Index is maintained by your club
  through the England Golf / WHS platform; use that for competitions.
