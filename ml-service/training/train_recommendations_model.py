"""
Тренування content-based моделі рекомендацій страхових продуктів.

Рекомендатор використовує TF-IDF-векторизацію описів продуктів і
ранжує продукти за косинусною подібністю до профілю інтересів клієнта.

Підхід:
    1. Завантажити каталог продуктів (8 синтетичних страхових продуктів,
       які охоплюють чотири типи: AUTO, HEALTH, LIFE, PROPERTY).
    2. Натренувати TF-IDF-векторизатор на об'єднаному тексті (назва +
       тип + опис) для кожного продукту.
    3. Обчислити матрицю ознак продуктів (n_products × n_features).
    4. Зберегти векторизатор + матрицю + метадані продуктів як єдиний
       joblib-bundle, який FastAPI-сервіс завантажує при старті.

Під час інференсу сервіс будує "запит інтересів" клієнта з його
демографічних ознак (вікова категорія, рівень доходу, життєві події)
і ранжує продукти за косинусною подібністю до вектора запиту. Це
стандартний content-based підхід (Aggarwal 2016, "Recommender Systems:
The Textbook", розділ 4), обраний з таких міркувань:

  - Не потребує матриці user-item взаємодій (на відміну від collaborative
    filtering), що підходить системі на старті, де таких даних ще немає.
  - Природно вирішує cold-start: рекомендації працюють і для клієнтів
    без жодної історії взаємодій.
  - Каталог невеликий (8 продуктів), тому косинусна подібність
    обчислюється за константний час на запит.
  - Результат інтерпретований: матчингові слова можна показати як
    пояснення, що і вимагає UI платформи.

Використання:
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


# Маппінг демографічних профілів у ключові слова, який використовується
# при інференсі. Документується тут, щоб тренувальний скрипт міг
# перевірити, що результати ранжування адекватні.
DEMO_PROFILES = {
    "young_low_income": {
        "age": 22, "income": 28000, "life_events": [],
        "expected_top_type": "AUTO",  # молоді водії + низький дохід → базове авто
    },
    "young_with_car": {
        "age": 26, "income": 45000, "life_events": ["new_car"],
        "expected_top_type": "AUTO",
    },
    "family_with_children": {
        "age": 35, "income": 75000, "life_events": ["marriage", "child"],
        "expected_top_type": "HEALTH",  # сімейні події → здоров'я / життя
    },
    "high_income_homeowner": {
        "age": 48, "income": 150000, "life_events": ["new_home"],
        "expected_top_type": "PROPERTY",  # власник житла → майно
    },
    "near_retirement": {
        "age": 58, "income": 95000, "life_events": ["retirement_planning"],
        "expected_top_type": "LIFE",  # старший вік + планування → довічне страхування життя
    },
}


def build_query_keywords(age: int, income: float, life_events: list) -> str:
    """
    Перетворює профіль клієнта у вільний текстовий запит, проти якого
    TF-IDF-векторизатор оцінює каталог продуктів.

    Маппінг детермінований і задокументований — це дозволяє покрити його
    тестами і пояснити у тексті дипломної роботи.
    """
    parts = []

    # Вікові категорії (загальна базова лінія — слабкий сигнал, по одному входженню)
    if age < 30:
        parts.extend(["young", "affordable", "basic"])
    if 30 <= age < 50:
        parts.append("comprehensive")  # без "family" — це сигнал life-event, не віку
    if age >= 50:
        parts.extend(["retirement", "security"])

    # Категорії доходу
    if income < 35000:
        parts.extend(["affordable", "budget"])
    if income > 100000:
        parts.extend(["premium", "luxury"])

    # Життєві події — це сильні сигнали, тому повторюємо кожне ключове слово
    # тричі, щоб воно домінувало у запиті (TF-IDF зважує частоту терма).
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

    # Об'єднаний текст для кожного продукту = назва + тип + опис.
    catalog["combined_text"] = (
        catalog["name"].astype(str)
        + " "
        + catalog["type"].astype(str)
        + " "
        + catalog["description"].astype(str)
    )

    # Тренуємо TF-IDF-векторизатор.
    vectorizer = TfidfVectorizer(
        max_features=200,
        ngram_range=(1, 2),
        stop_words="english",
        min_df=1,  # малий каталог — зберігаємо всі терми
    )
    product_matrix = vectorizer.fit_transform(catalog["combined_text"])
    print(f"TF-IDF vocabulary size: {len(vectorizer.vocabulary_)}")
    print(f"Product matrix shape:   {product_matrix.shape}\n")

    # Перевірка адекватності: будуємо ранжування рекомендацій для задокументованих
    # демографічних профілів і порівнюємо з очікуваним top-type.
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

    # Збереження bundle на диск.
    bundle = {
        "vectorizer": vectorizer,
        "product_matrix": product_matrix,
        "products": catalog[["product_id", "name", "type", "description"]].to_dict(orient="records"),
    }
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(bundle, MODEL_PATH)
    print(f"\nSaved model -> {MODEL_PATH}")

    # Збереження зведених метрик для дипломної роботи.
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
