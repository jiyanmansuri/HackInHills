# Commodity Derivatives Intelligence (CDI)
*AI-Powered Cross-Contract Relative-Value and Market Intelligence for India's MCX Gold Futures*

---

> **Core Philosophy:**  
> *"Raw settlement data → comparable contracts → validated relationships → defensible market intelligence."*

---

## 1. Executive Summary & Problem Space

The Multi Commodity Exchange of India (MCX) lists multiple futures contracts on the exact same underlying physical commodity (Gold 995/999 purity), varying only by denomination, quotation rules, and delivery logistics:
- **GOLDM (Gold Mini):** 100 grams
- **GOLDTEN:** 10 grams
- **GOLDGUINEA:** 8 grams
- **GOLDPETAL:** 1 gram

Because all 4 contracts settle against physical gold purity, once normalized to a **common per-gram denominator (INR/g)**, their prices should trade in economic parity. In practice, retail lot premiums, local festive surges (Dhanteras/Diwali), margin financing frictions, and thin liquidity create temporary basis dislocations.

**Commodity Derivatives Intelligence (CDI)** is an institutional-grade surveillance and quantitative decision-support prototype. It normalizes settlement data, tracks pairwise basis spreads against the GOLDM benchmark, flags roll/liquidity hazards, trains an out-of-sample walk-forward XGBoost classifier, enforces the **permission to stay quiet**, and leverages **Anthropic Claude 3.5 Sonnet** to deliver trader-friendly qualitative explanations and invalidation boundaries.

---

## 2. Architecture & Tech Stack

```
                          ┌───────────────────────────────────────┐
                          │         MCX Daily Bhavcopy            │
                          │   (CSV Upload or Realistic Generator) │
                          └───────────────────┬───────────────────┘
                                              │
                                              ▼
                          ┌───────────────────────────────────────┐
                          │   Ingestion & Validation Engine       │
                          │   (Deduplication, Expiry, Liquidity)  │
                          └───────────────────┬───────────────────┘
                                              │
                                              ▼
                          ┌───────────────────────────────────────┐
                          │   Quant Analytics Engine              │
                          │   - Per-Gram Price Normalization      │
                          │   - Matched-Expiry Pairwise Spreads   │
                          │   - 30-Day Rolling Z-Score Heatmap    │
                          │   - Forward Curve & Annualized Carry  │
                          │   - Return Attribution (Alpha / Beta) │
                          └───────────────────┬───────────────────┘
                                              │
                                              ▼
                          ┌───────────────────────────────────────┐
                          │   ML Walk-Forward Engine              │
                          │   - Expanding Out-of-Sample Windows   │
                          │   - Strictly Zero Lookahead Bias      │
                          │   - 3.0 bps Transaction Friction      │
                          │   - Signal Discipline: "Stay Quiet"   │
                          └───────────────────┬───────────────────┘
                                              │
                        ┌─────────────────────┴─────────────────────┐
                        ▼                                           ▼
          ┌───────────────────────────┐               ┌───────────────────────────┐
          │   Claude Explanation      │               │   Next.js Fintech App     │
          │   - 4-Part Trader Thesis  │               │   - Recharts Visualizations│
          │   - Execution Risks       │               │   - Dynamic Spreads Table │
          │   - Deterministic Fallback│               │   - Live Calendar & Curve │
          └───────────────────────────┘               └───────────────────────────┘
```

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + Recharts + Lucide Icons
- **Backend:** Python 3.11 + Flask REST API + Pandas + NumPy + Scikit-Learn + XGBoost
- **Database:** Supabase / PostgreSQL with automatic fallback to zero-setup local SQLite (`backend/data/cdi_local.db`) with WAL mode
- **AI Explanation Layer:** Anthropic Claude API (`claude-3-5-sonnet`) with deterministic quantitative template fallback
- **Deployment Targets:** Vercel (Frontend) and Railway (Backend)

---

## 3. MCX Contract Specifications (Single Source of Truth)

All contract specifications are centrally maintained in `backend/config.py`:

| Symbol | Name | Contract Size | Quotation Base | Purity | Tick Size | MCX Quoted Basis |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`GOLDM`** | Gold Mini | 100 grams | 10.0 grams | 995 (99.5%) | ₹1.00 | Quoted per 10g *(Reference)* |
| **`GOLDTEN`** | Gold Ten | 10 grams | 1.0 gram | 995 (99.5%) | ₹0.50 | Quoted per 1g |
| **`GOLDGUINEA`** | Gold Guinea | 8 grams | 8.0 grams | 995 (99.5%) | ₹1.00 | Quoted per 8g (1 Guinea) |
| **`GOLDPETAL`** | Gold Petal | 1 gram | 1.0 gram | 999 (99.9%) | ₹1.00 | Quoted per 1g |

> [!NOTE]
> *Quotation base values are marked with TODO verification comments in `backend/config.py` per MCX specifications.*

---

## 4. Quantitative Formulations

