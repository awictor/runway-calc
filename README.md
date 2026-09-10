# Runway 🟣

**SaaS metrics & cash-runway calculator.** Type your numbers, see your unit economics and how long your cash lasts — instantly. Runs 100% in the browser: no signup, no backend, works offline.

![version](https://img.shields.io/badge/version-0.13.0-4F46E5) ![status](https://img.shields.io/badge/status-live-4F46E5) [![CI](https://github.com/awictor/runway-calc/actions/workflows/ci.yml/badge.svg)](https://github.com/awictor/runway-calc/actions/workflows/ci.yml)

## Why

Founders juggle MRR, churn, CAC, and burn in scattered spreadsheets. Runway puts the numbers that decide whether a SaaS lives or dies on one screen — and tells you plainly if your unit economics work.

## Features

- ✅ **ARR, customers, avg lifetime** from MRR and ARPA
- ✅ **LTV** (gross-margin) and **LTV : CAC** with the 3× rule-of-thumb check
- ✅ **CAC payback** in months
- ✅ **Net revenue retention** and **net MRR growth**
- ✅ **Rule of 40** and **burn multiple** — the two efficiency benchmarks investors ask about
- ✅ **SaaS Quick Ratio** and **months to cash-flow breakeven**
- ✅ **Magic number** — net new ARR per dollar of sales & marketing
- ✅ **Cash runway** in months (∞ when cash-flow positive)
- ✅ **12-month MRR projection** chart at your net growth rate
- ✅ **Scenario compare** — worst / base / best side-by-side from an adjustable growth spread
- ✅ **Cohort retention curve** — revenue retained over 24 months + your revenue half-life
- ✅ **Glossary tooltips** — hover any metric for a plain-English definition
- ✅ **ARR milestones** — time to $1M / $10M / $100M ARR at your current growth
- ✅ Plain-English **verdicts** on LTV:CAC, payback, and runway health
- ✅ **Copy summary** — one click puts a clean metrics snapshot on your clipboard for board/investor updates
- ✅ **Shareable link** — copy a link that reopens the exact numbers (encoded in the URL hash, nothing sent to a server)
- ✅ Dark mode, inputs remembered locally, zero dependencies — one `index.html`

## Run

Open `index.html` in any browser, or host it free on GitHub Pages / Netlify / Cloudflare Pages.

## Test

```
node tests/selftest.mjs
```

The pure metric functions are covered by a headless suite that runs the app's real code; CI runs it on every push.

## License

MIT © Alex Wictor
