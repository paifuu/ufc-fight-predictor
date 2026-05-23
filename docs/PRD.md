# UFC Fight Predictor — Product Requirements Document

**Version:** 1.0  
**Date:** May 2026  
**Status:** Live

---

## 1. Overview

### 1.1 Product Summary

UFC Fight Predictor is a web application that uses a multi-factor statistical model to predict the outcomes of UFC fights. It supports both scheduled upcoming fights (pre-loaded with real event data) and fully custom fantasy matchups between any two fighters. Predictions are accompanied by animated visual breakdowns, shareable image cards, and an accuracy tracking system that auto-fetches real results after events conclude.

### 1.2 Problem Statement

UFC fans and bettors lack a transparent, explainable prediction tool that goes beyond simple win/loss records or betting odds. Existing tools either:
- Black-box their methodology
- Ignore key factors like ring rust, style matchups, wrestler resilience, and recent form
- Overweight experience/resume at the expense of current form

### 1.3 Goals

- Provide fight predictions that are accurate, explainable, and visually engaging
- Allow users to explore fantasy matchups between any fighters
- Track prediction accuracy over time against real results
- Generate shareable social media cards for each prediction

---

## 2. Users

**Primary:** UFC fans who want data-driven fight predictions with clear explanations  
**Secondary:** Bettors using predictions as one input among many  
**Tertiary:** Content creators wanting shareable fight prediction graphics

---

## 3. Features

### 3.1 Scheduled Fights Tab

**Description:** Pre-loaded with real upcoming UFC events. Users select a fight from the sidebar and run a prediction.

**Requirements:**
- Display full fight card for each event (main card + undercard)
- Show fighter profiles: record, rank, age, reach, style, tendencies, key stats
- Animated prediction reveal on button press
- Save prediction to accuracy tracker automatically
- Context blurb for each fight explaining storyline

**Events included:**
- UFC Fight Night 277: Song vs. Figueiredo (May 30, 2026)
- UFC Fight Night 278: Muhammad vs. Bonfim (June 6, 2026)
- UFC Freedom 250 — The White House (June 14, 2026)
- UFC 329: McGregor vs. Holloway 2 (July 11, 2026)

---

### 3.2 Fantasy Matchups Tab

**Description:** Users build custom matchups between any fighters in the database or fully custom fighters.

**Requirements:**
- Fighter selector: load any fighter from the 25+ fighter database
- Full stat editor via sliders: SLpM, accuracy, defense, TDs, submissions, finish rate, win streak
- Attribute editor: age, reach, natural weight, opponent quality, wrestler resilience, recent form, ring rust
- Style selector dropdown (16 fighting styles)
- Live preview card updates when switching fighters
- Shareable PNG card generation with real Wikipedia fighter photos
- Fallback silhouette if no Wikipedia photo found

---

### 3.3 Accuracy Tracker Tab

**Description:** Tracks all predictions made during a session and measures accuracy against real results.

**Requirements:**
- Auto-log every prediction with fighter names, predicted winner, and win %
- Manual result entry buttons (Fighter 1 won / Fighter 2 won / Pending)
- Auto-fetch results button — uses Claude AI with web search to pull results from Tapology
- Accuracy score displayed as percentage with progress bar
- Color coding: green for correct, red for wrong predictions

---

### 3.4 Shareable Image Cards

**Description:** Generate a PNG image of the prediction for sharing on social media.

**Requirements:**
- Canvas-rendered graphic (640×760px)
- Dark background with hex-grid texture and gold border
- Real fighter photos fetched from Wikipedia API (CORS-open)
- Fallback to stylized silhouette if no photo found
- Shows: fighter names, records, win % bar, predicted winner + method, all 5 category bars
- Download PNG button (reliable fallback if clipboard blocked)
- Right-click to save natively on the rendered `<img>` tag

---

## 4. Prediction Engine

### 4.1 Core Category Scoring

Each category outputs a score from 0–100 (50 = even, >50 = Fighter 1 advantage):

#### Striking (weight: 26%)
```
rawStrike = (SLpM₁ × acc₁ - SLpM₂ × acc₂) × 8 + (strDef₁ - strDef₂) × 0.5
```
Capped at ±42 before adding 50.

#### Grappling (weight: 24%)
```
rawGrapple = (tdEff₁ - tdEff₂) × 13
           + (tdDef₁ - tdDef₂) × 0.6
           + (subAvg₁ - subAvg₂) × 10
           + (wrestlerResilience₁ - wrestlerResilience₂) × 0.8
```
where `tdEff = tdAvg × (tdAcc / 100)`. Capped ±44.

#### Cardio / Pace (weight: 15%)
```
ageScore(a) = +2 (≤29) | 0 (≤32) | -5 (≤35) | -11 (≤37) | -18 (38+)
rawCardio = (ageScore₁ - ageScore₂) + (SApM₂ - SApM₁) × 3.5
```
Capped ±40.

