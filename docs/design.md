# Design Notes

## Core principle

**Scripts are tools only.** They handle data fetching and rendering — nothing else.

The calling agent is responsible for:
- Providing location parameters
- Reasoning about outfit recommendations (using its own context about the user)
- Writing `card-data.json`
- Sending the rendered card via whatever messaging channel it uses

This keeps the skill stateless, user-agnostic, and reusable.

---

## Data flow

```
fetch-weather.mjs
  --lat / --lon / --location / --mode
        │
        ▼
  weather.json   ←── caller reads this
        │
  (caller reasons, writes card-data.json)
        │
        ▼
render-satori.mjs
  --card card-data.json
        │
        ▼
  card-{mode}.png  ←── path printed to stdout
```

---

## Weather data

**Source:** [Open-Meteo](https://open-meteo.com/) — free, no API key, no proxy needed.

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=<lat>
  &longitude=<lon>
  &current=temperature_2m,weathercode,windspeed_10m,winddirection_10m,relativehumidity_2m,uv_index
  &daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,windspeed_10m_max
  &timezone=auto
  &forecast_days=2
```

Key fields used:
- `current.temperature_2m` — current temp
- `daily.temperature_2m_max/min` — daily high/low
- `daily.weathercode` — [WMO weather code](https://open-meteo.com/en/docs#weathervariables)
- `daily.precipitation_probability_max` — rain probability
- `daily.windspeed_10m_max` — max wind speed

`--mode morning` exposes current temperature; `--mode night` exposes tomorrow's forecast.

---

## Outfit recommendation rules (for caller reference)

These are not enforced in the scripts. They are suggested constraints for the calling agent's reasoning prompt:

1. **Plan count:** 2 fixed (A = warmer, B = lighter). Add a 3rd only for high wind (>30 km/h) or snow.
2. **Base layer thickness:** driven by daily high (how warm it gets)
3. **Outer layer thickness:** driven by temperature swing (high − low)
4. **Footwear:** rain → waterproof, snow → grippy, cold → thick-soled, otherwise → sneakers
5. **Note per plan:** one short situational hint

---

## Card rendering

**Stack:** [Satori](https://github.com/vercel/satori) → SVG + [@resvg/resvg-js](https://github.com/nicolo-ribaudo/resvg-js) → PNG

- Pure Node.js, no browser dependency
- 2× zoom via `fitTo: { mode: "zoom", value: 2 }`
- Font: PingFang SC (Regular / Medium / SemiBold) — change `--font-dir` for other systems

**Card sections:**
1. Header — location + date
2. Main weather — large temperature + weather icon (Lucide-style inline SVG)
3. Description row — condition label + high/low range
4. Metrics grid — humidity / wind / UV / rain probability
5. Outfit plans — Plan A / B vertical cards with base layer, coat, footwear, note
6. Footer

**Theme:** Deep blue-gray gradient. Colors shift slightly by weather code (clear → stormy).

---

## Files

| File | Role |
|------|------|
| `scripts/fetch-weather.mjs` | Fetches Open-Meteo data, writes `preview/output/weather.json` |
| `scripts/render-satori.mjs` | Reads `card-data.json`, renders PNG, prints path to stdout |
| `preview/card.html` | Static HTML prototype — visual reference only, not used at runtime |
| `preview/output/` | Runtime output directory — gitignored |
