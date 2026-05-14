"""
Insurance SaaS ML Service.

FastAPI application exposing risk prediction, fraud detection, and product
recommendation endpoints.

  - Risk prediction: trained scikit-learn classifier (logistic regression
    over standardized numeric + one-hot region features).
  - Fraud detection: trained scikit-learn classifier combining numeric
    claim features with TF-IDF features extracted from the claim description
    (bag-of-words + bigrams).
  - Recommendations: rule-based stub (future ML integration planned).

Models are loaded from disk at startup. If a model file is missing, the
endpoint falls back to a simple rule-based prediction with a clear marker
in the response explanation.
"""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Literal, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# --- Model loading ---

RISK_MODEL_PATH = Path(__file__).parent / "models" / "risk_model.joblib"
FRAUD_MODEL_PATH = Path(__file__).parent / "models" / "fraud_model.joblib"

# Feature columns the trained risk pipeline expects.
RISK_NUMERIC_FEATURES = ["age", "annual_income", "credit_score", "years_customer", "prior_claims"]
RISK_CATEGORICAL_FEATURES = ["region"]

# Feature columns the trained fraud pipeline expects.
FRAUD_NUMERIC_FEATURES = ["amount", "days_since_policy_start", "has_witnesses", "prior_claims_count"]
FRAUD_CATEGORICAL_FEATURES = ["claim_type"]
FRAUD_TEXT_FEATURE = "description"

# Container for loaded models — populated in lifespan startup.
ml_models: dict = {}


