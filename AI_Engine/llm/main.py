from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from cleaning import process_row
from async_cleaning import process_row_async
from dataset_processor import get_processing_service
from database import init_db
from llm import close_http_client
from pydantic import BaseModel
from typing import Dict, Any, List
from uuid import UUID
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Clean Stream AI Engine",
    description="FastAPI backend for AI-powered data cleaning with RAG and LLM integration",
    version="2.0.0"
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

class DatasetPayload(BaseModel):
    tenantId: str
    datasetId: str
    rows: List[Dict[str, Any]]
    callbackUrl: str = None

@app.on_event("startup")
def startup_event():
    """Initialize database on startup"""
    logger.info("Initializing database...")
    init_db()
    logger.info("Database initialized successfully")
    logger.info("FastAPI async engine ready")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down FastAPI")
    await close_http_client()

@app.post("/process-row")
def process_row_endpoint(payload: RowPayload):
    """
    Process a single data row for cleaning suggestions (SYNCHRONOUS).
    Kept for backward compatibility with existing integrations.
    
    For new integrations, use /process-row-async instead.
    
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

@app.post("/process-row-async")
async def process_row_async_endpoint(payload: RowPayload):
    """
    Process a single data row asynchronously for cleaning suggestions.
    Non-blocking async endpoint using httpx and thread pools.
    
    Recommended for new integrations and high-throughput scenarios.
    
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
        logger.info(f"Processing row async for tenant: {payload.tenantId}, dataset: {payload.datasetId}")
        dataset_id = UUID(payload.datasetId)
        result = await process_row_async(payload.tenantId, dataset_id, payload.row)
        return {
            "tenantId": payload.tenantId,
            "datasetId": payload.datasetId,
            "result": result
        }
    except ValueError as e:
        logger.error(f"Invalid dataset ID format: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid dataset ID format: {str(e)}")
    except Exception as e:
        logger.error(f"Error processing row async: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing row: {str(e)}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    
    Returns:
        {"status": "healthy"} if service is running
    """
    return {"status": "healthy", "version": "2.0.0"}

@app.get("/")
async def root():
    """API documentation root"""
    return {
        "service": "Clean Stream AI Engine",
        "version": "2.0.0",
        "description": "Async-first AI data cleaning with Gemini, RAG, and streaming support",
        "endpoints": {
            "POST /process-row": "Process a single row (sync, backward compatible)",
            "POST /process-row-async": "Process a single row (async, non-blocking)",
            "POST /process-dataset": "Process entire dataset with background tasks and streaming",
            "GET /health": "Health check with version info",
            "GET /docs": "Interactive API documentation (Swagger UI)",
            "GET /redoc": "Alternative API documentation (ReDoc)"
        }
    }

@app.post("/process-dataset")
async def process_dataset_endpoint(payload: DatasetPayload):
    """
    Process an entire dataset asynchronously with row-by-row streaming.
    
    This endpoint:
    1. Returns immediately with status "processing"
    2. Starts background async task to process all rows
    3. For each cleaned row, sends HTTP callback to Spring Boot
    4. Spring Boot broadcasts to WebSocket clients in real-time
    
    Args:
        tenantId: Tenant identifier for multi-tenant isolation
        datasetId: UUID of the dataset
        rows: List of data rows to process
        callbackUrl: Optional custom callback URL (defaults to Spring Boot)
    
    Returns:
        {
          "status": "processing",
          "dataset_id": str,
          "total_rows": int,
          "message": "Dataset processing started in background"
        }
    """
    try:
        logger.info(
            f"Dataset processing requested - tenant: {payload.tenantId}, "
            f"dataset: {payload.datasetId}, rows: {len(payload.rows)}"
        )
        
        dataset_id = UUID(payload.datasetId)
        processing_service = get_processing_service()
        
        # Start background processing (returns immediately)
        result = await processing_service.process_dataset(
            payload.tenantId,
            dataset_id,
            payload.rows
        )
        
        return result
        
    except ValueError as e:
        logger.error(f"Invalid dataset ID format: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid dataset ID format: {str(e)}")
    except Exception as e:
        logger.error(f"Error starting dataset processing: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error starting dataset processing: {str(e)}")