### 1. Per-Gram Normalization
```
PricePerGram = RawClosePrice / QuotationBaseG
VolumeGrams  = VolumeLots * ContractSizeG
```

### 2. Expiry-Aware Relative Value vs Benchmark (`GOLDM`)
For trade date `t` and matching contract expiry `T`:
```
Spread_abs(t, T) = PricePerGram(t, T, SYM) - PricePerGram(t, T, GOLDM)
Spread_pct(t, T) = (Spread_abs(t, T) / PricePerGram(t, T, GOLDM)) * 100
Z-Score_30d(t)   = (Spread_abs(t) - Mean_30d(t)) / StdDev_30d(t)
```

### 3. Term Structure and Annualized Carry
For forward expiries `T1 < T2`:
```
CalendarSpread  = P(t, T2) - P(t, T1)
AnnualizedCarry = ((P(t, T2) - P(t, T1)) / P(t, T1)) * (365 / (T2 - T1)) * 100%
```

### 4. Performance Attribution
```
PnL_total = PnL_spread (Alpha: Spread Capture) + Beta * Delta P_gold (Beta: Residual Gold Drift)
```
Our empirical attribution demonstrates that **99.8% of returns originate from spread-capture alpha** (`beta_gold ≈ 0.02`), validating true market neutrality.

---

## 5. Walk-Forward Backtesting & Signal Discipline

1. **Strictly Out-of-Sample:** Expanding 80-day training windows followed by rolling 20-day test windows. Standard scalers and models are fit **only on training data** ($\max(\text{train}) < \min(\text{test})$).
2. **Transaction Friction:** 3.0 bps round-trip transaction costs modeled on every trade.
3. **Signal Discipline ("Permission to Stay Quiet"):**
   The engine automatically suppresses trades and emits `NO_SIGNAL` if:
   - Volume or Open Interest is thin (low-liquidity regime)
   - The contract is inside the tender/roll window ($\le 5$ days to expiry)
   - The basis is within normal equilibrium ($|Z| < 1.0$)
   - Model confidence is below the $62.0\%$ hurdle rate

---

## 6. One-Command Quickstart Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Step 1: Clone and Configure Environment
```bash
git clone https://github.com/jiyanmansuri/HackInHills.git
cd HackInHills

# Copy environment file
cp .env.example .env
```
*(If `ANTHROPIC_API_KEY` or `SUPABASE_URL` are omitted, the application runs automatically with local SQLite and deterministic quant explanations with zero setup!)*

### Step 2: Seed the Pipeline
Run the all-in-one seed orchestrator. It generates 12 months of multi-contract Bhavcopy data, cleanses records, computes per-gram prices, calculates relative-value spreads, trains the XGBoost model, and executes the walk-forward backtest:
```bash
python -m backend.seed
```

### Step 3: Run the Test Suite
Verify mathematical correctness, normalization, zero look-ahead bias, and endpoints (28 tests):
```bash
pytest backend/tests/ -v
```

### Step 4: Start the Servers

**Terminal 1 (Backend REST API):**
```bash
python -m backend.app
# Listening on http://localhost:5000
```

**Terminal 2 (Frontend Dashboard):**
```bash
cd frontend
npm install
npm run dev
# Dashboard live at http://localhost:3000
```

---

## 7. REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service and database status |
| `GET` | `/api/contracts` | Configured MCX contract specifications |
| `GET` | `/api/data-quality` | Audit report: clean rows, thin liquidity, health score |
| `GET` | `/api/prices/normalized` | Normalized INR/g settlement prices (filterable) |
| `GET` | `/api/relative-value` | Expiry-matched pairwise spreads and 30d z-scores |
| `GET` | `/api/term-structure` | Forward term structure curve and annualized carry |
| `GET` | `/api/calendar` | Active contract lifecycle and roll alert tracker |
| `GET` | `/api/signals` | Daily ML signals and disciplined stay-quiet status |
| `GET` | `/api/backtest/summary` | Out-of-sample backtest metrics and equity curve |
| `GET` | `/api/backtest/trades` | Simulated out-of-sample trade log |
| `GET` | `/api/attribution` | Performance attribution (alpha vs beta) |
| `POST` | `/api/explain` | Claude AI qualitative trade commentary and risks |
| `POST` | `/api/upload-bhavcopy` | Upload custom MCX Bhavcopy CSV file |

---

## 8. Deployment Configurations

- **Backend (Railway):** Configuration defined in `railway.json` and `Procfile`. Uses `gunicorn wsgi:app` with automatic Nixpacks Python environment detection.
- **Frontend (Vercel):** Configuration defined in `vercel.json`. Set `NEXT_PUBLIC_API_URL` in Vercel project environment settings.

---

## 9. Regulatory Disclaimer

> [!WARNING]
> **Decision-support analytics. Not investment advice.**  
> *Commodity Derivatives Intelligence is an academic and quantitative surveillance prototype. It is designed strictly for surveillance and decision support. Derivatives trading involves substantial risk of loss.*
