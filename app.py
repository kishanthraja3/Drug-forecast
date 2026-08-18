
import os
import numpy as np
import pandas as pd
import streamlit as st
import matplotlib.pyplot as plt
import gower
from scipy.optimize import least_squares

st.set_page_config(
    page_title="New Product Adoption Forecasting",
    page_icon="📈",
    layout="wide"
)

st.title("📈 New Product Adoption Forecasting")
st.caption("Hybrid Analog + Bass Diffusion Forecasting")

# ============================================================
# FILES
# ============================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

SIM_FILE = os.path.join(DATA_DIR, "similarity+analog_features_final.csv")
RX_FILE = os.path.join(DATA_DIR, "weekly_rx_final.csv")
BASS_FILE = os.path.join(DATA_DIR, "bass_final.csv")

missing = [p for p in [SIM_FILE, RX_FILE, BASS_FILE] if not os.path.exists(p)]
if missing:
    st.error("Missing required CSV files.")
    for p in missing:
        st.write(f"- `{p}`")
    st.info(
        "Folder structure must be: app.py + data/ + the three CSV files."
    )
    st.stop()

@st.cache_data
def load_data():
    sim = pd.read_csv(SIM_FILE)
    rx = pd.read_csv(RX_FILE)
    bass = pd.read_csv(BASS_FILE)
    return sim, rx, bass

sim_df, rx_df, bass_df = load_data()

sim_df.columns = sim_df.columns.str.strip()
rx_df.columns = rx_df.columns.str.strip()
bass_df.columns = bass_df.columns.str.strip()

# ============================================================
# EXACT COLUMNS FROM YOUR DATASET
# ============================================================
SIM_COLS = [
    "therapeutic_area",
    "indication",
    "active_ingredient",
    "pharmacological_class",
    "mechanism_of_action",
    "route_of_administration",
    "target_population",
    "addressable_population",
    "competition_level",
    "relative_price_index",
    "market_access_level",
    "clinical_evidence_strength"
]

CAT_COLS = [
    "therapeutic_area",
    "indication",
    "active_ingredient",
    "pharmacological_class",
    "mechanism_of_action",
    "route_of_administration",
    "target_population",
    "competition_level",
    "market_access_level",
    "clinical_evidence_strength"
]

NUM_COLS = [
    "addressable_population",
    "relative_price_index"
]

required_sim = ["product_id"] + SIM_COLS
missing_sim = [c for c in required_sim if c not in sim_df.columns]
if missing_sim:
    st.error("Required similarity columns are missing:")
    st.write(missing_sim)
    st.stop()

required_rx = ["product_id", "week_since_launch", "weekly_rx"]
missing_rx = [c for c in required_rx if c not in rx_df.columns]
if missing_rx:
    st.error("Required Rx columns are missing:")
    st.write(missing_rx)
    st.stop()

# ============================================================
# PREPARE FEATURES
# ============================================================
feature_df = sim_df[SIM_COLS].copy()

for col in CAT_COLS:
    feature_df[col] = (
        feature_df[col]
        .astype(str)
        .str.strip()
        .str.lower()
    )
    mode = feature_df[col].mode()
    feature_df[col] = feature_df[col].replace(["nan", "none"], np.nan)
    if len(mode):
        feature_df[col] = feature_df[col].fillna(mode.iloc[0])
    else:
        feature_df[col] = feature_df[col].fillna("unknown")

for col in NUM_COLS:
    feature_df[col] = pd.to_numeric(feature_df[col], errors="coerce")
    feature_df[col] = feature_df[col].fillna(feature_df[col].median())

# ============================================================
# GOWER
# ============================================================
@st.cache_data
def build_gower(feature_data):
    # IMPORTANT: boolean mask must have one value per feature column.
    cat_features = [col in CAT_COLS for col in SIM_COLS]
    distance = gower.gower_matrix(
        feature_data,
        cat_features=cat_features
    )
    return 1 - distance

gower_sim = build_gower(feature_df)

product_ids = sim_df["product_id"].astype(str).tolist()
product_index = {pid: i for i, pid in enumerate(product_ids)}

# ============================================================
# RX
# ============================================================
rx_df["product_id"] = rx_df["product_id"].astype(str)
rx_df["week_since_launch"] = pd.to_numeric(
    rx_df["week_since_launch"], errors="coerce"
)
rx_df["weekly_rx"] = pd.to_numeric(
    rx_df["weekly_rx"], errors="coerce"
).fillna(0)
rx_df = rx_df.sort_values(["product_id", "week_since_launch"])

def get_rx_curve(product_id):
    d = rx_df[rx_df["product_id"] == str(product_id)]
    curve = np.zeros(52)
    for _, row in d.iterrows():
        if pd.notna(row["week_since_launch"]):
            w = int(row["week_since_launch"])
            if 1 <= w <= 52:
                curve[w - 1] = row["weekly_rx"]
    return curve

