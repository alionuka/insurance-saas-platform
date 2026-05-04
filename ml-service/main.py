from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

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
    riskScore: float
    riskLevel: str
    explanation: str

class FraudRequest(BaseModel):
    claimId: str
    amount: float
    claimType: str
    description: str

class FraudResponse(BaseModel):
    fraudScore: float
    flag: bool
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
            riskScore=0.15,
            riskLevel="Low",
            explanation="High credit score indicates low default risk."
        )
    elif request.creditScore >= 600:
        return RiskResponse(
            riskScore=0.50,
            riskLevel="Medium",
            explanation="Average credit score indicates moderate risk."
        )
    else:
        return RiskResponse(
            riskScore=0.85,
            riskLevel="High",
            explanation="Low credit score strongly suggests high risk."
        )

@app.post("/fraud/detect", response_model=FraudResponse)
def detect_fraud(request: FraudRequest):
    # Rule-based mock logic
    suspicious_keywords = ["stolen", "lost", "fire", "unwitnessed", "cash"]
    desc_lower = request.description.lower()
    
    score = 0.1
    if request.amount > 50000:
        score += 0.4
    if any(word in desc_lower for word in suspicious_keywords):
        score += 0.3
        
    flag = score >= 0.7
    explanation = "Flagged due to high claim amount and suspicious keywords." if flag else "Claim appears normal."
    
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
