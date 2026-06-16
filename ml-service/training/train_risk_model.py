"""
Тренування та порівняння класифікаційних моделей для оцінки страхового ризику.

Методологія:
    1. Завантажити синтетичний датасет (попередньо має бути згенерований
       скриптом generate_risk_dataset.py).
    2. Стратифікований поділ на навчальну і тестову вибірки (80/20) для
       фінального оцінювання на відкладених даних.
    3. Для кожного алгоритму-кандидата:
        - Задати сітку гіперпараметрів для пошуку.
        - Запустити GridSearchCV із 5-fold StratifiedKFold крос-валідацією
          на навчальній вибірці, метрика — ROC-AUC. Незбалансованість
          класів обробляється через class_weight='balanced'.
        - Перенавчити найкращий естиматор на повній навчальній вибірці.
    4. Сформувати звіт з результатами крос-валідації (середнє ± стандартне
       відхилення ROC-AUC) для кожного алгоритму, щоб продемонструвати
       розкид, разом з метриками на тестовій вибірці.
    5. Обчислити permutation feature importance на тестовій вибірці для
       найкращої моделі — це model-agnostic, статистично обґрунтована
       альтернатива SHAP без додаткових залежностей. Показує внесок
       кожної ознаки у якість на відкладених даних.
    6. Зберегти найкращу модель (за середнім CV ROC-AUC) у файл
       ../models/risk_model.joblib.
    7. Згенерувати графіки:
        - Розподіл CV ROC-AUC по моделях (box plot) — візуалізує розкид.
        - ROC-криві всіх кандидатів на тестовій вибірці.
        - Confusion matrix найкращої моделі.
        - Permutation importance найкращої моделі.

Опційно: pip install xgboost shap — для порівняння з XGBoost та
генерації SHAP-пояснень окремих передбачень. Поточна конфігурація
лише на sklearn дає еквівалентну строгість без зовнішніх залежностей.

Використання:
    python training/train_risk_model.py
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.model_selection import (
    train_test_split,
    StratifiedKFold,
    GridSearchCV,
    cross_val_score,
)
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.inspection import permutation_importance
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    roc_curve,
    classification_report,
)

# --- Шляхи до файлів ---
HERE = os.path.dirname(__file__)
DATA_PATH = os.path.join(HERE, "..", "data", "risk_dataset.csv")
MODEL_PATH = os.path.join(HERE, "..", "models", "risk_model.joblib")
BACKGROUND_PATH = os.path.join(HERE, "..", "models", "risk_shap_background.csv")
METRICS_PATH = os.path.join(HERE, "..", "models", "risk_model_metrics.json")
PLOTS_DIR = os.path.join(HERE, "plots")

NUMERIC_FEATURES = ["age", "annual_income", "credit_score", "years_customer", "prior_claims"]
CATEGORICAL_FEATURES = ["region"]
TARGET = "high_risk"

RANDOM_STATE = 42
CV_FOLDS = 5


def build_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )


def build_search_specs() -> dict:
    """
    Повертає словник {назва_моделі: (Pipeline, param_grid)}.
    Кожен Pipeline має крок 'preprocess' і крок 'clf'. Ключі сітки мають
    починатися з префіксу 'clf__', щоб звертатися до класифікатора
    всередині pipeline.
    """
    return {
        "Logistic Regression": (
            Pipeline(
                [
                    ("preprocess", build_preprocessor()),
                    (
                        "clf",
                        LogisticRegression(
                            max_iter=2000,
                            class_weight="balanced",
                            random_state=RANDOM_STATE,
                        ),
                    ),
                ]
            ),
            {
                "clf__C": [0.01, 0.1, 1.0, 10.0],
                "clf__penalty": ["l2"],
                "clf__solver": ["lbfgs"],
            },
        ),
        "Random Forest": (
            Pipeline(
                [
                    ("preprocess", build_preprocessor()),
                    (
                        "clf",
                        RandomForestClassifier(
                            class_weight="balanced",
                            random_state=RANDOM_STATE,
                            n_jobs=-1,
                        ),
                    ),
                ]
            ),
            {
                "clf__n_estimators": [100, 300],
                "clf__max_depth": [5, 10, None],
                "clf__min_samples_leaf": [1, 5, 20],
            },
        ),
        "Gradient Boosting": (
            Pipeline(
                [
                    ("preprocess", build_preprocessor()),
                    (
                        "clf",
                        HistGradientBoostingClassifier(
                            class_weight="balanced",
                            random_state=RANDOM_STATE,
                        ),
                    ),
                ]
            ),
            {
                "clf__max_iter": [100, 300, 500],
                "clf__max_depth": [3, 6, 10],
                "clf__learning_rate": [0.01, 0.05, 0.1],
            },
        ),
    }


def evaluate(model, X_test, y_test):
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    return (
        {
            "precision": float(precision_score(y_test, y_pred)),
            "recall": float(recall_score(y_test, y_pred)),
            "f1": float(f1_score(y_test, y_pred)),
            "roc_auc": float(roc_auc_score(y_test, y_proba)),
            "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        },
        y_proba,
    )


# --- Допоміжні функції для графіків ---


def plot_cv_distribution(cv_results: dict, save_path: str):
    """Box plot значень ROC-AUC, отриманих при крос-валідації, по моделях."""
    names = list(cv_results.keys())
    scores = [cv_results[n]["cv_scores"] for n in names]

    plt.figure(figsize=(8, 5))
    bp = plt.boxplot(scores, tick_labels=names, patch_artist=True, widths=0.5)
    colors = ["#6366f1", "#10b981", "#f59e0b"]
    for patch, color in zip(bp["boxes"], colors[: len(bp["boxes"])]):
        patch.set_facecolor(color)
        patch.set_alpha(0.6)
    plt.ylabel("ROC-AUC", fontsize=12)
    plt.title(f"{CV_FOLDS}-Fold Cross-Validation ROC-AUC Distribution", fontsize=14, fontweight="bold")
    plt.grid(axis="y", alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, dpi=120)
    plt.close()


def plot_roc_curves(results: dict, y_test, save_path: str):
    plt.figure(figsize=(8, 6))
    for name, result in results.items():
        fpr, tpr, _ = roc_curve(y_test, result["y_proba"])
        auc = result["test_metrics"]["roc_auc"]
        plt.plot(fpr, tpr, label=f"{name} (AUC = {auc:.3f})", linewidth=2)
    plt.plot([0, 1], [0, 1], "k--", linewidth=1, alpha=0.5, label="Random (AUC = 0.500)")
    plt.xlabel("False Positive Rate", fontsize=12)
    plt.ylabel("True Positive Rate", fontsize=12)
    plt.title("Test-Set ROC Curves — Insurance Risk Prediction", fontsize=14, fontweight="bold")
    plt.legend(loc="lower right", fontsize=10)
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, dpi=120)
    plt.close()


def plot_confusion(cm: list, model_name: str, save_path: str):
    cm_arr = np.array(cm)
    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(cm_arr, cmap="Blues")
    classes = ["Low Risk", "High Risk"]
    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(classes)
    ax.set_yticklabels(classes)
    ax.set_xlabel("Predicted", fontsize=12)
    ax.set_ylabel("Actual", fontsize=12)
    ax.set_title(f"Confusion Matrix — {model_name}", fontsize=14, fontweight="bold")
    for i in range(2):
        for j in range(2):
            ax.text(
                j, i, str(cm_arr[i, j]),
                ha="center", va="center", fontsize=18,
                color="white" if cm_arr[i, j] > cm_arr.max() / 2 else "black",
                fontweight="bold",
            )
    plt.colorbar(im)
    plt.tight_layout()
    plt.savefig(save_path, dpi=120)
    plt.close()


def plot_permutation_importance(importances, feature_names, model_name, save_path):
    """Box plot важливості ознак (permutation importance) по кількох повтореннях."""
    sorted_idx = importances.importances_mean.argsort()[::-1]
    sorted_names = [feature_names[i] for i in sorted_idx]
    sorted_importances = importances.importances[sorted_idx].T  # форма (n_repeats, n_features)

    plt.figure(figsize=(9, 5))
    bp = plt.boxplot(
        sorted_importances,
        tick_labels=sorted_names,
        vert=True,
        patch_artist=True,
        widths=0.5,
    )
    for patch in bp["boxes"]:
        patch.set_facecolor("steelblue")
        patch.set_alpha(0.6)
    plt.xticks(rotation=30, ha="right")
    plt.ylabel("Decrease in ROC-AUC", fontsize=12)
    plt.title(
        f"Permutation Feature Importance — {model_name}\n"
        f"(higher = bigger drop in score when feature is shuffled)",
        fontsize=12,
        fontweight="bold",
    )
    plt.grid(axis="y", alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, dpi=120)
    plt.close()


def main():
    print(f"Loading dataset from {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    print(f"  -> {len(df):,} rows, {df[TARGET].mean():.1%} positive class\n")

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE
    )
    print(f"Train: {len(X_train):,}  Test: {len(X_test):,}")
    print(f"Cross-validation: {CV_FOLDS}-fold StratifiedKFold on training set\n")

    cv_strategy = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)

    # --- Підбір гіперпараметрів + крос-валідація для кожної моделі ---
    search_specs = build_search_specs()
    cv_results = {}

    print("=" * 90)
    print(f"{'Model':<22} {'Best Params':<48} {'CV AUC (mean±std)':>18}")
    print("=" * 90)

    for name, (pipeline, grid) in search_specs.items():
        gs = GridSearchCV(
            pipeline,
            param_grid=grid,
            cv=cv_strategy,
            scoring="roc_auc",
            n_jobs=-1,
            refit=True,
            verbose=0,
        )
        gs.fit(X_train, y_train)

        # Перераховуємо через cross_val_score, щоб отримати окремі значення
        # для кожного фолду — потрібні для побудови графіку розкиду.
        cv_scores = cross_val_score(
            gs.best_estimator_, X_train, y_train, cv=cv_strategy, scoring="roc_auc", n_jobs=-1
        )

        clean_params = {k.replace("clf__", ""): v for k, v in gs.best_params_.items()}
        params_str = ", ".join(f"{k}={v}" for k, v in clean_params.items())
        if len(params_str) > 46:
            params_str = params_str[:43] + "..."

        print(
            f"{name:<22} {params_str:<48} "
            f"{cv_scores.mean():.3f} ± {cv_scores.std():.3f}"
        )

        cv_results[name] = {
            "best_estimator": gs.best_estimator_,
            "best_params": clean_params,
            "cv_scores": cv_scores.tolist(),
            "cv_mean": float(cv_scores.mean()),
            "cv_std": float(cv_scores.std()),
        }

    print("=" * 90)

    # --- Оцінка на тестовій вибірці ---
    print("\nFinal evaluation on held-out test set:")
    print("-" * 80)
    print(f"{'Model':<22} {'Precision':>10} {'Recall':>10} {'F1':>8} {'Test ROC-AUC':>14}")
    print("-" * 80)

    for name in cv_results:
        metrics, y_proba = evaluate(cv_results[name]["best_estimator"], X_test, y_test)
        cv_results[name]["test_metrics"] = metrics
        cv_results[name]["y_proba"] = y_proba
        print(
            f"{name:<22} {metrics['precision']:>10.3f} {metrics['recall']:>10.3f} "
            f"{metrics['f1']:>8.3f} {metrics['roc_auc']:>14.3f}"
        )
    print("-" * 80)

    # --- Вибір найкращої моделі за середнім CV (стабільніше за один тестовий поділ) ---
    best_name = max(cv_results.keys(), key=lambda k: cv_results[k]["cv_mean"])
    best = cv_results[best_name]
    print(f"\nBest model selected by CV mean: {best_name}")
    print(f"  CV ROC-AUC:   {best['cv_mean']:.3f} ± {best['cv_std']:.3f}")
    print(f"  Test ROC-AUC: {best['test_metrics']['roc_auc']:.3f}")
    print(f"  Best params:  {best['best_params']}\n")

    print("Detailed classification report on test set (best model):")
    y_pred_best = best["best_estimator"].predict(X_test)
    print(classification_report(y_test, y_pred_best, target_names=["Low Risk", "High Risk"]))

    # --- Permutation feature importance (model-agnostic, альтернатива SHAP) ---
    print("Computing permutation feature importance (15 repeats)...")
    importances = permutation_importance(
        best["best_estimator"],
        X_test,
        y_test,
        n_repeats=15,
        random_state=RANDOM_STATE,
        scoring="roc_auc",
        n_jobs=-1,
    )
    feature_names = NUMERIC_FEATURES + CATEGORICAL_FEATURES
    importance_summary = sorted(
        [
            {
                "feature": feat,
                "mean_decrease_auc": float(importances.importances_mean[i]),
                "std_decrease_auc": float(importances.importances_std[i]),
            }
            for i, feat in enumerate(feature_names)
        ],
        key=lambda x: x["mean_decrease_auc"],
        reverse=True,
    )
    print("Top features by mean decrease in ROC-AUC when shuffled:")
    for item in importance_summary:
        print(
            f"  {item['feature']:<18} {item['mean_decrease_auc']:.4f} ± {item['std_decrease_auc']:.4f}"
        )

    # --- Збереження найкращої моделі та метрик ---
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(best["best_estimator"], MODEL_PATH)
    print(f"\nSaved model -> {MODEL_PATH}")
    X_train.sample(n=min(100, len(X_train)), random_state=42).to_csv(BACKGROUND_PATH, index=False)
    print(f"Saved SHAP background -> {BACKGROUND_PATH}")

    summary = {
        "methodology": {
            "cv_strategy": f"StratifiedKFold(n_splits={CV_FOLDS}, shuffle=True)",
            "scoring": "roc_auc",
            "hyperparameter_search": "GridSearchCV (refit on full training fold)",
            "feature_importance": "permutation_importance (n_repeats=15)",
            "best_model_selection_criterion": "highest mean cross-validated ROC-AUC",
        },
        "best_model": best_name,
        "best_params": best["best_params"],
        "cv_summary": {
            name: {
                "cv_mean_roc_auc": cv_results[name]["cv_mean"],
                "cv_std_roc_auc": cv_results[name]["cv_std"],
                "cv_scores_per_fold": cv_results[name]["cv_scores"],
                "best_params": cv_results[name]["best_params"],
            }
            for name in cv_results
        },
        "test_metrics": {
            name: {k: v for k, v in cv_results[name]["test_metrics"].items() if k != "confusion_matrix"}
            for name in cv_results
        },
        "best_confusion_matrix": best["test_metrics"]["confusion_matrix"],
        "permutation_importance": importance_summary,
        "feature_set": {"numeric": NUMERIC_FEATURES, "categorical": CATEGORICAL_FEATURES},
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "positive_class_rate": float(y.mean()),
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"Saved metrics  -> {METRICS_PATH}")

    # --- Генерація графіків ---
    os.makedirs(PLOTS_DIR, exist_ok=True)
    plot_cv_distribution(cv_results, os.path.join(PLOTS_DIR, "risk_cv_distribution.png"))
    plot_roc_curves(cv_results, y_test, os.path.join(PLOTS_DIR, "risk_roc_curves.png"))
    plot_confusion(
        best["test_metrics"]["confusion_matrix"],
        best_name,
        os.path.join(PLOTS_DIR, "risk_confusion_matrix.png"),
    )
    plot_permutation_importance(
        importances,
        feature_names,
        best_name,
        os.path.join(PLOTS_DIR, "risk_feature_importance.png"),
    )
    print(f"Saved plots    -> {PLOTS_DIR}/ (4 PNG files)")
    print("\nDone.")


if __name__ == "__main__":
    main()
