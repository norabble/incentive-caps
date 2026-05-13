# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An interactive React + Chart.js web app that visualizes an economic model of why AI companies underinvest in safety relative to societal optimum. A company's liability is capped at its market value, so its incentive to prevent catastrophic harm is smaller than society's. The model quantifies this gap across three spending scenarios and lets users vary key parameters.

## Commands

```bash
npm run dev      # start Vite dev server (http://localhost:5173)
npm run build    # production build
npm run preview  # preview production build
npm run lint     # ESLint
```

## Architecture

```
src/
  lib/model.js          # pure math — no React dependency
  components/
    ControlPanel.jsx    # all sliders and decay-fn/rate selectors
    IncentiveChart.jsx  # Chart.js dual-axis chart + custom annotation plugin
    MetricCards.jsx     # 3-column scenario summary table
  App.jsx               # state owner; derives model params and passes curves down
  index.css             # base reset
  App.css               # all styles
```

**Data flow:** `App.jsx` holds raw UI param state (e.g. `marketCapB`, `p0Log`, `regPenaltyPct`) and converts them into model params (e.g. `dCap` in $M, `p0` as a float) before calling `generateCurves()`. The result object `{ xs, companyCosts, societyCosts1/2/3, s1, s2, s3, xDisplayMax }` flows into both `IncentiveChart` and `MetricCards`.

## Model (`src/lib/model.js`)

### Probability decay
Four functions keyed in `DECAY_FN`: `logarithmic`, `linear`, `powerlaw`, `sigmoid`. All take `(xEff, p0, c)` where `xEff` is effective spending in $M, `c` controls the rate.

### Effective spending by scenario
- Scenario 1: `xEff = x`
- Scenario 2: organic up to company optimum (`xKink`), then `xCo + (x - xCo) * regEfficiency` above it — this is what creates the visible kink
- Scenario 3: `x * regEfficiency` throughout

### Optimization
Optima are found numerically via `findOptimum()` — binary search on finite-difference derivative `dTC/dx = 0`. This handles both the kink in scenario 2 and non-logarithmic decay functions cleanly. No closed-form solutions.

### Units
All internal calculations use **$M**. Conversion happens in `App.jsx` before calling the model:
- `dCap = marketCapB * 1000 * 0.5` ($B → $M, then 50% liability cap)
- `dTotal = dTotalT * 1e6` ($T → $M)

## Chart (`src/components/IncentiveChart.jsx`)

Uses Chart.js (not react-chartjs-2) directly via `useRef`. Key design decisions:
- **Dual y-axis**: left = company cost, right = societal cost. Both at real values (no ÷10 scaling).
- **Custom plugin** (`annotationPlugin`, registered globally) draws in `afterDraw`: vertical dashed lines at each optimum, a filled dot at the scenario 2 kink, and horizontal arrows between adjacent societal optima.
- Colors are hardcoded (Chart.js cannot resolve CSS variables).
- Chart is updated via `.update('none')` for fast redraws on slider changes; only created once per mount.

## Validated default outputs

With defaults (800B market cap, $5T damage, p0=1e-4, c=20, 50% reg penalty):

| Scenario | Company opt | Societal opt | Residual damage | Total soc. cost |
|---|---|---|---|---|
| 1 – all organic | $13.3M | $35.2M | $8.7M | $43.9M |
| 2 – organic + reg | $13.3M | $45.1M | $17.4M | $62.4M |
| 3 – all regulated | $14.5M | $58.4M | $17.4M | $75.8M |
