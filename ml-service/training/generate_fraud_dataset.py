"""
Генерація синтетичного датасету для задачі виявлення страхового шахрайства.

Створює CSV з числовими і текстовими ознаками. Мітки шахрайства отримуються
з імовірнісної моделі, яка комбінує суму, час подачі, наявність свідків і
стиль текстового опису. Приблизно 15% заявок позначаються як шахрайські —
це рівень незбалансованості, порівнянний із галузевими оцінками.

Текстові описи семплюються з двох пулів шаблонів:
    - "легітимні" шаблони: конкретні, деталізовані розповіді.
    - "підозрілі" шаблони: розмиті, узагальнені, часто з ризиковою лексикою.

Навчений класифікатор має ловити і числові сигнали (велика сума, відсутність
свідків, заявка незабаром після оформлення поліса), і лексичні сигнали
(розмиті формулювання, підозрілі ключові слова).

Використання:
    python training/generate_fraud_dataset.py
    -> записує data/fraud_dataset.csv (5 000 рядків).
"""

import numpy as np
import pandas as pd
import os

RNG_SEED = 42
N_SAMPLES = 5_000
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "fraud_dataset.csv")


# --- Шаблони текстових описів заявок ---

LEGITIMATE_TEMPLATES = [
    "Rear-end collision at the intersection of {street} and {avenue}; minor whiplash and bumper damage.",
    "Water damage in the kitchen ceiling from a burst pipe in the upstairs bathroom on {date}.",
    "Tree branch fell during the storm on {date} and dented the roof above the garage.",
    "Front-end collision when the other driver ran a red light at {street}; police report filed.",
    "Slipped on icy steps at the front entrance; sprained ankle, ER visit at {hospital}.",
    "Hailstorm on {date} caused dents on the hood and cracked the windshield.",
    "Kitchen fire started from an unattended pan, contained by smoke detector and extinguisher.",
    "Deer collision on the highway near exit {exit_num}; airbag deployed, vehicle towed.",
    "Bicycle accident; broken collarbone, treated at {hospital}, X-rays and follow-up scheduled.",
    "Backyard fence damaged by neighbour's tree falling during high winds on {date}.",
    "Burglary while on vacation; entry through the back window, electronics and jewellery taken, police report #{report_id}.",
    "Pipe burst in basement; water damage to flooring and stored items, plumber invoice attached.",
    "Minor parking lot collision at {store}; both drivers exchanged details, insurance info noted.",
    "Lightning strike damaged HVAC unit on {date}; technician assessment attached.",
    "Side-swipe accident on highway; dashcam footage available, other driver's insurance contacted.",
]

SUSPICIOUS_TEMPLATES = [
    "Car was damaged.",
    "Items stolen, no witnesses, cash and electronics gone.",
    "Fire damage, unknown cause, total loss.",
    "Vehicle disappeared from parking lot, no security camera footage.",
    "Lost expensive jewellery, no receipt, not sure when.",
    "Broken items, unwitnessed accident at home.",
    "Stolen valuables, all cash, no inventory list.",
    "Total loss, no documentation available.",
    "Damage occurred while alone, nobody saw, no police report.",
    "Items missing after recent move, exact value uncertain.",
    "Sudden mechanical failure, vehicle written off, no third party.",
    "House contents destroyed, fire of unknown origin, no smoke alarm activated.",
    "Property damage but no witnesses, claim is for full replacement value.",
    "Cash and gold coins stolen from home safe, exact amounts approximate.",
    "Vehicle stolen, no GPS data, no security footage available.",
]


