# Sand → Silicon

**An immersive, interactive journey through semiconductor manufacturing — from a grain of sand to a tested, packaged chip.**

Live site: https://jambesh.github.io/sand-to-silicon/

```
NOTE: The site is a fully static build — enable GitHub Pages on this repo
(Settings > Pages > Deploy from branch > main / root) and it serves
directly. No build step, no dependencies.
```

## The journey at a glance

```
 quartz sand ──► arc furnace ──► polysilicon ──► CZ crystal ──► wafers
   (SiO2)         (98% Si)        (9N pure)       (ingot)         │
                                                                   ▼
                                          ┌──────────  the fab  ──────────┐
                                          │  litho ► etch ► dope ► metal  │
                                          │        (repeat ~100x)         │
                                          └───────────────┬───────────────┘
                                                          ▼
 packaged chip ◄── final test ◄── dicing ◄── yield ◄── wafer probe
    (binned)       (burn-in)     (pick good)  (models)   (ATE + needles)
```

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
| 11 | Yield Engineering | Interactive Yield Lab — live wafer map, Poisson & Murphy models, cost per good die |
| 12 | Dicing & Packaging | Backgrind, dicing, wire bond vs flip-chip, 2.5D/3D |
| 13 | Final Test & Binning | ATE, burn-in, speed binning |

Plus a quiz, a fab glossary, and a roadmap.

## Expansion modules

| Module | Highlights |
|--------|-----------|
| [Power Electronics](power-electronics.html) | Analog (linear) vs digital (switching) power, device toolbox (diode → MOSFET → IGBT → SiC/GaN) with an interactive power-frequency map, linear-vs-switching heat calculator, buck-converter playground with live PWM oscilloscope, and a virtual breadboard lab (PWM LED dimmer + bridge rectifier with real formulas) |
| [AI × Semiconductors](ai-semiconductors.html) | The sense → learn → predict → act loop; AI for power electronics (predictive maintenance, RL control, battery management) with a live converter health-monitor demo (streaming anomaly detection, tunable sigma threshold); wafer-map pattern classifier (ring/scratch/center/random → root cause); test-limits explorer (overkill vs escapes, spec-box vs ML boundary) |

## Features

- Light / dark mode — remembers your choice, respects system preference
- Animated SVG diagrams for every stage (pure CSS/SVG, no libraries)
- Interactive Yield Lab: die size / defect density / wafer cost sliders drive dies-per-wafer, Murphy & Poisson yield, and a simulated wafer map

  ```
  Poisson:  Y = e^(-A*D0)
  Murphy:   Y = ((1 - e^(-A*D0)) / (A*D0))^2

  A  = die area (cm^2)
  D0 = defect density (defects/cm^2)
  ```

- Click-through photolithography simulator (coat → expose → develop → etch → strip)
- World silicon-production map: top-10 producing countries as proportional bubbles
- Self-check quiz with explanations
- Fully responsive; honors `prefers-reduced-motion`
- Zero dependencies, zero build step — plain HTML/CSS/JS, ideal for GitHub Pages

## Run locally

```bash
# any static server works, e.g.:
python3 -m http.server 8080
# then open http://localhost:8080
```

## Project structure

```
.
├── index.html               # the 13-stage chip journey + quiz + glossary
├── power-electronics.html   # Power Electronics module
├── ai-semiconductors.html   # AI x Semiconductors module
└── assets/
    ├── css/style.css        # theming via CSS variables (dark default / light)
    └── js/
        ├── main.js          # theme, scroll effects, yield lab, quiz, map modal
        ├── power.js         # device map, buck playground, breadboard lab
        └── ai.js            # anomaly monitor, wafer-map classifier, test limits
```

## Roadmap

- Power Electronics — shipped
- AI × Semiconductors — shipped
- Device Physics deep-dives — interactive band diagrams, FinFET → GAA (planned)

Contributions and corrections welcome — open an issue or PR.

## License

MIT — free to use for learning and teaching.