def find_analogs(target_product, k=5):
    idx = product_index[str(target_product)]
    sims = gower_sim[idx].copy()
    sims[idx] = -np.inf
    inds = np.argsort(sims)[::-1][:k]
    return pd.DataFrame({
        "product_id": [product_ids[i] for i in inds],
        "similarity": [float(sims[i]) for i in inds]
    })

def analog_forecast(target_product, k=5):
    analogs = find_analogs(target_product, k)
    curves = np.array([get_rx_curve(pid) for pid in analogs["product_id"]])
    weights = np.maximum(analogs["similarity"].to_numpy(), 0)
    if weights.sum() == 0:
        weights = np.ones(len(weights))
    weights = weights / weights.sum()
    forecast = np.average(curves, axis=0, weights=weights)
    return forecast, analogs

# ============================================================
# BASS
# ============================================================
def bass_cumulative(t, p, q, M):
    t = np.asarray(t, dtype=float)
    e = np.exp(-(p + q) * t)
    return M * ((1 - e) / (1 + (q / p) * e))

def fit_bass(weekly_curve):
    weekly_curve = np.asarray(weekly_curve, dtype=float)
    if len(weekly_curve) == 0:
        weekly_curve = np.zeros(1)

    cumulative = np.cumsum(weekly_curve)
    weeks = np.arange(1, len(weekly_curve) + 1)
    max_obs = max(float(cumulative.max()), 1.0)

    def residual(params):
        p, q, M = params
        return bass_cumulative(weeks, p, q, M) - cumulative

    result = least_squares(
        residual,
        x0=[0.01, 0.20, max_obs * 1.5],
        bounds=(
            [0.0001, 0.0001, max_obs * 1.001],
            [1.0, 2.0, max_obs * 20]
        ),
        max_nfev=10000
    )

    p, q, M = result.x
    t52 = np.arange(1, 53)
    cumulative52 = bass_cumulative(t52, p, q, M)
    weekly52 = np.diff(np.insert(cumulative52, 0, 0))
    weekly52 = np.maximum(weekly52, 0)

    return p, q, M, weekly52

def hybrid_forecast(analog, bass, alpha):
    return alpha * analog + (1 - alpha) * bass

def apply_scenario(curve, market_multiplier=1.0, speed_multiplier=1.0):
    curve = np.asarray(curve, dtype=float) * market_multiplier
    if speed_multiplier != 1.0:
        weeks = np.arange(1, len(curve) + 1)
        shifted = weeks / speed_multiplier
        curve = np.interp(shifted, weeks, curve)
    return np.maximum(curve, 0)

def apply_competitor(curve, launch_week, impact):
    curve = np.asarray(curve, dtype=float).copy()
    if launch_week is None or impact <= 0:
        return curve
    for i in range(max(0, launch_week - 1), len(curve)):
        weeks_after = i - (launch_week - 1)
        effect = 1 - impact * (1 - np.exp(-0.20 * (weeks_after + 1)))
        curve[i] *= max(effect, 0)
    return curve

# ============================================================
# DASHBOARD
# ============================================================
st.sidebar.header("Forecast Settings")

selected_product = st.sidebar.selectbox(
    "Target Product",
    product_ids
)

k = st.sidebar.slider(
    "Top-K Analog Products",
    3, 10, 5
)

alpha = st.sidebar.slider(
    "Analog Weight (α)",
    0.0, 1.0, 0.5, 0.05
)

st.sidebar.caption(
    f"Analog: {alpha*100:.0f}%  |  Bass: {(1-alpha)*100:.0f}%"
)

early_weeks = st.sidebar.selectbox(
    "Available Early Rx",
    [4, 8, 12, 24],
    index=0
)

st.sidebar.header("Market Scenario")

scenario = st.sidebar.selectbox(
    "Scenario",
    ["Base", "Bull", "Bear", "Custom"]
)

if scenario == "Base":
    market_multiplier, speed_multiplier = 1.0, 1.0
elif scenario == "Bull":
    market_multiplier, speed_multiplier = 1.20, 1.15
elif scenario == "Bear":
    market_multiplier, speed_multiplier = 0.80, 0.85
else:
    market_multiplier = st.sidebar.slider(
        "Market Potential Multiplier", 0.50, 1.50, 1.00, 0.05
    )
    speed_multiplier = st.sidebar.slider(
        "Adoption Speed Multiplier", 0.50, 1.50, 1.00, 0.05
    )

st.sidebar.header("Competitor Scenario")

competitor_enabled = st.sidebar.checkbox("Competitor launches")

if competitor_enabled:
    competitor_week = st.sidebar.slider(
        "Competitor Launch Week", 1, 52, 24
    )
    competitor_impact = st.sidebar.slider(
        "Competitor Impact", 0.0, 0.80, 0.20, 0.05
    )
else:
    competitor_week = None
    competitor_impact = 0.0

