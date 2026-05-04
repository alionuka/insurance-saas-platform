from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Literal

app = FastAPI(
    title="Insurance SaaS ML Service",
    description="Mock ML service for risk prediction, fraud detection, and recommendations."
)

# --- Request & Response Models ---

class RiskRequest(BaseModel):
    clientId: str
    age: int
    annualIncome: float
    creditScore: int

class RiskResponse(BaseModel):
    riskScore: float = Field(..., ge=0, le=100)
    riskLevel: Literal["LOW", "MEDIUM", "HIGH"]
    explanation: str

class FraudRequest(BaseModel):
    claimId: str
    amount: float
    claimType: str
    description: str

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

# --- Endpoints ---

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ml-service"}

@app.post("/risk/predict", response_model=RiskResponse)
def predict_risk(request: RiskRequest):
    # Rule-based mock logic
    if request.creditScore >= 750:
        return RiskResponse(
            riskScore=15.0,
            riskLevel="LOW",
            explanation="High credit score indicates low default risk."
        )
    elif request.creditScore >= 600:
        return RiskResponse(
            riskScore=50.0,
            riskLevel="MEDIUM",
            explanation="Average credit score indicates moderate risk."
        )
    else:
        return RiskResponse(
            riskScore=85.0,
            riskLevel="HIGH",
            explanation="Low credit score strongly suggests high risk."
        )

@app.post("/fraud/detect", response_model=FraudResponse)
def detect_fraud(request: FraudRequest):
    # Rule-based mock logic
    suspicious_keywords = ["stolen", "lost", "fire", "unwitnessed", "cash"]
    desc_lower = request.description.lower()
    
    score = 10.0
    if request.amount > 50000:
        score += 40.0
    if any(word in desc_lower for word in suspicious_keywords):
        score += 30.0
        
    flag = "SUSPICIOUS" if score >= 70.0 else "NORMAL"
    explanation = "Flagged due to high claim amount and suspicious keywords." if flag == "SUSPICIOUS" else "Claim appears normal."
    
    return FraudResponse(
        fraudScore=score,
        flag=flag,
        explanation=explanation
    )

@app.post("/recommendations", response_model=RecommendationResponse)
def get_recommendations(request: RecommendationRequest):
    # Rule-based mock logic
    products = ["Basic Health Insurance"]
    
    if "marriage" in request.lifeEvents or "child" in request.lifeEvents:
        products.extend(["Family Health Plan", "Life Insurance"])
    
    if request.age > 45:
        products.append("Retirement Security Plan")
        
    if "new_car" in request.lifeEvents:
        products.append("Comprehensive Auto Insurance")
        
    explanation = f"Recommended {len(products)} products based on age {request.age} and reported life events."
    
    return RecommendationResponse(
        recommendedProducts=list(set(products)),
        explanation=explanation
    )
