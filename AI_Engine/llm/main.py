from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from cleaning import process_row
from database import init_db
from pydantic import BaseModel
from typing import Dict, Any
from uuid import UUID
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Clean Stream AI Engine",
    description="FastAPI backend for AI-powered data cleaning with RAG and LLM integration",
    version="1.0.0"
)

# Add CORS middleware for cross-origin requests from Spring Boot
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RowPayload(BaseModel):
    tenantId: str
    datasetId: str
    row: Dict[str, Any]

@app.on_event("startup")
def startup_event():
    """Initialize database on startup"""
    logger.info("Initializing database...")
    init_db()
    logger.info("Database initialized successfully")

@app.post("/process-row")
def process_row_endpoint(payload: RowPayload):
    """
    Process a single data row for cleaning suggestions.
    
    Flow:
    1. Generate embedding for the row
    2. Retrieve similar examples from database (RAG)
    3. Call LLM API with context to generate cleaning suggestions
    4. Store results in database
    
    Args:
        tenantId: Tenant identifier for multi-tenant isolation
        datasetId: UUID of the dataset
        row: Dictionary containing the data row to process
    
    Returns:
        {
          "tenantId": str,
          "datasetId": str,
          "result": {
            "id": int,
            "status": str,
            "suggestion": {
              "field": str,
              "issue_type": str,
              "suggested_fix": str,
              "confidence": float
            }
          }
        }
    """
    try:
        logger.info(f"Processing row for tenant: {payload.tenantId}, dataset: {payload.datasetId}")
        dataset_id = UUID(payload.datasetId)
        result = process_row(payload.tenantId, dataset_id, payload.row)
        return {
            "tenantId": payload.tenantId,
            "datasetId": payload.datasetId,
            "result": result
        }
    except ValueError as e:
        logger.error(f"Invalid dataset ID format: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid dataset ID format: {str(e)}")
    except Exception as e:
        logger.error(f"Error processing row: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing row: {str(e)}")

@app.get("/health")
def health_check():
    """
    Health check endpoint for monitoring.
    
    Returns:
        {"status": "healthy"} if service is running
    """
    return {"status": "healthy"}

@app.get("/")
def root():
    """API documentation root"""
    return {
        "service": "Clean Stream AI Engine",
        "version": "1.0.0",
        "endpoints": {
            "POST /process-row": "Process a single data row",
            "GET /health": "Health check",
            "GET /docs": "Interactive API documentation (Swagger UI)",
            "GET /redoc": "Alternative API documentation (ReDoc)"
        }
    }
