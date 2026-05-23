# 🥊 UFC Fight Predictor

An AI-powered UFC fight prediction engine built as a React single-page app. Predicts upcoming scheduled fights and lets you build custom fantasy matchups using a multi-factor statistical model.

![UFC Fight Predictor](https://img.shields.io/badge/Built%20with-React-61DAFB?style=flat&logo=react)
![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF?style=flat&logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🚀 Quick Start

```bash
git clone https://github.com/paifuu/ufc-fight-predictor.git
cd ufc-fight-predictor
npm install
npm run dev
```

App runs at `http://localhost:5173`. **No API key required** for core features.

### Optional: Auto-fetch results from Tapology

The Accuracy tab has a button that uses the Claude API to automatically look up real fight results. To enable it:

```bash
cp .env.example .env
# Add your Anthropic API key to .env
VITE_ANTHROPIC_API_KEY=your_key_here
```

Get a key at [console.anthropic.com](https://console.anthropic.com). Without it, you can still enter results manually.

---

## ✨ Features

### 📅 Scheduled Fights
Pre-loaded with real upcoming UFC events and full fight cards including **UFC Freedom 250 (White House)** and **UFC 329: McGregor vs Holloway 2**.

### ⚗️ Fantasy Matchups
Build any fighter vs fighter matchup from the 25+ fighter database, or create fully custom fighters with sliders. Generates a shareable PNG card with real fighter photos from Wikipedia.

### 🎯 Accuracy Tracker
Predictions auto-saved as you analyze fights. Enter actual results manually or auto-fetch from Tapology using Claude AI.

### ⚡ Animated Predictions
Spring-physics probability bar, staged reveal: winner → advanced factors → category breakdown.

---

## 🧠 Prediction Engine

Scores fights across 8 weighted categories:

| Factor | Weight | Notes |
|---|---|---|
| Striking | 26% | SLpM × accuracy, strike defense |
| Grappling | 24% | TD effectiveness, defense, submissions, wrestler resilience |
| Finishing Power | 16% | Finish rate × output volume |
| Cardio / Pace | 15% | Age penalty curve + damage absorbed |
| Style Matchup | 12% | Per-fighter style matrix, amplified 1.7× |
| Experience | 7% | Light tiebreaker only — recent form matters far more |

**Plus direct modifiers:** Ring Rust, Recent Form (0–10), Size/Reach (nonlinear), Past Matchups, Speed vs Hands handling.

Win probability outputs 1–99% with logistic compression for extreme mismatches.

---

## 🗂️ Project Structure

```
ufc-fight-predictor/
├── src/
│   ├── App.jsx       # Full app — fighter DB, scoring engine, all UI
│   └── main.jsx      # React entry point
├── docs/
│   └── PRD.md        # Product Requirements Document
├── index.html
├── package.json
├── vite.config.js
├── .env.example
└── README.md
```

---

## 🏗️ Tech Stack

- **React 18** + **Vite 5**
- **Canvas API** — shareable PNG generation (no external libs)
- **Wikipedia API** — CORS-open fighter photo fetching
- **Anthropic Claude API** — optional, for Tapology result auto-fetch

---

## 📄 Docs

See [`docs/PRD.md`](docs/PRD.md) for full product requirements, scoring engine formulas, and fighter data schema.

---

## 📄 License

MIT
