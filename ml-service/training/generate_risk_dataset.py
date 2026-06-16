"""
Генерація синтетичного датасету для задачі оцінки страхового ризику.

Створює CSV з реалістичними розподілами ознак і цільовою змінною
(high_risk: 0/1), отриманою з імовірнісної моделі, яка комбінує кілька
ознак. Зв'язок між ознаками і ціллю нелінійний, тому моделі типу
RandomForest і Gradient Boosting можуть переграти просту логістичну
регресію як базову лінію.

Використання:
    python training/generate_risk_dataset.py
    -> записує data/risk_dataset.csv (10 000 рядків).
"""

import numpy as np
import pandas as pd
import os

RNG_SEED = 42
N_SAMPLES = 10_000
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "risk_dataset.csv")


def generate_dataset(n: int = N_SAMPLES, seed: int = RNG_SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    # --- Ознаки ---
    # Вік: 18–80, з невеликим зміщенням до середнього віку (типова аудиторія страхування)
    age = np.clip(rng.normal(loc=40, scale=12, size=n), 18, 80).astype(int)

    # Річний дохід: лог-нормальний розподіл (типовий для доходу),
    # медіана близько $50k, довгий хвіст.
    annual_income = np.round(rng.lognormal(mean=10.8, sigma=0.5, size=n), 2)

    # Кредитний рейтинг: 300–850, нормальний розподіл навколо 680
    credit_score = np.clip(rng.normal(loc=680, scale=80, size=n), 300, 850).astype(int)

    # Стаж водіння / тривалість співпраці (проксі стабільності)
    years_customer = np.clip(rng.normal(loc=8, scale=5, size=n), 0, 50).astype(int)

    # Кількість попередніх виплат за останні 5 років (розподіл Пуассона)
    prior_claims = rng.poisson(lam=0.6, size=n)

    # Регіональний коефіцієнт ризику (категорія: 0=місто щільне, 1=передмістя, 2=село)
    region = rng.choice([0, 1, 2], size=n, p=[0.5, 0.35, 0.15])

    # --- Цільова змінна: high_risk (1) або low_risk (0) ---
    # Імовірнісна: комбінуємо ознаки через логістичну функцію з нелінійними
    # взаємодіями. Імітує реальне андеррайтерство — кілька факторів складаються.

    # Низький кредитний рейтинг підвищує ризик
    credit_factor = (700 - credit_score) / 100.0  # тим більший, чим нижчий рейтинг

    # Дуже молоді або дуже літні водії — ризикованіші
    age_factor = np.where(age < 25, (25 - age) * 0.05, 0) + np.where(
        age > 65, (age - 65) * 0.03, 0
    )

    # Низький дохід трохи підвищує ризик (проксі фінансового стресу)
    income_factor = np.maximum(0, (40000 - annual_income) / 40000.0) * 0.5

    # Попередні виплати сильно прогнозують майбутні
    claims_factor = prior_claims * 0.4

    # Міський регіон додає ризику
    region_factor = np.where(region == 0, 0.3, np.where(region == 1, 0.0, -0.2))

    # Нові клієнти трохи ризикованіші (менше історії = більше невизначеності)
    customer_factor = np.maximum(0, (3 - years_customer) * 0.1)

    # Об'єднуємо у логіт
    logit = (
        -2.5  # базова частота (більшість людей — низького ризику)
        + credit_factor
        + age_factor
        + income_factor
        + claims_factor
        + region_factor
        + customer_factor
        # Нелінійна взаємодія: багато попередніх виплат + низький рейтинг = особливо ризиковано
        + (prior_claims * credit_factor * 0.3)
        # Нелінійна взаємодія: молоді водії з попередніми виплатами — дуже ризикові
        + np.where((age < 25) & (prior_claims > 0), 1.0, 0.0)
        + rng.normal(0, 0.15, size=n)  # шум (зменшений)
    )

    # Перетворюємо логіт у ймовірність
    probability_high_risk = 1 / (1 + np.exp(-logit))

    # Семплуємо бінарну мітку з цієї ймовірності
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
