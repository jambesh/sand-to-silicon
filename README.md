# Sand → Silicon 🏖️→💻

**An immersive, interactive journey through semiconductor manufacturing — from a grain of sand to a tested, packaged chip.**

🌐 **Live site:** enable GitHub Pages on this repo (Settings → Pages → Deploy from branch → `main` / root) and it serves directly — no build step needed.

## What's inside

13 modular stages covering the complete chipmaking pipeline:

| # | Stage | Highlights |
|---|-------|-----------|
| 01 | From Sand to Silicon | Quartz + carbon → arc furnace → MG-Si (98%) |
| 02 | Ultra-Purification | Siemens process, trichlorosilane distillation, 9N purity |
| 03 | Growing the Crystal | Czochralski pulling, animated ingot growth |
| 04 | Wafer Shaping | Diamond wire saw, lapping, CMP mirror polish |
| 05 | Chip Design & Masks | RTL → GDSII → photomasks, tape-out |
| 06 | Photolithography | Interactive 5-step litho walkthrough, DUV/EUV |
| 07 | Etch & Deposition | Plasma etch animation; oxidation, CVD, PVD, ALD |
| 08 | Doping & Implantation | Animated ion implanter, N/P junctions |
| 09 | Interconnects (BEOL) | Damascene copper, the metal-stack skyscraper |
| 10 | Wafer Test & Probing | Probe cards, WAT/PCM, wafer sort, bin maps |
| 11 | Yield Engineering | **Interactive Yield Lab** — live wafer map, Poisson & Murphy models, cost per good die |
| 12 | Dicing & Packaging | Backgrind, dicing, wire bond vs flip-chip, 2.5D/3D |
| 13 | Final Test & Binning | ATE, burn-in, speed binning |

Plus a **quiz**, a **fab glossary**, and a roadmap.

## Expansion modules

| Module | Highlights |
|--------|-----------|
| ⚡ [Power Electronics](power-electronics.html) | Analog (linear) vs digital (switching) power, device toolbox (diode → MOSFET → IGBT → SiC/GaN) with an interactive power-frequency map, **linear-vs-switching heat calculator**, **buck-converter playground** with live PWM oscilloscope, and a **virtual breadboard lab** (PWM LED dimmer + bridge rectifier with real formulas) |
| 🤖 [AI × Semiconductors](ai-semiconductors.html) | The sense→learn→predict→act loop; AI for power electronics (predictive maintenance, RL control, battery management) with a **live converter health-monitor demo** (streaming anomaly detection, tunable σ threshold); **wafer-map pattern classifier** (ring/scratch/center/random → root cause); **test-limits explorer** (overkill vs escapes, spec-box vs ML boundary) |

## Features

- 🌗 Light / dark mode (remembers your choice, respects system preference)
- 🎞️ Animated SVG diagrams for every stage (pure CSS/SVG, no libraries)
- 🧪 Interactive Yield Lab: die size / defect density / wafer cost sliders → dies-per-wafer, Murphy & Poisson yield, simulated wafer map
- 🔦 Click-through photolithography simulator (coat → expose → develop → etch → strip)
- 🧠 Self-check quiz with explanations
- 📱 Fully responsive, respects `prefers-reduced-motion`
- ⚡ Zero dependencies, zero build step — plain HTML/CSS/JS, perfect for GitHub Pages

## Run locally

```bash
# any static server works, e.g.:
python3 -m http.server 8080
# then open http://localhost:8080
```

## Roadmap

- ⚡ **Power Electronics** — ✅ shipped
- 🤖 **AI × Semiconductors** — ✅ shipped
- 🧲 **Device Physics deep-dives** — interactive band diagrams, FinFET → GAA (planned)

Contributions and corrections welcome — open an issue or PR.

## License

MIT — free to use for learning and teaching.
