# PharmaLaunch PRO — Enterprise Launch Forecasting Platform (Databricks Cloud Lakehouse Architecture)

**PharmaLaunch PRO** is an enterprise-grade pharmaceutical commercial launch forecasting and decision support platform. It integrates a **12-Dimensional Gower Similarity Matrix** with **Non-Linear Bass Diffusion Trajectory Fitting**, **Databricks SQL Warehouse (Delta Lake)**, and **AWS S3 Cloud Storage** to predict 52-week post-launch revenue, prescription uptake, and scenario sensitivity curves for pre-launch drug candidates.

---

## 🌟 Key Platform Features & Functions

### 1. 🧬 Hybrid Quantitative Launch Forecasting Engine
- **12-Dimensional Gower Similarity Matrix**: Evaluates candidate drug similarity across clinical and commercial dimensions against a database of **150 validated historical drug launches**.
  - **Categorical Factors (7)**: Therapeutic Area, Primary Indication, Active Ingredient, Pharmacological Class, Mechanism of Action (MoA), Route of Administration, Target Population.
  - **Continuous Factors (5)**: Addressable Population, Competition Level, Relative Price Index, Market Access Level, Clinical Evidence Strength.
- **Bass Diffusion Trajectory Fit**: Estimates Innovation ($p$), Imitation ($q$), and Market Capacity ($M$) parameters using standardized Ridge regression and clinical evidence scores.
- **Hybrid Curve Weighting**: Blends top-$k$ analog historical curves with Bass diffusion curves (default: **10% Analog / 90% Bass**) under strict $100\%$ sum constraints.

### 2. 🗄️ Databricks Cloud Lakehouse Dual-Schema Architecture
The platform connects to a **Databricks SQL Warehouse** utilizing an enterprise dual-schema Delta Lake structure:

* **`gold` Schema (Analytical & Benchmark Layer)**:
  - `drug_forecasting.gold.bass_features`: Precomputed Bass curve parameters and feature weights.
  - `drug_forecasting.gold.weekly_rx`: Historical 52-week weekly prescription adoption trajectories across 150 benchmark launches.
  - `drug_forecasting.gold.analog_features`: 12-dimensional clinical & commercial metadata for historical analogs.
* **`app` Schema (Operational & Transactional Layer)**:
  - `drug_forecasting.app.organizations`: Multi-tenant organization profiles.
  - `drug_forecasting.app.users`: User identities, hashed credentials, and role assignments.
  - `drug_forecasting.app.user_forecast_inputs`: Complete candidate parameter inputs submitted by users.
  - `drug_forecasting.app.forecast_records`: Calculated 52-week trajectories, 12-month projections, Bass parameters ($p, q, m$), and provenance explanations.
* **Resilient Multi-Tier Ingestion**: Automatically loads benchmark data via **Databricks Gold Tables → AWS S3 Bucket → Local CSVs**.

### 3. 🎯 5-Step Guided Launch Setup Wizard
- **Step 1: Clinical & Product Identity**: Select recommended features using clean `<select>` dropdown controls or manual input.
- **Step 2: Market & Access Factors**: Addressable population, competition index, price index, access level.
- **Step 3: Commercial & Launch Support Drivers**: Marketing investment, launch support score, physician awareness.
- **Step 4: Hybrid Weighting & Analog Selection**: Interactive sliders for Top-$k$ analog selection ($1\text{--}10$) and Analog/Bass blend weights ($0\%\text{--}100\%$).
- **Step 5: Review & Executive Execution**: Pre-run review summary with instant calculation dispatch.

### 4. 📈 Interactive Analytics & Scenario Studio
- **52-Week Weekly Trajectory Chart**: Interactive dual-axis visualizer showing Base, Bull, and Bear scenarios alongside analog curves.
- **12-Month Projections**: Aggregated monthly adoption curves for executive reporting.
- **Scenario Sensitivity Studio**: Real-time simulation of market access shifts, competitive entry milestones (Week 1–52), and marketing support changes.
- **Full-Width Benchmark Analog Table**: Comprehensive view of top matching analog products, similarity scores, and historical 52-week Rx figures sorted naturally ($P001\text{--}P150$).
- **Account & Profile Management**: Dedicated `/account` settings to view organization details, update user profile, and change credentials securely.

---

## 🛠️ Project Architecture & Directory Structure

