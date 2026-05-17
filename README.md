# Scottish Hill Bagger

A personal tracker for Scottish hillwalkers. Log your Munros, Corbetts, Fionas, and bothies. Check mountain weather forecasts. Learn Gaelic hill names.

**[scottishhillbagger.github.io](https://scottishhillbagger.github.io)**

---

## Features

**Hills**
- 282 Munros, 222 Corbetts, 219 Fionas
- Log the date you bagged each peak, add notes
- Filter by region, bagged/unbagged status, height
- Gaelic name meanings and pronunciation inline in each peak's detail

**Bothies**
- 86 MBA-maintained bothies with locations
- Mark visits, add notes, filter by region

**Map**
- Esri topo basemap
- All peaks and bothies plotted with type-coded pins
- Tap any pin to open its detail

**Weather**
- Daily mountain forecasts for 9 Scottish regions via MWIS
- Go / Marginal / Avoid rating per day
- Detail: wind speed and direction, temperature on tops, freezing level, summit visibility, snow and gust indicators
- Forecast auto-updated twice daily via GitHub Actions

**Scottish Hill Gaelic** (`/gaelic.html`)
- Companion guide for reading and pronouncing Gaelic hill names
- 36 well-known hills broken into their Gaelic roots
- Four modes: Dissect, Sounds Trainer, Quiz, Glossary

---

## Data sources

| Source | Used for |
|--------|----------|
| [Scottish Mountaineering Club](https://www.smc.org.uk/) | Munro Tables |
| [Database of British & Irish Hills](https://www.hills-database.co.uk/) | Corbetts, Fionas |
| [WalkHighlands](https://www.walkhighlands.co.uk/) | Route guides |
| [Esri](https://www.esri.com/) | Map tiles (Powered by Esri) |
| [Mountain Bothies Association](https://www.mountainbothies.org.uk/) | Bothy list |
| [Mountain Weather Information Service](https://www.mwis.org.uk/) | Forecasts |

---

## How it works

A single static HTML file (`index.html`). No framework, no build step, no backend. All data is bundled inline. User data (bagged peaks, notes, visited bothies) is stored in `localStorage` — nothing leaves the device.

The weather forecast is the only dynamic piece. A GitHub Actions workflow runs twice daily, fetches the MWIS bulletins, sends them to the Claude API for structured parsing, and writes `forecast.json` to the repo. The app fetches that file on load.

```
index.html          Main app — all HTML, CSS, and JS in one file
gaelic.html         Scottish Hill Gaelic companion guide
gaelic.css          Styles for the Gaelic guide
app.jsx             Gaelic guide app root (React via Babel)
data.js             36 curated hills with Gaelic morphology data
dissector.jsx       Name dissector widget
pronunciation.jsx   Sounds trainer widget
quiz.jsx            Quiz widget
fieldguide.jsx      Gaelic roots glossary
silhouette.jsx      Hill silhouette SVG generator
gaelic.json         Per-peak Gaelic meanings + pronunciations (AI-generated)
forecast.json       Current MWIS mountain forecast (auto-updated)
build-forecast.mjs  GitHub Actions forecast builder
build-gaelic.mjs    One-time script to generate gaelic.json
clean-gaelic.mjs    Normalises gaelic.json after generation
.github/workflows/  Forecast update schedule
```

---

## Running locally

No build step needed. Open `index.html` directly in a browser, or serve with any static server:

```bash
npx serve .
# or
python3 -m http.server
```

The Gaelic guide (`gaelic.html`) loads `.jsx` files via Babel standalone — these require a server (not `file://`). The main app has no such restriction.

---

## Regenerating Gaelic data

The `gaelic.json` file contains AI-generated meanings and pronunciations for all 723 peaks. To regenerate or extend it:

```bash
ANTHROPIC_API_KEY=sk-ant-... node build-gaelic.mjs
node clean-gaelic.mjs
```

The build script processes in batches of 40, saves progress after each batch, and resumes safely if interrupted.

---

## Weather forecast workflow

The forecast runs on a schedule via `.github/workflows/forecast-workflow.yml`. To trigger it manually: **Actions → Update Forecast → Run workflow**.

The `ANTHROPIC_API_KEY` secret must be set in the repo's Settings → Secrets for the workflow to succeed.

---

## Privacy

All user data stays on the device in `localStorage`. No accounts, no tracking, no analytics. The app makes one external request on load — `forecast.json` from this repo — and map tile requests to Esri's servers (authenticated with a scoped API key).

---

## Credits

Built for personal use. Logo: contour mark with terracotta summit dot. Typography: [Geist](https://vercel.com/font) and Geist Mono. Map powered by [Esri](https://www.esri.com/).
