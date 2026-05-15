"""
Train a content-based product recommendation model.

The recommender uses TF-IDF vectorization of insurance product descriptions
and ranks products by cosine similarity to a customer's interest profile.

Approach:
    1. Load the product catalog (8 synthetic insurance products covering
       four types: AUTO, HEALTH, LIFE, PROPERTY).
    2. Fit a TF-IDF vectorizer over the combined text features
       (name + type + description) for each product.
    3. Compute the product-feature matrix (n_products x n_features).
    4. Save the vectorizer + product matrix + product metadata as a single
       joblib bundle that the FastAPI service loads at startup.

At inference time the service constructs a customer "interest query" string
from demographic features (age bracket, income bracket, life events) and
ranks products by cosine similarity to the query vector. This is a standard
content-based recommender pattern (Aggarwal 2016, "Recommender Systems: The
Textbook", chapter 4) chosen because:

  - It does not require a user-item interaction matrix (unlike collaborative
    filtering), which suits a system that has just launched.
  - It handles the cold-start problem natively — recommendations work for
    customers with zero prior history.
  - The product catalog is small (8 products), so cosine similarity runs in
    constant time per query.
  - The output is interpretable: matched terms can be surfaced as the
    explanation, which the platform's UI requires.

Usage:
    python training/train_recommendations_model.py
"""

import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

HERE = os.path.dirname(__file__)
CATALOG_PATH = os.path.join(HERE, "..", "data", "products_catalog.csv")
MODEL_PATH = os.path.join(HERE, "..", "models", "recommendations_model.joblib")
METRICS_PATH = os.path.join(HERE, "..", "models", "recommendations_model_metrics.json")


# Demographic-to-keywords mapping used at inference time. Documented here so
# the training output can verify it produces sensible rankings.
DEMO_PROFILES = {
    "young_low_income": {
        "age": 22, "income": 28000, "life_events": [],
        "expected_top_type": "AUTO",  # young drivers + low income → basic auto
    },
    "young_with_car": {
        "age": 26, "income": 45000, "life_events": ["new_car"],
        "expected_top_type": "AUTO",
    },
    "family_with_children": {
        "age": 35, "income": 75000, "life_events": ["marriage", "child"],
        "expected_top_type": "HEALTH",  # family events → health/life
    },
    "high_income_homeowner": {
        "age": 48, "income": 150000, "life_events": ["new_home"],
        "expected_top_type": "PROPERTY",  # homeowner → property
    },
    "near_retirement": {
        "age": 58, "income": 95000, "life_events": ["retirement_planning"],
        "expected_top_type": "LIFE",  # older + planning → whole life
    },
}


def build_query_keywords(age: int, income: float, life_events: list) -> str:
    """
    Translate a customer profile into a free-text query string that the
    TF-IDF vectorizer can score against the product catalog.

    The mapping is documented and deterministic so it can be exercised
    from tests and explained in the thesis text.
    """
    parts = []

    # Age brackets (general baseline — weak signal, single occurrence each)
    if age < 30:
        parts.extend(["young", "affordable", "basic"])
    if 30 <= age < 50:
        parts.append("comprehensive")  # without "family" — that's a life-event signal
    if age >= 50:
        parts.extend(["retirement", "security"])

    # Income brackets
    if income < 35000:
        parts.extend(["affordable", "budget"])
    if income > 100000:
        parts.extend(["premium", "luxury"])

    # Life events — these are strong signals so repeat each keyword three times
    # to dominate the bag-of-words query (TF-IDF weights term frequency).
    def boost(*keywords):
        for kw in keywords:
            parts.extend([kw] * 3)

    for event in life_events:
        ev = event.lower()
        if ev in ("new_car", "vehicle"):
            boost("auto", "vehicle", "driving")
        if ev in ("marriage", "child", "children"):
            boost("family", "dependents", "health", "life")
        if ev in ("new_home", "homeowner", "house"):
            boost("home", "property", "homeowner", "house", "residence")
        if ev in ("retirement_planning", "retirement"):
            boost("retirement", "legacy", "estate", "whole", "life")
        if ev in ("rental", "apartment", "renter"):
            boost("renter", "apartment", "tenant")

    if not parts:
        parts = ["basic", "essential", "coverage"]

    return " ".join(parts)


def main():
    print(f"Loading product catalog from {CATALOG_PATH}")
    catalog = pd.read_csv(CATALOG_PATH)
    print(f"  -> {len(catalog)} products across {catalog['type'].nunique()} types\n")

    # Combined text per product = name + type + description.
    catalog["combined_text"] = (
        catalog["name"].astype(str)
        + " "
        + catalog["type"].astype(str)
        + " "
        + catalog["description"].astype(str)
    )

    # Fit TF-IDF vectorizer.
    vectorizer = TfidfVectorizer(
        max_features=200,
        ngram_range=(1, 2),
        stop_words="english",
        min_df=1,  # small catalog — keep all terms
    )
    product_matrix = vectorizer.fit_transform(catalog["combined_text"])
    print(f"TF-IDF vocabulary size: {len(vectorizer.vocabulary_)}")
    print(f"Product matrix shape:   {product_matrix.shape}\n")

    # Sanity-check: produce ranked recommendations for the documented
    # demographic profiles and compare against expected top-type.
    print("=" * 70)
    print(f"{'Profile':<28} {'Top-1 product':<28} {'Type':<10} {'Sim':>6}")
    print("=" * 70)

    profile_results = {}
    correct_count = 0
    for profile_name, profile in DEMO_PROFILES.items():
        query = build_query_keywords(profile["age"], profile["income"], profile["life_events"])
        query_vec = vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, product_matrix)[0]
        ranked_idx = np.argsort(similarities)[::-1]

        top1 = catalog.iloc[ranked_idx[0]]
        is_correct = top1["type"] == profile["expected_top_type"]
        if is_correct:
            correct_count += 1

        print(
            f"{profile_name:<28} {top1['name']:<28} {top1['type']:<10} "
            f"{similarities[ranked_idx[0]]:>6.3f}"
        )

        profile_results[profile_name] = {
            "query": query,
            "top_3": [
                {
                    "product_id": catalog.iloc[i]["product_id"],
                    "name": catalog.iloc[i]["name"],
                    "type": catalog.iloc[i]["type"],
                    "similarity": round(float(similarities[i]), 3),
                }
                for i in ranked_idx[:3]
            ],
            "expected_top_type": profile["expected_top_type"],
            "matched_expectation": bool(is_correct),
        }

    print("=" * 70)
    accuracy = correct_count / len(DEMO_PROFILES)
    print(f"\nProfile match accuracy: {correct_count}/{len(DEMO_PROFILES)} = {accuracy:.0%}")

    # Save bundle.
    bundle = {
        "vectorizer": vectorizer,
        "product_matrix": product_matrix,
        "products": catalog[["product_id", "name", "type", "description"]].to_dict(orient="records"),
    }
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(bundle, MODEL_PATH)
    print(f"\nSaved model -> {MODEL_PATH}")

    # Save metrics summary for thesis.
    summary = {
        "approach": "Content-based filtering with TF-IDF + cosine similarity",
        "n_products_in_catalog": int(len(catalog)),
        "n_product_types": int(catalog["type"].nunique()),
        "tfidf_vocabulary_size": int(len(vectorizer.vocabulary_)),
        "tfidf_max_features": 200,
        "tfidf_ngram_range": [1, 2],
        "demographic_profile_match_accuracy": float(accuracy),
        "profile_results": profile_results,
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"Saved metrics  -> {METRICS_PATH}")
    print("\nDone.")


if __name__ == "__main__":
    main()
