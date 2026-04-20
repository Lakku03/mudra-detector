# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

There is no build step. Serve from a local HTTP server (required for webcam access and ES modules):

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Architecture

This is a no-bundler, no-framework vanilla web app. Three JS files, one HTML, one CSS.

**`mudras.js`** — all detection logic and mudra metadata. Exports two things:
- `MUDRA_DETAILS` — object keyed by mudra name, each entry has `meaning` and `emoji`
- `detectMudra(landmarks)` — takes a MediaPipe hand landmarks array (21 points), runs all per-mudra heuristic functions, returns the best match above a 0.75 score threshold (or `null`)

Each mudra has its own `detect*` function using geometric helpers (`isExtended`, `isFolded`, `thumbOpen`, `thumbClosed`, `fingerSpread`, `fingertipCluster`, `distance`, `palmScale`). Scores are fixed constants (e.g. 0.82), not continuous values — they express priority/confidence, not probability.

**`app.js`** — wires MediaPipe Hands to the webcam, calls `detectMudra` on each frame, and updates the UI. The canvas mirrors the video feed (`scaleX(-1)`) so landmark x-coordinates are also mirrored when positioning the `hand-tag` overlay.

**`index.html`** — loads MediaPipe libs from CDN (not npm), then `app.js` as an ES module.

## Adding or modifying a mudra

1. Add/update the entry in `MUDRA_DETAILS` in `mudras.js` (name, meaning, emoji).
2. Write a `detect*` function using the existing geometry helpers.
3. Register it in the `candidates` array inside `detectMudra`, with `name` matching the `MUDRA_DETAILS` key exactly (including diacritics).

The name string is the single source of truth that links detection → metadata → UI display. Renaming a mudra requires updating the `MUDRA_DETAILS` key and the `candidates` entry together; the `detect*` function name is internal and does not need to match.
