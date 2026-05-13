# Incentive Cap Model

An interactive visualization of why AI companies systematically underinvest in safety relative to the societal optimum.

A company's liability is capped at its market value. This means its financial incentive to prevent catastrophic harm is smaller than society's — and the model quantifies that gap. Three spending scenarios let you explore how the gap changes under different regulatory regimes.

**[Download the latest release](https://github.com/norabble/incentive-caps/releases/latest)** — a single self-contained HTML file, no server required.

## Scenarios

| # | Description |
|---|---|
| 1 | All-organic spending — no regulation, company spends at its own optimum |
| 2 | Organic up to the company optimum, then supplemented by regulation |
| 3 | All spending mediated by regulation |

The chart shows company and societal total cost curves. Vertical markers show where each party's optimum falls; the gap between them is the underinvestment.

## Parameters

| Parameter | What it controls |
|---|---|
| Company market cap | Sets the liability cap (modeled as 50% of market cap) |
| Societal damage | Total damage if the catastrophic event occurs |
| Baseline probability | Probability of harm at zero safety spending |
| Decay function | Shape of how spending reduces probability (logarithmic, linear, power law, sigmoid) |
| Decay rate | How quickly additional spending reduces risk |
| Regulatory penalty | Efficiency loss when spending is regulation-driven (0% = fully efficient, 100% = useless) |

## Development

```bash
npm install
npm run dev          # dev server at http://localhost:5173
npm run build:single # build self-contained HTML to dist/index.html
npm run lint
```

## Publishing a release

```bash
npm run publish:release          # bumps patch version
npm run publish:release -- minor # bumps minor version
npm run publish:release -- major # bumps major version
```

This bumps the version in `package.json`, commits, tags, and pushes. GitHub Actions then builds the single-file HTML and attaches it to a GitHub Release automatically. Requires a clean working tree.
