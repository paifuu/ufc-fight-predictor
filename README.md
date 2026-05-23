# 🥊 UFC Fight Predictor

An AI-powered UFC fight prediction engine built as a React single-page app. Predicts upcoming scheduled fights and lets you build custom fantasy matchups using a multi-factor statistical model.

![UFC Fight Predictor](https://img.shields.io/badge/Built%20with-React-61DAFB?style=flat&logo=react)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

### 📅 Scheduled Fights
- Pre-loaded with real upcoming UFC events and full fight cards
- UFC Freedom 250 (White House), UFC 329 McGregor vs Holloway 2, and more
- Full fighter profiles with stats, tendencies, strengths/weaknesses

### ⚗️ Fantasy Matchups
- Build any fighter vs fighter matchup from the database (20+ elite fighters)
- Load real fighters or create fully custom ones with sliders
- Shareable prediction card — generates a real PNG image with fighter photos fetched from Wikipedia

### 🎯 Accuracy Tracker
- All predictions saved automatically as you analyze fights
- Auto-fetch actual results from Tapology via Claude AI web search after events
- Track your prediction accuracy over time

### ⚡ Animated Predictions
- Animated win probability bar with spring physics
- Staged reveal: winner → bar → advanced factors → category breakdown

---

## 🧠 Prediction Engine

The model scores fights across **8 categories** using real UFC stats:

| Category | Weight | Description |
|---|---|---|
| Striking | 26% | SLpM × accuracy, strike defense |
| Grappling | 24% | TD effectiveness, TD defense, submission avg, wrestler resilience after failed TDs |
| Cardio / Pace | 15% | Age penalty curve, strikes absorbed |
| Finishing Power | 16% | Finish rate, output volume |
| Experience | 7% | Opponent quality, win streak (light tiebreaker only) |
| Style Matchup | 12% | Per-fighter style advantage matrix (amplified 1.7×) |

**Plus direct modifiers on top of core score:**

- **Ring Rust** — nonlinear penalty per years inactive (5yr = −22pts)
- **Recent Form** — 0–10 rating per fighter (2.2× per point gap)
- **Size / Reach** — nonlinear weight-class gap + reach differential
- **Past Matchups** — prior meeting history (psychological + tactical edge)
- **Wrestler Resilience** — how relentlessly a wrestler shoots after failed takedowns
- **Speed vs Hands Handling** — how well a fighter deals with fast, precise hands

Win probability uses a logistic squeeze at extremes, allowing outputs from 1% to 99% for genuine mismatches (e.g. Jones vs O'Malley fantasy).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A package manager (npm, yarn, or pnpm)

### Install & Run

```bash
git clone https://github.com/YOUR_USERNAME/ufc-predictor.git
cd ufc-predictor
npm install
npm run dev
```

App runs at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

---

## 🗂️ Project Structure

```
ufc-predictor/
├── src/
│   └── App.jsx          # Full app — fighter DB, scoring engine, all UI
├── docs/
│   └── PRD.md           # Product Requirements Document
├── public/
│   └── favicon.ico
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🏗️ Tech Stack

- **React 18** — UI framework
- **Vite** — build tool
- **Canvas API** — shareable PNG card generation
- **Wikipedia API** — fighter photo fetching (CORS-open)
- **Anthropic Claude API** — auto-fetch results from Tapology for accuracy tracking

---

## 📊 Fighter Database

Includes 25+ fighters with full stat profiles:

- Ilia Topuria, Justin Gaethje, Alex Pereira, Ciryl Gane
- Jon Jones, Islam Makhachev, Khabib Nurmagomedov
- Conor McGregor, Max Holloway, Charles Oliveira
- Sean O'Malley, Dricus Du Plessis, Bo Nickal
- And many more...

Each fighter has: record, age, reach, natural weight, fighting style, tendencies, strengths/weaknesses, style matchup matrix, opponent quality rating, recent form rating, ring rust (years inactive), wrestler resilience, and full UFC stats (SLpM, accuracy, TDs, submissions, finish rate).

---

## 🤝 Contributing

PRs welcome. To add a new fighter, add an entry to `FIGHTER_DB` in `src/App.jsx` following the existing schema. Style matchup keys must match the `style` field of other fighters exactly.

---

## 📄 License

MIT — free to use, modify, and distribute.