if st.button("🚀 Generate Forecast", type="primary"):

    with st.spinner("Generating hybrid forecast..."):

        analog, analogs = analog_forecast(selected_product, k)

        actual = get_rx_curve(selected_product)
        observed = actual[:early_weeks]

        p, q, M, bass = fit_bass(observed)

        hybrid = hybrid_forecast(
            analog,
            bass,
            alpha
        )

        scenario_curve = apply_scenario(
            hybrid,
            market_multiplier,
            speed_multiplier
        )

        final_forecast = apply_competitor(
            scenario_curve,
            competitor_week,
            competitor_impact
        )

    st.success("Forecast generated successfully!")

    # ========================================================
    # KPIs
    # ========================================================
    peak_week = int(np.argmax(final_forecast) + 1)

    c1, c2, c3, c4 = st.columns(4)

    c1.metric(
        "52-Week Cumulative Rx",
        f"{final_forecast.sum():,.0f}"
    )

    c2.metric(
        "Peak Week",
        peak_week
    )

    c3.metric(
        "Peak Weekly Rx",
        f"{final_forecast.max():,.0f}"
    )

    c4.metric(
        "Market Potential (M)",
        f"{M:,.0f}"
    )

    # ========================================================
    # MODEL PARAMETERS
    # ========================================================
    st.subheader("Bass Diffusion Parameters")

    p1, p2, p3 = st.columns(3)

    p1.metric("p — Innovation", f"{p:.5f}")
    p2.metric("q — Imitation", f"{q:.5f}")
    p3.metric("M — Market Potential", f"{M:,.0f}")

    # ========================================================
    # ANALOGS
    # ========================================================
    st.subheader("Top-K Similar Products")

    analog_table = analogs.copy()
    analog_table["similarity"] = (
        analog_table["similarity"] * 100
    ).round(2)

    analog_table = analog_table.rename(
        columns={
            "product_id": "Product ID",
            "similarity": "Similarity (%)"
        }
    )

    st.dataframe(
        analog_table,
        use_container_width=True,
        hide_index=True
    )

    # ========================================================
    # CONTRIBUTION
    # ========================================================
    st.subheader("Hybrid Contribution")

    h1, h2 = st.columns(2)

    h1.metric(
        "Analog Contribution",
        f"{alpha*100:.0f}%"
    )

    h2.metric(
        "Bass Contribution",
        f"{(1-alpha)*100:.0f}%"
    )

    # ========================================================
    # FORECAST CHART
    # ========================================================
    st.subheader("52-Week Adoption Curve")

    weeks = np.arange(1, 53)

    fig, ax = plt.subplots(figsize=(12, 6))

    ax.plot(
        weeks,
        analog,
        label="Analog Forecast"
    )

    ax.plot(
        weeks,
        bass,
        label="Bass Forecast"
    )

    ax.plot(
        weeks,
        hybrid,
        label="Hybrid Forecast",
        linewidth=3
    )

    ax.plot(
        weeks,
        final_forecast,
        label="Final Scenario Forecast",
        linestyle="--",
        linewidth=2
    )

    if competitor_enabled:
        ax.axvline(
            competitor_week,
            linestyle=":",
            label="Competitor Launch"
        )

    ax.set_xlabel("Week Since Launch")
    ax.set_ylabel("Weekly Rx")
    ax.set_title("Product Adoption Forecast")
    ax.legend()
    ax.grid(alpha=0.3)

    st.pyplot(fig)

    # ========================================================
    # ACTUAL VS FORECAST
    # ========================================================
    st.subheader("Actual vs Forecast")

    comparison = pd.DataFrame({
        "Week": weeks,
        "Actual Rx": actual,
        "Hybrid Forecast": hybrid,
        "Final Scenario Forecast": final_forecast
    })

    st.dataframe(
        comparison,
        use_container_width=True,
        hide_index=True
    )

    # ========================================================
    # RE-CALIBRATION
    # ========================================================
    st.subheader("6-Month Recalibration")

    st.info(
        """
        When Week-24 actual Rx becomes available, the Bass model is
        refitted using the newly observed Rx.

        Existing historical Rx is retained.

        Week 1–24 actual Rx
        → refit p, q, M
        → update Week 25–52 forecast.

        If a competitor launches after Month 6, the competitor scenario
        is applied from the launch week onward without changing the
        historical actual Rx.
        """
    )

    if early_weeks >= 24:
        st.success(
            "24 weeks of actual Rx are available, so the model can be recalibrated."
        )
    else:
        st.warning(
            f"{early_weeks} weeks are currently available. "
            "Recalibration can be repeated when Week 24 data arrives."
        )

    # ========================================================
    # COMPETITOR IMPACT
    # ========================================================
    if competitor_enabled:
        st.subheader("Competitor Impact")

        st.write(
            f"Competitor launch: Week {competitor_week}"
        )

        st.write(
            f"Assumed impact: {competitor_impact*100:.0f}%"
        )

        st.write(
            "The chart shows the original hybrid forecast and the "
            "adjusted forecast after the competitor launch."
        )

st.markdown("---")
st.caption(
    "Hybrid Analog + Bass Diffusion | Gower-based analog selection"
)