#### Finishing Power (weight: 16%)
```
rawPower = (finishRate₁ - finishRate₂) × 0.5 + (SLpM₁ - SLpM₂) × 2.5
```
Capped ±40.

#### Experience & Opponent Quality (weight: 7%)
```
rawExp = (oppQuality₁ - oppQuality₂) × 0.25
       + (winStreak₁ - winStreak₂) × 1.2
       + (wins₁ - wins₂) × 0.08
```
Hard capped at ±18 — experience is a tiebreaker only, not a deciding factor.

#### Style Matchup (weight: 12%)
```
styleNet = (f1.styleMatchups[f2.style] - f2.styleMatchups[f1.style]) × 1.7
```
Each fighter has a per-opponent-style bonus/penalty matrix. Amplified 1.7× to reflect how decisive style matchups are in MMA.

### 4.2 Direct Modifiers (added to raw score after core)

| Modifier | Formula |
|---|---|
| Ring Rust | Nonlinear: 0 (< 6mo), -3 (< 1yr), -7 (< 2yr), -12 (< 3yr), -17 (< 4yr), -22 (5yr+) |
| Recent Form | `(form₁ - form₂) × 2.2 × 0.12` — 0–10 scale per fighter |
| Size / Reach | Nonlinear weight bonus + reach differential + reach-handling attribute |
| Past Matchups | +10 / -12 based on prior fight results |
| Speed vs Hands | `(speedHandling₁ - speedHandling₂) × 0.6` |

### 4.3 Composite & Win Probability

```
core = striking×0.26 + grappling×0.24 + cardio×0.15 + power×0.16
     + experience×0.07 + (50+styleNet)×0.12

raw = core + sizeBonus + pastMod + speedHandsBonus + ringRustNet + recentFormNet×0.12
```

Win probability uses logistic compression beyond ±30pt deviation:
```
if |deviation| > 30:
    compressed = 30 + min(18, (|deviation| - 30) × 0.55)
    f1WinPct = 50 + sign(deviation) × compressed
else:
    f1WinPct = round(raw)

f1WinPct = clamp(f1WinPct, 1, 99)
f2WinPct = 100 - f1WinPct  // always derived, never independent
```

This allows genuine mismatches to reach 95–99% without the two displayed percentages ever disagreeing.

---

## 5. Fighter Data Schema

```javascript
{
  name: string,
  record: string,           // "27-1"
  rank: string,             // "#1 LW"
  country: string,          // emoji flag
  age: number,              // exact as of event date
  weightClass: string,
  naturalWeight: number,    // lbs (natural walking weight, not fight weight)
  reach: number,            // inches
  style: string,            // must match keys in other fighters' styleMatchups
  tendencies: string[],
  strengths: string[],
  weaknesses: string[],
  wrestlerResilience: number,       // 1–10
  reachDisadvantageHandling: number,// 1–10
  speedVsHandsHandling: number,     // 1–10
  yearsInactive: number,            // years since last fight
  recentForm: number,               // 0–10 current form rating
  styleMatchups: { [opponentStyle]: number }, // bonus/penalty per style
  opponentQuality: number,          // 0–100 caliber of past opponents
  stats: {
    slpm: number,     // significant strikes landed per minute
    stracc: number,   // strike accuracy %
    sapm: number,     // significant strikes absorbed per minute
    strdef: number,   // strike defense %
    tdavg: number,    // takedowns per 15 min
    tdacc: number,    // takedown accuracy %
    tddef: number,    // takedown defense %
    subavg: number,   // submission attempts per 15 min
    winStreak: number,
    finishRate: number, // % of wins by finish
  },
  pastMatchups: { [opponentName]: "W" | "L" },
}
```

---

## 6. Design

- **Theme:** Dark (near-black background `#0a0a0f`), gold accents (`#d4a843`), blue for Fighter 2 (`#6a8ad4`)
- **Font:** Georgia serif throughout
- **Animations:** Spring easing on probability bar, staged fade-in for prediction sections
- **Layout:** Sidebar nav + main content panel, split editor/preview in Fantasy tab

---

## 7. Known Limitations

- Fighter stats are manually curated — they reflect data available at time of build and may drift as fighters' careers evolve
- Wikipedia photo availability varies by fighter; less prominent fighters may use silhouette fallback
- Clipboard image copy may be blocked in some browser/OS combinations — download fallback always available
- Accuracy tracker is session-only (resets on page refresh) — persistent storage requires backend

---

## 8. Future Roadmap

| Priority | Feature |
|---|---|
| High | Persistent storage (localStorage or backend) for accuracy history |
| High | Live UFC stats API integration to auto-update fighter data |
| Medium | Parlay predictor (predict full card, score vs reality) |
| Medium | Fighter comparison view (side-by-side stat radar chart) |
| Low | User accounts + leaderboard for prediction accuracy |
| Low | Historical fight backtest (run predictions on past fights, score accuracy) |
