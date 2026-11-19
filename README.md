# gta6-cover-art-01-entry

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Mastomy2/gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Mastomy2/gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Sunset** — a GTA-style cover art maker for make.fun's "Make GTA 6 Cover Art" bounty. Turn your own photos and a caption into a multi-panel poster cover with a Vice City sunset / neon grade, exported as a PNG to share. Everything runs offline in the browser; photos are read on your machine and never uploaded.

## What it does

- **Any photo:** load up to three photos from your machine (or the two bundled samples), crop and position each one by dragging it in the preview or with the zoom / pan sliders.
- **Multi-panel poster:** three original layouts — Vice Grid (hero + three panels), Hero Split, Triptych — each panel shows any of your photos, so one photo can fill several panels or each panel can show a different one.
- **Caption:** editable kicker, bold gradient title (Anton, OFL) and subtitle, with a sunset grade and neon glow you can tune.
- **Fast and easy:** pick a photo, pick a layout, export — PNG in 1080 × 1080, 1080 × 1350 or 1920 × 1080.
- **Original:** no Rockstar logo, artwork or font. All lettering uses OFL fonts shipped under `app/fonts/` (Anton, Archivo Black, Inter); the palm and skyline silhouettes are drawn with canvas paths.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

Or open `app/index.html` from any static file server. No build step, no network request.

## Layout

- `app/` — the static web app (`index.html`, `style.css`, `src/cover.js` draws the poster, `src/main.js` wires the editor, `src/shots.js` sets up screenshot scenes; `fonts/` OFL fonts, `samples/` two free-to-use sample photos)
- `screenshots/` — 4 screenshots taken from the app itself (cover first)
- `main.ts` — the entrypoint: copies `app/` + `screenshots/` to `/output` and writes `dossier.json`
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged

<sub>Entered on [make.fun](https://make.fun/?ref=94ztz8n6&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
