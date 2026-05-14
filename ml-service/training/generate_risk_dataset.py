"""
Generate synthetic dataset for insurance risk prediction.

Produces a CSV with realistic feature distributions and a target variable
(high_risk: 0/1) derived from a probabilistic model that combines several
features. The relationship is non-linear so models like RandomForest and
XGBoost can outperform a simple Logistic Regression baseline.

Usage:
    python training/generate_risk_dataset.py
    -> writes data/risk_dataset.csv with 10,000 rows.
"""

import numpy as np
import pandas as pd
import os

RNG_SEED = 42
N_SAMPLES = 10_000
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "risk_dataset.csv")


def generate_dataset(n: int = N_SAMPLES, seed: int = RNG_SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    # --- Features ---
    # Age: 18-80, slightly skewed toward middle ages (insurance buyers)
    age = np.clip(rng.normal(loc=40, scale=12, size=n), 18, 80).astype(int)

    # Annual income: log-normal distribution (typical for income data)
    # Median around $50k, long tail
    annual_income = np.round(rng.lognormal(mean=10.8, sigma=0.5, size=n), 2)

    # Credit score: 300-850, normally distributed around 680
    credit_score = np.clip(rng.normal(loc=680, scale=80, size=n), 300, 850).astype(int)

    # Years driving / years as customer (proxy for stability)
    years_customer = np.clip(rng.normal(loc=8, scale=5, size=n), 0, 50).astype(int)

    # Number of prior claims in last 5 years (Poisson distribution)
    prior_claims = rng.poisson(lam=0.6, size=n)

    # Region risk multiplier (categorical: 0=urban high-density, 1=suburban, 2=rural)
    region = rng.choice([0, 1, 2], size=n, p=[0.5, 0.35, 0.15])

    # --- Target: high_risk (1) or low_risk (0) ---
    # Probabilistic: combine features through a logistic function with non-linear interactions.
    # This mimics how real underwriting works — multiple factors compound.

    # Lower credit score increases risk
    credit_factor = (700 - credit_score) / 100.0  # higher when credit is low

    # Very young or very old drivers are riskier
    age_factor = np.where(age < 25, (25 - age) * 0.05, 0) + np.where(
        age > 65, (age - 65) * 0.03, 0
    )

    # Lower income slightly increases risk (proxy for financial stress)
    income_factor = np.maximum(0, (40000 - annual_income) / 40000.0) * 0.5

    # Prior claims strongly predict future claims
    claims_factor = prior_claims * 0.4

    # Urban region adds risk
    region_factor = np.where(region == 0, 0.3, np.where(region == 1, 0.0, -0.2))

    # New customers are slightly riskier (less history = more uncertainty)
    customer_factor = np.maximum(0, (3 - years_customer) * 0.1)

    # Combine into a logit
    logit = (
        -2.5  # base rate (most people are low risk)
        + credit_factor
        + age_factor
        + income_factor
        + claims_factor
        + region_factor
        + customer_factor
        # Non-linear interaction: high prior_claims AND low credit is especially risky
        + (prior_claims * credit_factor * 0.3)
        # Non-linear interaction: young drivers with prior claims are very risky
        + np.where((age < 25) & (prior_claims > 0), 1.0, 0.0)
        + rng.normal(0, 0.15, size=n)  # noise (reduced)
    )

    # Convert to probability
    probability_high_risk = 1 / (1 + np.exp(-logit))

    # Sample binary outcome
    high_risk = (rng.uniform(size=n) < probability_high_risk).astype(int)

    df = pd.DataFrame(
        {
            "age": age,
            "annual_income": annual_income,
            "credit_score": credit_score,
            "years_customer": years_customer,
            "prior_claims": prior_claims,
            "region": region,
            "high_risk": high_risk,
        }
    )

    return df


if __name__ == "__main__":
    df = generate_dataset()
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)

    print(f"Generated {len(df):,} samples → {OUTPUT_PATH}")
    print()
    print("Class distribution:")
    print(df["high_risk"].value_counts(normalize=True).round(3).to_string())
    print()
    print("Feature summary:")
    print(df.describe().round(2).to_string())