def _fill_template(template: str, rng: np.random.Generator) -> str:
    """Замінює плейсхолдери у шаблоні випадковими правдоподібними значеннями."""
    streets = ["Main St", "Oak Ave", "Pine Rd", "Elm Blvd", "5th Ave"]
    avenues = ["Maple Ave", "Cedar Lane", "Birch St", "Walnut Rd"]
    hospitals = ["Mercy General", "St. Luke's", "Riverside Medical", "City General"]
    stores = ["Walmart", "Target", "Costco", "Home Depot"]
    dates = ["March 12", "April 3", "May 18", "June 24", "July 5", "August 11"]
    return (
        template.replace("{street}", rng.choice(streets))
        .replace("{avenue}", rng.choice(avenues))
        .replace("{hospital}", rng.choice(hospitals))
        .replace("{store}", rng.choice(stores))
        .replace("{date}", rng.choice(dates))
        .replace("{exit_num}", str(rng.integers(10, 200)))
        .replace("{report_id}", f"PR-{rng.integers(10000, 99999)}")
    )


def generate_dataset(n: int = N_SAMPLES, seed: int = RNG_SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    # --- Числові ознаки ---

    # Сума заявки: лог-нормальний розподіл, шахрайські заявки зсунуті вгору.
    base_amount = rng.lognormal(mean=7.5, sigma=1.0, size=n)  # медіана ~$1800

    # Тип заявки: категорія
    claim_type = rng.choice(["AUTO", "HEALTH", "PROPERTY", "LIFE"], size=n, p=[0.4, 0.3, 0.25, 0.05])

    # Кількість днів між оформленням поліса та подачею заявки.
    # Шахрайство часто трапляється на початку (одразу після купівлі поліса).
    days_since_policy_start = rng.integers(1, 1500, size=n)

    # Чи були свідки інциденту (булеве)
    has_witnesses = rng.choice([0, 1], size=n, p=[0.4, 0.6])

    # Скільки попередніх заявок було у клієнта по цьому ж полісу
    prior_claims_count = rng.poisson(lam=0.5, size=n)

    # --- Обчислюємо ймовірність шахрайства для кожного рядка ---

    # Базовий логіт
    logit = -3.0  # більшість заявок легітимні

    # Більша сума → більший ризик шахрайства (особливо при дуже високих сумах)
    amount_factor = np.where(base_amount > 30000, 1.5, 0) + np.where(base_amount > 10000, 0.5, 0)

    # Ранні заявки підозрілі
    timing_factor = np.where(days_since_policy_start < 30, 1.5, 0) + np.where(
        days_since_policy_start < 90, 0.5, 0
    )

    # Відсутність свідків → підозріло
    witness_factor = np.where(has_witnesses == 0, 0.7, 0)

    # Багато попередніх заявок → підозріло
    prior_factor = prior_claims_count * 0.3

    # Об'єднуємо + додаємо шум
    final_logit = (
        logit
        + amount_factor
        + timing_factor
        + witness_factor
        + prior_factor
        + rng.normal(0, 0.3, size=n)
    )
    proba_fraud = 1 / (1 + np.exp(-final_logit))
    is_fraud = (rng.uniform(size=n) < proba_fraud).astype(int)

    # --- Текстові описи ---
    # Для шахрайських рядків з імовірністю 80% беремо підозрілий шаблон,
    # для легітимних — з імовірністю 95% беремо легітимний шаблон.
    descriptions = []
    for fraud_label in is_fraud:
        if fraud_label == 1:
            template_pool = SUSPICIOUS_TEMPLATES if rng.uniform() < 0.80 else LEGITIMATE_TEMPLATES
        else:
            template_pool = LEGITIMATE_TEMPLATES if rng.uniform() < 0.95 else SUSPICIOUS_TEMPLATES
        descriptions.append(_fill_template(rng.choice(template_pool), rng))

    df = pd.DataFrame(
        {
            "amount": np.round(base_amount, 2),
            "claim_type": claim_type,
            "days_since_policy_start": days_since_policy_start,
            "has_witnesses": has_witnesses,
            "prior_claims_count": prior_claims_count,
            "description": descriptions,
            "is_fraud": is_fraud,
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
    print(df["is_fraud"].value_counts(normalize=True).round(3).to_string())
    print()
    print("Sample legitimate claim:")
    print(f"  {df[df['is_fraud']==0]['description'].iloc[0]}")
    print()
    print("Sample fraudulent claim:")
    print(f"  {df[df['is_fraud']==1]['description'].iloc[0]}")
