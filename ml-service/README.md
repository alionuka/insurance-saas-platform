# Machine Learning Service

This is the Python FastAPI service for handling ML-related tasks such as risk analysis, fraud detection, and product recommendations for the Insurance SaaS Platform.

## Prerequisites
- Python 3.9+

## Setup & Run

1. Navigate to the ml-service directory:
```bash
cd ml-service
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the development server:
```bash
uvicorn main:app --reload --port 8000
```

The API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).
