# Texas High School Sports

An English-language Texas high school sports app. Public UIL records are the default experience. The original fictional demo remains available only through **Explore demo** (`?mode=demo`). All pages use the same static site and work on GitHub Pages without a backend.

## Data included in v0.2

| Dataset | Coverage |
| --- | --- |
| UIL 2026–28 school listing | 1,566 school entries, with source-reported class and enrollment |
| Football district listings | 1,268 schools |
| Basketball district listings | 1,389 schools |
| Volleyball district listings | 1,255 schools |
| Historical football results | 24 state championship finals: 12 from 2025–26 and 12 from 2024–25 |

Primary sources:

- [UIL 2026–28 Realignment Alphabetical Listing](https://realignment.uiltexas.org/alignments/2026/Alpha_26-28.pdf)
- [UIL Football State Archives](https://www.uiltexas.org/football/archives)

**Coverage limits:** This is the UIL realignment list, not every public and private high school in Texas. Program districts do not verify varsity rosters or gender-specific participation. Soccer districts, live and regular-season scores, full-season records, power ratings, forecasts, news feeds, city data, mascots, and player health information are not imported.

The historical result’s class and season are kept separate from current alignment. For example, Hamilton won the 2025–26 2A Division 1 football final, while its 2026–28 school listing is 3A. Missing ratings, ranks, and season win/loss records remain `null`, never zero or synthetic values. Imported game dates and venues remain unknown; team order reflects champion/runner-up, not home/away.

This is an independent app, not affiliated with or endorsed by UIL.

## Run

Requires Node.js 20 or newer. No npm dependencies are needed to serve the app:

```sh
npm start
```

Open <http://127.0.0.1:4173>. Use `PORT=8080 npm start` to change the port. Serve `dist/` with any HTTP static server; do not open the HTML directly from disk because ES Modules and the JSON snapshot require HTTP.

## Refresh the public data snapshot

Data updates are explicit. The website does not scrape UIL on visitor page loads and no recurring background task is configured.

Requires Python 3.10+ and the importer-only dependency:

```sh
python3 -m pip install -r requirements-data.txt
npm run data:refresh
npm test
npm run check
```

The importer downloads two official source documents and writes `dist/data/official.json` only after validating the complete result. Downloads are cached in ignored `.cache/official/`. To reprocess cached inputs:

```sh
python3 scripts/import_official.py --offline
```

Each source records its URL, retrieval time, and SHA-256 fingerprint. Each school references its source and PDF page; each result references the UIL archive and available official box-score links. Offline rebuilds preserve source file retrieval times. Parsing errors, unmatched schools, incomplete finals, duplicate IDs, or invalid districts fail before the last good public snapshot is replaced.

PDF extraction groups words by row and column coordinates to preserve empty district cells. It does not infer district positions from the count of numbers in a text line. Archive names use explicit aliases only (currently `DeSoto` → `De Soto`), never fuzzy school matching.

Changes in official school counts will intentionally require review of the snapshot integrity tests before publishing.

## Features

- Six views: Overview, Rankings, Scores, Schools, News & sources, My schools.
- Search, class/district/football-format filters, and a paginated school directory.
- All schools tab includes non-athletic entries in the UIL listing.
- Source-linked school and championship result detail dialogs.
- Historical season selector; unsupported seasons and live feeds show clear empty states.
- Rankings explain that power ratings are unavailable; documented state champions are shown as historical outcomes, not ordered power ratings.
- Separate browser-local saved-school and demo-favorite keys; no accounts or cross-device sync.
- CSV directory export with source URLs and retrieval timestamps; raw JSON snapshot download.
- English UI, responsive layout, keyboard focus styling, and America/Chicago retrieval timestamps.
- Original demo features retained behind `?mode=demo`, with clearly fictional teams, forecasts, articles, and a simulated clock.
- The user-provided Google Analytics measurement ID `G-J84H30J4ZT` remains in `dist/index.html`.

## Checks

```sh
npm test
npm run check
```

Tests cover fixtures, imported identities, district blanks, official counts, known scores, historical/current class separation, compound filters, pagination, storage failures, source URL validation, missing ratings, and protection against passing real results through the demo simulator. No test framework dependency is needed.

## Structure

```text
dist/
  index.html               App shell and Google tag
  styles.css               Shared responsive styles
  data/official.json        Validated, source-attributed public snapshot
  js/
    app.js                 Mode-aware loader; real data by default
    official-app.js         Public-record views and interactions
    official-domain.js      Snapshot validation, filters, CSV and storage
    demo-app.js             Explicitly selected fictional demo
    data.js                 Fictional fixtures only
    domain.js               Demo ranking, forecasts and clock (guarded)
    icons.js                Shared icon rendering
scripts/import_official.py  Public-source importer
requirements-data.txt       Importer-only Python dependency
server.mjs                 Local static HTTP server
tests/                     Node built-in tests
```

## Deployment

Push to `main` to run the included GitHub Actions workflow and deploy `dist/` to GitHub Pages. Snapshots are committed with code and served from the same origin; relative paths support repository subdirectories. The public app fails visibly if its snapshot is unavailable instead of silently substituting demo records.

No API credentials are needed for this release. Future real-time providers belong behind a server-side adapter; do not place provider secrets or restricted licensed datasets in this public repository.