```
Drug-forecast/
├── backend/
│   ├── database.py              # Databricks SQL Warehouse engine & session management
│   ├── models.py                # SQLAlchemy ORM models with JSONString serialization
│   ├── schemas.py               # Pydantic request/response validation schemas
│   ├── main.py                  # FastAPI application entry point & CORS configuration
│   ├── forecasting/
│   │   ├── engine.py            # Main ForecastingEngine (Databricks Gold & S3 data loader)
│   │   ├── analog.py            # 12-Dimensional Gower similarity matrix engine
│   │   ├── bass.py              # Non-linear Bass diffusion parameter fitting
│   │   └── scenario_analysis.py # Scenario sensitivity simulation engine
│   └── routers/
│       ├── auth.py              # Sign-up, sign-in, profile update & authentication
│       └── forecast.py          # Forecast calculation, save, history & analog catalog endpoints
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Main Dashboard with session auth guard
│   │   │   ├── login/page.tsx    # Splash landing & sign-in / registration screen
│   │   │   ├── account/page.tsx  # User Profile & Credential Settings
│   │   │   ├── forecast/new/     # 5-Step Launch Forecast Wizard
│   │   │   ├── forecast/results/ # 52-Week Forecast Analysis Studio & Export
│   │   │   ├── forecast/explanations/ # Provenance & Methodology documentation
│   │   │   ├── analogs/          # 150 Analog Catalog View (P001 to P150)
│   │   │   └── saved/            # Saved Forecast Records (#1, #2, #3...)
│   │   ├── components/
│   │   │   ├── Sidebar.tsx       # Enterprise navigation sidebar
│   │   │   ├── Header.tsx        # Top header bar (Scoped Export Report button)
│   │   │   ├── AnalogTable.tsx   # Benchmark analog table component
│   │   │   ├── WeeklyChart.tsx   # Recharts 52-week trajectory visualizer
│   │   │   ├── MonthlyChart.tsx  # Recharts 12-month visualizer
│   │   │   └── ScenarioAnalysisStudio.tsx # Sensitivity simulation studio
│   │   └── lib/
│   │       ├── api.ts            # REST API client bindings & auth helpers
│   │       └── types.ts          # TypeScript domain interfaces
├── data/                        # Local benchmark analog CSV datasets
├── test.py                      # Databricks Gold and App schema diagnostic test script
├── .env                         # Cloud credentials & environment configuration
└── README.md                    # Platform documentation
```

---

## 🚀 API Endpoints Overview

### Authentication & Account (`/api/auth`)
- `POST /api/auth/signup`: Register new pharmaceutical organization & user account.
- `POST /api/auth/signin`: Authenticate user and issue session tokens.
- `POST /api/auth/update`: Verify current password and update user full name or password.

### Forecasting & Analytics (`/api`)
- `POST /api/forecast`: Compute 52-week hybrid launch forecast (returns Bass parameters, analogs, weekly/monthly points).
- `POST /api/forecast/recalculate`: Recalculate forecast with modified penetration or parameters.
- `POST /api/scenario-analysis`: Run sensitivity simulations for market access shifts and competitor entry.
- `POST /api/forecast/save`: Persist complete input parameters, Bass parameters, and outputs into Databricks.
- `GET /api/forecast/history`: Fetch saved forecast execution history in ascending order.
- `GET /api/analogs`: Query 150 historical benchmark products in natural numerical order ($P001\text{--}P150$).
- `GET /api/options`: Fetch unique values for input selection dropdowns.

---

## ⚙️ Setup & Execution Guide

### 1. Environment Configuration (`.env`)
Create a `.env` file in the project root directory with your Databricks and AWS S3 credentials:

```env
# ==========================================
# AWS S3 Settings
# ==========================================
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=forecast-drug-data-bucket

# ==========================================
# Databricks SQL Warehouse Settings
# ==========================================
DATABRICKS_SERVER_HOSTNAME=dbc-a95466db-a3ae.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/64a79bd12068cf95
DATABRICKS_TOKEN=your_databricks_token
DATABRICKS_CATALOG=drug_forecasting
DATABRICKS_APP_SCHEMA=app
DATABRICKS_GOLD_SCHEMA=gold

# ==========================================
# Databricks Gold Table Names
# ==========================================
TABLE_BASS_FINAL=bass_features
TABLE_WEEKLY_RX_FINAL=weekly_rx
TABLE_SIMILARITY_FEATURES=analog_features
```

### 2. Backend Setup (FastAPI & Databricks)
```bash
# Install Python dependencies
pip install fastapi uvicorn sqlalchemy sqlalchemy-databricks databricks-sql-connector boto3 python-dotenv pydantic pandas numpy scikit-learn scipy

# Run diagnostic connection test
python test.py

# Start FastAPI backend server
uvicorn backend.main:app --reload --port 8000
```

### 3. Frontend Setup (Next.js & TypeScript)
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access PharmaLaunch PRO.

---

## 📄 License & Attribution

Developed for enterprise pharmaceutical commercial launch planning and decision support. Powered by **FastAPI**, **Next.js**, **Databricks Delta Lake**, **AWS S3**, **Recharts**, and **Tailwind CSS**.