def _try_load(label: str, path: Path):
    if path.exists():
        ml_models[label] = joblib.load(path)
        print(f"[ml-service] Loaded {label} model from {path}")
    else:
        ml_models[label] = None
        print(
            f"[ml-service] WARNING: {label} model not found at {path}. "
            f"Run the corresponding training script to create it. "
            "Falling back to rule-based prediction."
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all models once at startup; release on shutdown."""
    _try_load("risk", RISK_MODEL_PATH)
    _try_load("fraud", FRAUD_MODEL_PATH)
    yield
    ml_models.clear()


app = FastAPI(
    title="Insurance SaaS ML Service",
    description=(
        "Risk prediction (trained sklearn classifier), fraud detection (rule-based), "
        "and product recommendations (rule-based) for the Insurance SaaS Platform."
    ),
    version="0.2.0",
    lifespan=lifespan,
)


# --- Request & Response Models ---


class RiskRequest(BaseModel):
    clientId: str
    age: int
    annualIncome: float
    creditScore: int
    # Optional features the trained model can use; sensible defaults applied
    # if the caller does not provide them (preserves backwards compatibility
    # with the previous rule-based API).
    yearsCustomer: Optional[int] = Field(default=5, ge=0, le=80)
    priorClaims: Optional[int] = Field(default=0, ge=0, le=20)
    region: Optional[int] = Field(default=1, ge=0, le=2, description="0=urban, 1=suburban, 2=rural")


class RiskResponse(BaseModel):
    riskScore: float = Field(..., ge=0, le=100)
    riskLevel: Literal["LOW", "MEDIUM", "HIGH"]
    explanation: str


class FraudRequest(BaseModel):
    claimId: str
    amount: float
    claimType: str
    description: str
    # Optional features the trained fraud model uses; defaults preserve
    # backwards compatibility with the previous rule-based API.
    daysSincePolicyStart: Optional[int] = Field(default=180, ge=0, le=10000)
    hasWitnesses: Optional[int] = Field(default=1, ge=0, le=1, description="0=no witnesses, 1=has witnesses")
    priorClaimsCount: Optional[int] = Field(default=0, ge=0, le=20)


class FraudResponse(BaseModel):
    fraudScore: float = Field(..., ge=0, le=100)
    flag: Literal["NORMAL", "SUSPICIOUS"]
    explanation: str


class RecommendationRequest(BaseModel):
    clientId: str
    age: int
    lifeEvents: List[str]


class RecommendationResponse(BaseModel):
    recommendedProducts: List[str]
    explanation: str


# --- Helpers ---


def _risk_level(score: float) -> Literal["LOW", "MEDIUM", "HIGH"]:
    """Bucket a 0-100 risk score into a categorical level."""
    if score < 33:
        return "LOW"
    if score < 66:
        return "MEDIUM"
    return "HIGH"


def _build_explanation(score: float, request: RiskRequest, top_factors: List[str]) -> str:
    """Compose a short, human-readable explanation citing the score and top contributing factors."""
    level = _risk_level(score)
    factor_text = ", ".join(top_factors) if top_factors else "general profile"
    return (
        f"ML model predicts {level} risk ({score:.0f}/100) based on {factor_text}. "
        "Factors with the largest influence: credit score, prior claims history, and age bracket."
    )


def _identify_top_factors(request: RiskRequest) -> List[str]:
    """Heuristic — surface up to 2 features whose values lean toward the high-risk side, used for the textual explanation."""
    flags = []
    if request.creditScore < 600:
        flags.append("low credit score")
    elif request.creditScore > 750:
        flags.append("strong credit score")
    if request.priorClaims and request.priorClaims >= 2:
        flags.append(f"{request.priorClaims} prior claims")
    if request.age < 25:
        flags.append("young driver bracket")
    elif request.age > 65:
        flags.append("senior bracket")
    return flags[:2]


def _rule_based_risk_fallback(request: RiskRequest) -> RiskResponse:
    """Used only when the trained model is missing on disk."""
    if request.creditScore >= 750:
        return RiskResponse(
            riskScore=15.0, riskLevel="LOW",
            explanation="Rule-based fallback: high credit score indicates low risk.",
        )
    if request.creditScore >= 600:
        return RiskResponse(
            riskScore=50.0, riskLevel="MEDIUM",
            explanation="Rule-based fallback: average credit score indicates moderate risk.",
        )
    return RiskResponse(
        riskScore=85.0, riskLevel="HIGH",
        explanation="Rule-based fallback: low credit score suggests high risk.",
    )


# --- Endpoints ---


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "ml-service",
        "version": "0.3.0",
        "risk_model_loaded": ml_models.get("risk") is not None,
        "fraud_model_loaded": ml_models.get("fraud") is not None,
    }


@app.post("/risk/predict", response_model=RiskResponse)
def predict_risk(request: RiskRequest):
    model = ml_models.get("risk")

    if model is None:
        return _rule_based_risk_fallback(request)

    # Build a single-row DataFrame matching the trained pipeline's feature schema.
    row = pd.DataFrame(
        [{
            "age": request.age,
            "annual_income": request.annualIncome,
            "credit_score": request.creditScore,
            "years_customer": request.yearsCustomer,
            "prior_claims": request.priorClaims,
            "region": request.region,
        }],
        columns=NUMERIC_FEATURES + CATEGORICAL_FEATURES,
    )

    try:
        proba_high_risk = float(model.predict_proba(row)[0, 1])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {exc}")

    score = round(proba_high_risk * 100, 1)
    level = _risk_level(score)
    explanation = _build_explanation(score, request, _identify_top_factors(request))

    return RiskResponse(riskScore=score, riskLevel=level, explanation=explanation)


def _rule_based_fraud_fallback(request: FraudRequest) -> FraudResponse:
    """Used only when the trained fraud model is missing on disk."""
    suspicious_keywords = ["stolen", "lost", "fire", "unwitnessed", "cash"]
    desc_lower = request.description.lower()

    score = 10.0
    if request.amount > 50000:
        score += 40.0
    if any(word in desc_lower for word in suspicious_keywords):
        score += 30.0

    flag = "SUSPICIOUS" if score >= 70.0 else "NORMAL"
    return FraudResponse(
        fraudScore=score, flag=flag,
        explanation=f"Rule-based fallback: {'high amount + suspicious keywords' if flag == 'SUSPICIOUS' else 'no strong signal'}.",
    )


def _build_fraud_explanation(score: float, flag: str, request: FraudRequest) -> str:
    """Compose a human-readable explanation citing key contributing signals."""
    signals = []
    if request.amount > 30000:
        signals.append(f"high amount (${request.amount:,.0f})")
    if request.daysSincePolicyStart is not None and request.daysSincePolicyStart < 30:
        signals.append(f"filed only {request.daysSincePolicyStart} days after policy start")
    if request.hasWitnesses == 0:
        signals.append("no witnesses")
    if request.priorClaimsCount and request.priorClaimsCount >= 2:
        signals.append(f"{request.priorClaimsCount} prior claims")

    suspicious_keywords = ["stolen", "lost", "fire", "unwitnessed", "cash", "no witnesses"]
    if any(kw in request.description.lower() for kw in suspicious_keywords):
        signals.append("suspicious keywords in description")

    if signals:
        signal_text = "; ".join(signals)
    else:
        signal_text = "no individual feature stands out"

    return f"ML model classifies as {flag} (fraud score {score:.0f}/100). Notable signals: {signal_text}."


@app.post("/fraud/detect", response_model=FraudResponse)
def detect_fraud(request: FraudRequest):
    model = ml_models.get("fraud")

    if model is None:
        return _rule_based_fraud_fallback(request)

    row = pd.DataFrame(
        [{
            "amount": request.amount,
            "days_since_policy_start": request.daysSincePolicyStart,
            "has_witnesses": request.hasWitnesses,
            "prior_claims_count": request.priorClaimsCount,
            "claim_type": request.claimType,
            "description": request.description,
        }],
        columns=FRAUD_NUMERIC_FEATURES + FRAUD_CATEGORICAL_FEATURES + [FRAUD_TEXT_FEATURE],
    )

    try:
        proba_fraud = float(model.predict_proba(row)[0, 1])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Fraud model inference failed: {exc}")

    score = round(proba_fraud * 100, 1)
    # Decision threshold: above 50% probability => SUSPICIOUS.
    # Tunable; lower threshold catches more fraud at cost of more false positives.
    flag = "SUSPICIOUS" if score >= 50 else "NORMAL"
    explanation = _build_fraud_explanation(score, flag, request)

    return FraudResponse(fraudScore=score, flag=flag, explanation=explanation)


@app.post("/recommendations", response_model=RecommendationResponse)
def get_recommendations(request: RecommendationRequest):
    # Rule-based stub.
    products = ["Basic Health Insurance"]

    if "marriage" in request.lifeEvents or "child" in request.lifeEvents:
        products.extend(["Family Health Plan", "Life Insurance"])

    if request.age > 45:
        products.append("Retirement Security Plan")

    if "new_car" in request.lifeEvents:
        products.append("Comprehensive Auto Insurance")

    explanation = (
        f"Recommended {len(products)} products based on age {request.age} "
        f"and reported life events."
    )

    return RecommendationResponse(
        recommendedProducts=list(set(products)),
        explanation=explanation,
    )
