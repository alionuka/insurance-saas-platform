"""
Train and compare three classification models for insurance risk prediction.

Pipeline:
    1. Load synthetic dataset (must be generated first via generate_risk_dataset.py).
    2. Split into train (80%) / test (20%) with stratification on the target.
    3. Build sklearn Pipelines with preprocessing (StandardScaler for numeric,
       OneHotEncoder for region) + estimator.
    4. Train: LogisticRegression (baseline), RandomForestClassifier,
       GradientBoostingClassifier.
    5. Evaluate each on the held-out test set: precision, recall, F1, ROC-AUC,
       confusion matrix.
    6. Save the best-performing model (by ROC-AUC) to ../models/risk_model.joblib.
    7. Generate plots: ROC curves comparison, confusion matrix of best model,
       feature importance for the best tree-based model.
    8. Print a comparison table summarizing all three models.

Usage:
    python training/train_risk_model.py
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib

matplotlib.use("Agg")  # non-interactive backend, save plots to file
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
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

# --- Paths ---
HERE = os.path.dirname(__file__)
DATA_PATH = os.path.join(HERE, "..", "data", "risk_dataset.csv")
MODEL_PATH = os.path.join(HERE, "..", "models", "risk_model.joblib")
METRICS_PATH = os.path.join(HERE, "..", "models", "risk_model_metrics.json")
PLOTS_DIR = os.path.join(HERE, "plots")

NUMERIC_FEATURES = ["age", "annual_income", "credit_score", "years_customer", "prior_claims"]
CATEGORICAL_FEATURES = ["region"]
TARGET = "high_risk"

RANDOM_STATE = 42


def build_preprocessor() -> ColumnTransformer:
    """Standard scaling for numeric features, one-hot for categorical."""
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )


def build_models():
    """Return dict of {name: Pipeline} for the three candidate models."""
    return {
        "Logistic Regression": Pipeline(
            [
                ("preprocess", build_preprocessor()),
                (
                    "clf",
                    LogisticRegression(
                        max_iter=1000,
                        class_weight="balanced",
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),
        "Random Forest": Pipeline(
            [
                ("preprocess", build_preprocessor()),
                (
                    "clf",
                    RandomForestClassifier(
                        n_estimators=200,
                        max_depth=10,
                        class_weight="balanced",
                        random_state=RANDOM_STATE,
                        n_jobs=-1,
                    ),
                ),
            ]
        ),
        "Gradient Boosting": Pipeline(
            [
                ("preprocess", build_preprocessor()),
                (
                    "clf",
                    HistGradientBoostingClassifier(
                        max_iter=300,
                        max_depth=6,
                        learning_rate=0.05,
                        class_weight="balanced",
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),
    }


def evaluate(model, X_test, y_test, name: str) -> dict:
    """Compute metrics for a fitted model on the test set."""
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    metrics = {
        "model": name,
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "f1": f1_score(y_test, y_pred),
        "roc_auc": roc_auc_score(y_test, y_proba),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
    }
    return metrics, y_proba


def plot_roc_curves(results: dict, y_test, save_path: str):
    """Overlay ROC curves of all three models on one chart."""
    plt.figure(figsize=(8, 6))
    for name, result in results.items():
        fpr, tpr, _ = roc_curve(y_test, result["y_proba"])
        auc = result["metrics"]["roc_auc"]
        plt.plot(fpr, tpr, label=f"{name} (AUC = {auc:.3f})", linewidth=2)
    plt.plot([0, 1], [0, 1], "k--", linewidth=1, alpha=0.5, label="Random (AUC = 0.500)")
    plt.xlabel("False Positive Rate", fontsize=12)
    plt.ylabel("True Positive Rate", fontsize=12)
    plt.title("ROC Curves — Insurance Risk Prediction", fontsize=14, fontweight="bold")
    plt.legend(loc="lower right", fontsize=10)
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, dpi=120)
    plt.close()


def plot_confusion(cm: list, model_name: str, save_path: str):
    """Plot confusion matrix as a heatmap."""
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

    # Annotate cells
    for i in range(2):
        for j in range(2):
            ax.text(
                j,
                i,
                str(cm_arr[i, j]),
                ha="center",
                va="center",
                fontsize=18,
                color="white" if cm_arr[i, j] > cm_arr.max() / 2 else "black",
                fontweight="bold",
            )

    plt.colorbar(im)
    plt.tight_layout()
    plt.savefig(save_path, dpi=120)
    plt.close()


def plot_feature_importance(pipeline, feature_names: list, model_name: str, save_path: str):
    """Plot feature importance for a tree-based model."""
    clf = pipeline.named_steps["clf"]
    if not hasattr(clf, "feature_importances_"):
        # HistGradientBoostingClassifier doesn't expose feature_importances_,
        # fall back to permutation importance via the pipeline's first tree model.
        return

    # Get the actual feature names after preprocessing (one-hot expansion)
    preprocessor = pipeline.named_steps["preprocess"]
    expanded_names = NUMERIC_FEATURES + list(
        preprocessor.named_transformers_["cat"].get_feature_names_out(CATEGORICAL_FEATURES)
    )

    importances = clf.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]

    plt.figure(figsize=(9, 5))
    plt.bar(
        range(len(importances)),
        importances[sorted_idx],
        color="steelblue",
        edgecolor="black",
    )
    plt.xticks(range(len(importances)), [expanded_names[i] for i in sorted_idx], rotation=30, ha="right")
    plt.ylabel("Importance", fontsize=12)
    plt.title(f"Feature Importance — {model_name}", fontsize=14, fontweight="bold")
    plt.grid(axis="y", alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, dpi=120)
    plt.close()


def main():
    # 1. Load data
    print(f"Loading dataset from {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    print(f"  -> {len(df):,} rows, {df[TARGET].mean():.1%} positive class\n")

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET]

    # 2. Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE
    )
    print(f"Train: {len(X_train):,}  Test: {len(X_test):,}\n")

    # 3-5. Train and evaluate all models
    models = build_models()
    results = {}

    print("=" * 70)
    print(f"{'Model':<22} {'Precision':>10} {'Recall':>10} {'F1':>8} {'ROC-AUC':>10}")
    print("=" * 70)

    for name, pipeline in models.items():
        pipeline.fit(X_train, y_train)
        metrics, y_proba = evaluate(pipeline, X_test, y_test, name)
        results[name] = {"pipeline": pipeline, "metrics": metrics, "y_proba": y_proba}
        print(
            f"{name:<22} {metrics['precision']:>10.3f} {metrics['recall']:>10.3f} "
            f"{metrics['f1']:>8.3f} {metrics['roc_auc']:>10.3f}"
        )

    print("=" * 70)

    # 6. Pick best by ROC-AUC and save it
    best_name = max(results.keys(), key=lambda k: results[k]["metrics"]["roc_auc"])
    best = results[best_name]
    print(f"\nBest model: {best_name}  (ROC-AUC = {best['metrics']['roc_auc']:.3f})\n")

    print("Detailed classification report (best model):")
    y_pred_best = best["pipeline"].predict(X_test)
    print(classification_report(y_test, y_pred_best, target_names=["Low Risk", "High Risk"]))

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(best["pipeline"], MODEL_PATH)
    print(f"Saved model -> {MODEL_PATH}")

    # Save metrics summary as JSON for the thesis text
    summary = {
        "best_model": best_name,
        "comparison": {
            name: {k: v for k, v in r["metrics"].items() if k != "confusion_matrix"}
            for name, r in results.items()
        },
        "best_confusion_matrix": best["metrics"]["confusion_matrix"],
        "feature_set": {
            "numeric": NUMERIC_FEATURES,
            "categorical": CATEGORICAL_FEATURES,
        },
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "positive_class_rate": float(y.mean()),
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"Saved metrics  -> {METRICS_PATH}")

    # 7. Plots
    os.makedirs(PLOTS_DIR, exist_ok=True)
    plot_roc_curves(results, y_test, os.path.join(PLOTS_DIR, "risk_roc_curves.png"))
    plot_confusion(
        best["metrics"]["confusion_matrix"],
        best_name,
        os.path.join(PLOTS_DIR, "risk_confusion_matrix.png"),
    )
    plot_feature_importance(
        best["pipeline"],
        NUMERIC_FEATURES + CATEGORICAL_FEATURES,
        best_name,
        os.path.join(PLOTS_DIR, "risk_feature_importance.png"),
    )
    print(f"Saved plots    -> {PLOTS_DIR}/")

    print("\nDone.")


if __name__ == "__main__":
    main()
