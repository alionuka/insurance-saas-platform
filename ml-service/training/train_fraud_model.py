"""
Тренування та порівняння класифікаційних моделей для виявлення страхового
шахрайства (розширена методологія).

Поєднує числові ознаки (amount, days_since_policy_start, has_witnesses,
prior_claims_count, one-hot закодований claim_type) з текстовими ознаками,
отриманими з опису заявки через TF-IDF (мішок слів + біграми).

Методологія:
    1. Завантажити синтетичний датасет (згенерований generate_fraud_dataset.py).
    2. Стратифікований поділ на навчальну і тестову вибірки (80/20).
    3. Дві конфігурації ознак порівнюються як ablation-дослідження, щоб
       ізолювати внесок текстового каналу:
        (а) Базова конфігурація: лише числові ознаки.
        (б) Числові ознаки + текстові ознаки TF-IDF.
    4. Для кожної конфігурації моделі-кандидати підбираються через
       GridSearchCV із 5-fold StratifiedKFold крос-валідацією
       (scoring=ROC-AUC) та class_weight='balanced' для незбалансованості.
    5. Звітуються значення крос-валідації для кожного фолду (середнє ± std).
    6. Фінальна оцінка на тестовій вибірці: precision, recall, F1, ROC-AUC,
       confusion matrix.
    7. Найкращий pipeline (за середнім CV ROC-AUC) зберігається на диск.
    8. Графіки: box plot розкиду CV ROC-AUC по pipeline-ах, ROC-криві на
       тестовій вибірці, confusion matrix найкращої моделі.

Використання:
    python training/train_fraud_model.py
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
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    roc_curve,
    classification_report,
)

HERE = os.path.dirname(__file__)
DATA_PATH = os.path.join(HERE, "..", "data", "fraud_dataset.csv")
MODEL_PATH = os.path.join(HERE, "..", "models", "fraud_model.joblib")
METRICS_PATH = os.path.join(HERE, "..", "models", "fraud_model_metrics.json")
PLOTS_DIR = os.path.join(HERE, "plots")

NUMERIC_FEATURES = ["amount", "days_since_policy_start", "has_witnesses", "prior_claims_count"]
CATEGORICAL_FEATURES = ["claim_type"]
TEXT_FEATURE = "description"
TARGET = "is_fraud"

RANDOM_STATE = 42
CV_FOLDS = 5


def build_preprocessor(include_text: bool) -> ColumnTransformer:
    transformers = [
        ("num", StandardScaler(), NUMERIC_FEATURES),
        ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
    ]
    if include_text:
        transformers.append(
            (
                "text",
                TfidfVectorizer(
                    max_features=500,
                    ngram_range=(1, 2),
                    stop_words="english",
                    min_df=2,
                ),
                TEXT_FEATURE,
            )
        )
    return ColumnTransformer(transformers=transformers, remainder="drop")


def build_search_specs(include_text: bool) -> dict:
    """
    Для кожного алгоритму: (Pipeline, param_grid). HistGradientBoosting
    виключений з конфігурації +TF-IDF, бо не приймає розріджений вхід
    від TfidfVectorizer.
    """
    specs = {
        "Logistic Regression": (
            Pipeline(
                [
                    ("preprocess", build_preprocessor(include_text)),
                    (
                        "clf",
                        LogisticRegression(
                            max_iter=2000, class_weight="balanced", random_state=RANDOM_STATE
                        ),
                    ),
                ]
            ),
            {
                "clf__C": [0.1, 1.0, 10.0],
                "clf__penalty": ["l2"],
                "clf__solver": ["lbfgs"],
            },
        ),
        "Random Forest": (
            Pipeline(
                [
                    ("preprocess", build_preprocessor(include_text)),
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
                "clf__max_depth": [10, 20, None],
                "clf__min_samples_leaf": [1, 5],
            },
        ),
    }
    if not include_text:
        specs["Gradient Boosting"] = (
            Pipeline(
                [
                    ("preprocess", build_preprocessor(include_text)),
                    (
                        "clf",
                        HistGradientBoostingClassifier(
                            class_weight="balanced", random_state=RANDOM_STATE
                        ),
                    ),
                ]
            ),
            {
                "clf__max_iter": [100, 300],
                "clf__max_depth": [3, 6, 10],
                "clf__learning_rate": [0.05, 0.1],
            },
        )
    return specs


def evaluate(model, X_test, y_test):
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    return (
        {
            "precision": float(precision_score(y_test, y_pred, zero_division=0)),
            "recall": float(recall_score(y_test, y_pred, zero_division=0)),
            "f1": float(f1_score(y_test, y_pred, zero_division=0)),
            "roc_auc": float(roc_auc_score(y_test, y_proba)),
            "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        },
        y_proba,
    )


def plot_cv_distribution(results: dict, save_path: str):
    """Box plot значень CV ROC-AUC по pipeline-ах (конфігурація + модель)."""
    names = list(results.keys())
    scores = [results[n]["cv_scores"] for n in names]

    plt.figure(figsize=(10, 5))
    bp = plt.boxplot(scores, tick_labels=names, patch_artist=True, widths=0.6)
    # Конфігурацію "тільки числові" фарбуємо інакше, ніж "числові + TF-IDF"
    for patch, name in zip(bp["boxes"], names):
        if "Numeric only" in name:
            patch.set_facecolor("#94a3b8")  # сірий — базова лінія
        else:
            patch.set_facecolor("#10b981")  # зелений — з текстовими ознаками
        patch.set_alpha(0.7)
    plt.ylabel("ROC-AUC", fontsize=12)
    plt.title(f"{CV_FOLDS}-Fold CV ROC-AUC Distribution — Fraud Detection", fontsize=13, fontweight="bold")
    plt.xticks(rotation=15, ha="right", fontsize=9)
    plt.grid(axis="y", alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, dpi=120)
    plt.close()


def plot_roc_curves(results: dict, y_test, save_path: str):
    plt.figure(figsize=(9, 6))
    for label, r in results.items():
        fpr, tpr, _ = roc_curve(y_test, r["y_proba"])
        auc = r["test_metrics"]["roc_auc"]
        plt.plot(fpr, tpr, label=f"{label} (AUC = {auc:.3f})", linewidth=2)
    plt.plot([0, 1], [0, 1], "k--", linewidth=1, alpha=0.5, label="Random (AUC = 0.500)")
    plt.xlabel("False Positive Rate", fontsize=12)
    plt.ylabel("True Positive Rate", fontsize=12)
    plt.title("Test-Set ROC Curves — Insurance Fraud Detection", fontsize=14, fontweight="bold")
    plt.legend(loc="lower right", fontsize=8)
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, dpi=120)
    plt.close()


def plot_confusion(cm: list, model_name: str, save_path: str):
    cm_arr = np.array(cm)
    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(cm_arr, cmap="Reds")
    classes = ["Legitimate", "Fraudulent"]
    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(classes)
    ax.set_yticklabels(classes)
    ax.set_xlabel("Predicted", fontsize=12)
    ax.set_ylabel("Actual", fontsize=12)
    ax.set_title(f"Confusion Matrix — {model_name}", fontsize=13, fontweight="bold")
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


def main():
    print(f"Loading dataset from {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    print(f"  -> {len(df):,} rows, {df[TARGET].mean():.1%} positive class\n")

    feature_cols = NUMERIC_FEATURES + CATEGORICAL_FEATURES + [TEXT_FEATURE]
    X = df[feature_cols]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE
    )
    print(f"Train: {len(X_train):,}  Test: {len(X_test):,}")
    print(f"Cross-validation: {CV_FOLDS}-fold StratifiedKFold on training set\n")

    cv_strategy = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    all_results = {}

    print("=" * 100)
    print(
        f"{'Configuration':<22} {'Model':<22} {'Best Params':<32} {'CV AUC (mean±std)':>20}"
    )
    print("=" * 100)

    for config_name, include_text in [("Numeric only", False), ("Numeric + TF-IDF", True)]:
        for clf_name, (pipeline, grid) in build_search_specs(include_text).items():
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
            cv_scores = cross_val_score(
                gs.best_estimator_, X_train, y_train, cv=cv_strategy, scoring="roc_auc", n_jobs=-1
            )

            label = f"[{config_name}] {clf_name}"
            clean_params = {k.replace("clf__", ""): v for k, v in gs.best_params_.items()}
            params_str = ", ".join(f"{k}={v}" for k, v in clean_params.items())
            if len(params_str) > 30:
                params_str = params_str[:27] + "..."

            all_results[label] = {
                "best_estimator": gs.best_estimator_,
                "best_params": clean_params,
                "cv_scores": cv_scores.tolist(),
                "cv_mean": float(cv_scores.mean()),
                "cv_std": float(cv_scores.std()),
                "config": config_name,
                "model": clf_name,
            }

            print(
                f"{config_name:<22} {clf_name:<22} {params_str:<32} "
                f"{cv_scores.mean():.3f} ± {cv_scores.std():.3f}"
            )

    print("=" * 100)

    # --- Оцінка на тестовій вибірці ---
    print("\nFinal evaluation on held-out test set:")
    print("-" * 90)
    print(
        f"{'Configuration':<22} {'Model':<22} {'Prec':>6} {'Rec':>6} {'F1':>6} {'AUC':>6}"
    )
    print("-" * 90)

    for label in all_results:
        metrics, y_proba = evaluate(all_results[label]["best_estimator"], X_test, y_test)
        all_results[label]["test_metrics"] = metrics
        all_results[label]["y_proba"] = y_proba
        cfg = all_results[label]["config"]
        mdl = all_results[label]["model"]
        print(
            f"{cfg:<22} {mdl:<22} "
            f"{metrics['precision']:>6.3f} {metrics['recall']:>6.3f} "
            f"{metrics['f1']:>6.3f} {metrics['roc_auc']:>6.3f}"
        )
    print("-" * 90)

    # --- Вибір найкращого pipeline за середнім CV ROC-AUC ---
    best_label = max(all_results.keys(), key=lambda k: all_results[k]["cv_mean"])
    best = all_results[best_label]
    print(f"\nBest pipeline by mean CV ROC-AUC: {best_label}")
    print(f"  CV ROC-AUC:   {best['cv_mean']:.3f} ± {best['cv_std']:.3f}")
    print(f"  Test ROC-AUC: {best['test_metrics']['roc_auc']:.3f}")
    print(f"  Best params:  {best['best_params']}\n")

    print("Detailed classification report on test set (best model):")
    y_pred_best = best["best_estimator"].predict(X_test)
    print(classification_report(y_test, y_pred_best, target_names=["Legitimate", "Fraudulent"]))

    # --- Збереження найкращої моделі та метрик ---
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(best["best_estimator"], MODEL_PATH)
    print(f"Saved model -> {MODEL_PATH}")

    BACKGROUND_PATH = os.path.join(HERE, "..", "models", "fraud_shap_background.csv")
    X_train_numeric = X_train[NUMERIC_FEATURES]
    X_train_numeric.sample(n=min(100, len(X_train_numeric)), random_state=42).to_csv(BACKGROUND_PATH, index=False)
    print(f"Saved SHAP background -> {BACKGROUND_PATH}")

    summary = {
        "methodology": {
            "cv_strategy": f"StratifiedKFold(n_splits={CV_FOLDS}, shuffle=True)",
            "scoring": "roc_auc",
            "hyperparameter_search": "GridSearchCV (refit on full training fold)",
            "best_pipeline_selection_criterion": "highest mean cross-validated ROC-AUC",
            "ablation_design": "Two configurations compared (Numeric only vs Numeric + TF-IDF) to isolate the contribution of the text channel.",
        },
        "best_pipeline": best_label,
        "best_model": best["model"],
        "best_config": best["config"],
        "best_params": best["best_params"],
        "cv_summary": {
            label: {
                "cv_mean_roc_auc": all_results[label]["cv_mean"],
                "cv_std_roc_auc": all_results[label]["cv_std"],
                "cv_scores_per_fold": all_results[label]["cv_scores"],
                "best_params": all_results[label]["best_params"],
            }
            for label in all_results
        },
        "test_metrics": {
            label: {k: v for k, v in all_results[label]["test_metrics"].items() if k != "confusion_matrix"}
            for label in all_results
        },
        "best_confusion_matrix": best["test_metrics"]["confusion_matrix"],
        "feature_set": {
            "numeric": NUMERIC_FEATURES,
            "categorical": CATEGORICAL_FEATURES,
            "text": TEXT_FEATURE,
            "tfidf_max_features": 500,
            "tfidf_ngram_range": [1, 2],
        },
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "positive_class_rate": float(y.mean()),
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"Saved metrics  -> {METRICS_PATH}")

    # --- Генерація графіків ---
    os.makedirs(PLOTS_DIR, exist_ok=True)
    plot_cv_distribution(all_results, os.path.join(PLOTS_DIR, "fraud_cv_distribution.png"))
    plot_roc_curves(all_results, y_test, os.path.join(PLOTS_DIR, "fraud_roc_curves.png"))
    plot_confusion(
        best["test_metrics"]["confusion_matrix"],
        best_label,
        os.path.join(PLOTS_DIR, "fraud_confusion_matrix.png"),
    )
    print(f"Saved plots    -> {PLOTS_DIR}/")
    print("\nDone.")


if __name__ == "__main__":
    main()
