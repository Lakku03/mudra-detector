# Mudra Detector

Real-time Bharatanatyam hand mudra detection in the browser, powered by MediaPipe Hands.

This app opens your webcam, tracks hand landmarks live, and tries to identify classical mudras using finger geometry. When it detects one, you get a frosted glass card overlay with the mudra name (with diacritics), meaning, and emoji.

## What it detects

- Patāka
- Tripatāka
- Ardhapatāka
- Tarjanī
- Chandrakalā
- Alāpadma
- Muṣṭi
- Kapittha
- Mayūra

## Built with

- Vanilla `HTML`
- Vanilla `CSS`
- Vanilla `JavaScript`
- [MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)

## Run it

Since this uses webcam + JS modules, run it from a local server (recommended), not just `file://`.

Quick option with Python:

```bash
python3 -m http.server 8080
```

Then open:

`http://localhost:8080`

## Notes

- Detection is heuristic-based (landmark geometry), so lighting, camera angle, and hand distance matter.
- Some mudras can look similar in motion; holding the pose steady gives better results.

---

Made for vibey classical-dance-meets-computer-vision demos.
