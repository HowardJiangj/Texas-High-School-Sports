# Texas High School Sports · Texas Prep Sports

A working Texas high school sports demo with an English-only interface for a U.S. audience. Responsive layouts for desktop and mobile. Built with native HTML, CSS, JavaScript ES Modules, and a dependency-free Node.js static server.

**All schools, teams, scores, rankings, articles, and predictions are fictional demo fixtures.** No real player, injury, or licensed sports data is included. October basketball and soccer schedules are for demonstration only. Language selection is deferred to a future release.

## Run locally

Requires Node.js 20 or newer. From this directory:

```sh
npm start
```

Open <http://127.0.0.1:4173>. To choose another port:

```sh
PORT=8080 npm start
```

Alternatively, serve `dist/` with any static HTTP server. Do not open `index.html` directly from the filesystem; ES Modules require HTTP. Google Fonts are optional; system fonts are used if the external font request fails.

## Features

- Six views: Overview, Rankings, Scores, Teams, News, and My teams.
- Twelve fictional schools, 48 varsity teams, four sports, and 24 demo games.
- Boys football, boys basketball, girls volleyball, and girls soccer. Unsupported gender/sport combinations display an empty state.
- Filters for sport, classification, region, gender, school name, and city. Filtered teams retain their statewide rank.
- Simulated scores advance every eight seconds; pause, step forward, or reset them. Updates pause while the page is in the background.
- Volleyball displays set scores and advances its demo rally label only. Other sports advance using their scoring units. There is no real game clock or automatic final whistle.
- Team profiles, eight-week sample rating charts, recent form, game details, and fictional article details.
- Matchup comparison with illustrative score predictions and validation for duplicate teams.
- Followed teams saved in localStorage. If storage is blocked, follows last for the current page session only.
- Filtered rankings exported as CSV with a UTF-8 BOM and escaped formula prefixes.
- U.S. date formats, 12-hour times, and Central Time (CT) labels. The demo schedule is fixed; the last-update clock uses America/Chicago.
- Mobile bottom navigation, native dialogs, keyboard focus styles, and reduced-motion support.

Followed teams are browser-local, without accounts or cross-device sync. Reloading resets simulated scores but keeps saved teams.

## Checks

```sh
npm test
npm run check
```

Built-in Node tests cover fixture references, sport-specific ranking, combined filters, valid predictions, preservation of final/upcoming results, storage failures, and CSV escaping. No external test framework is required.

## Source layout

```text
lonestar/
├── dist/
│   ├── index.html         # App shell
│   ├── styles.css         # Responsive styles
│   ├── icon.svg           # Original brand mark
│   └── js/
│       ├── app.js         # Views, interactions, routing, demo clock
│       ├── data.js        # Replaceable demo fixtures
│       └── domain.js      # Ranking, filters, predictions, storage helpers
├── tests/domain.test.js
├── server.mjs             # Dependency-free local HTTP server
└── package.json
```

## Demo rules and limitations

Rankings sort preset ratings in descending order, breaking ties by wins and then school name. Historical changes, records, and rating charts are independent display samples, not a consistent historical dataset.

Home win probability: `round(100 / (1 + exp(-(home rating - away rating + 1.5) / 11)))`. Away win probability is its complement. Predicted scores use sport-specific baselines and the rating difference. Volleyball returns final sets for a best-of-five match. Soccer does not model draws.

These are illustrative formulas, not trained or backtested models. They are not real game predictions. Injuries and availability are always marked “Unknown.”

## Connecting real data later

1. Add a provider module for authorized school, schedule, and score APIs. Map supplier IDs to stable school, team, and game IDs.
2. Add a server-side database and update jobs with sources and timestamps. Keep secrets in server-side environment variables, never browser code.
3. Replace preset ratings with sport-specific models based on real results; preserve snapshots and backtest prediction errors.
4. Add sourced news links and summaries, confirmed availability reports, then accounts, notifications, and more sports.

## GitHub Pages

This folder can be uploaded as a standalone repository. A GitHub Actions workflow is included in `.github/workflows/pages.yml`. In Settings → Pages, select GitHub Actions. Push to `main` to run checks and publish `dist/`.

The optional `.openai/hosting.json` records this demo’s private Sites identity and contains no secrets. Remove `.openai/` when copying the project to a new site. Do not commit API keys, tokens, or restricted licensed datasets.
