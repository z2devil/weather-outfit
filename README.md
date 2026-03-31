# weather-outfit

Weather data fetcher + AI outfit recommendation card renderer.

Fetches weather from [Open-Meteo](https://open-meteo.com/) and renders a styled PNG card using [Satori](https://github.com/vercel/satori). Designed to be called by an AI agent that handles the outfit reasoning and message delivery.

## How it works

```
AI agent (reasoning brain)
  ├─ node scripts/fetch-weather.mjs   # fetch weather data → weather.json
  ├─ AI reasons → writes card-data.json
  ├─ node scripts/render-satori.mjs   # render PNG → stdout path
  └─ agent sends card via messaging tool
```

The scripts handle **data and rendering only** — no AI calls, no messaging, no hardcoded user info.

## Scripts

### fetch-weather.mjs

Fetches weather data from Open-Meteo and writes `preview/output/weather.json`.

```bash
node scripts/fetch-weather.mjs \
  --mode morning \          # morning (current temp) | night (tomorrow forecast)
  --lat 35.68 \             # latitude
  --lon 139.69 \            # longitude
  --location "Tokyo"        # display name
```

### render-satori.mjs

Reads `card-data.json`, renders a 2x PNG card, prints the output path to stdout.

```bash
node scripts/render-satori.mjs \
  --card preview/output/card-data.json \
  --out  preview/output/card.png        # optional, defaults to card-{mode}.png
```

On Windows, use `--font-dir C:/Windows/Fonts` (default). On other systems, provide a directory containing `PingFangSC-Regular.ttf`, `PingFangSC-Medium.ttf`, and `PingFangSC-Semibold.ttf`.

## card-data.json schema

The AI agent writes this file before calling `render-satori.mjs`:

```json
{
  "mode": "morning",
  "location": "Tokyo",
  "date": "2026-04-01 Wed",
  "weatherCode": 61,
  "temp": 17,
  "desc": "Light rain",
  "max": 17, "min": 13,
  "hasRain": true, "hasSnow": false,
  "windMax": 15,
  "humidity": 87,
  "windSpeed": 3,
  "windDir": "NE",
  "uvLabel": "Low",
  "rainProb": 90,
  "shoes": "Waterproof sneakers",
  "summary": null,
  "plans": [
    { "label": "A", "inner": { "items": ["Hoodie"] }, "coat": "Light jacket", "note": "Big temp swing today" },
    { "label": "B", "inner": { "items": ["Long-sleeve shirt"] }, "coat": "No coat", "note": "Mostly indoors" }
  ]
}
```

## Install

```bash
npm install
```

**Requirements:**
- Node.js 18+
- PingFang SC font (included on macOS; on Windows at `C:/Windows/Fonts/`)
- Open-Meteo API — free, no key required

## Card preview

Deep blue-gray gradient, weather metrics grid, vertical outfit plan cards.

## File structure

```
weather-outfit/
├── docs/design.md             # design notes
├── preview/
│   ├── card.html              # HTML prototype (reference only)
│   └── output/                # generated files, gitignored
├── scripts/
│   ├── fetch-weather.mjs      # weather data fetcher
│   └── render-satori.mjs      # card renderer
├── .gitignore
└── README.md
```
