# Clean Stream - AI-Powered Data Cleaning System
## Implementation Guide (Without n8n)

---

## 📋 Overview

This document outlines the implementation of a three-tier architecture for AI-powered data cleaning:

- **Next.js Frontend** - User interface (not implemented in this guide)
- **Spring Boot Backend** - File management, multi-tenant orchestration
- **FastAPI AI Engine** - RAG-based LLM for data cleaning suggestions
- **PostgreSQL + Embeddings** - Vector storage for RAG retrieval

---

## 🏗️ Architecture

### 1. **Workflow: Dataset Upload → Row Processing → AI Cleaning**

```
User Upload (Next.js)
        ↓
Spring Boot Stores File
        ↓
Spring Boot Reads Rows
        ↓
FastAPI /process-row (for each row)
        ├─ Generate Embedding
        ├─ Retrieve Similar Context (RAG)
        ├─ Call LLM with Context
        └─ Store Results in DB
        ↓
Spring Boot Returns Cleaning Suggestions
        ↓
Next.js Displays Results
```

---

## 🚀 FastAPI Setup

### Key Features
- **Online LLM**: Uses HuggingFace Inference API (no local model download after initial setup)
- **RAG System**: Stores and retrieves similar row embeddings for context
- **Cosine Similarity**: Computes similarity between embeddings using NumPy
- **Multi-tenant**: Each tenant's embeddings isolated by `tenant_id`

### Files Implemented

- **`llm.py`** - LLM API integration with structured prompt
- **`embeddings.py`** - Sentence-transformers for embedding generation
- **`rag.py`** - RAG retrieval using cosine similarity
- **`cleaning.py`** - Row processing orchestration
- **`database.py`** - PostgreSQL connection and session management
- **`models.py`** - SQLAlchemy ORM models with ARRAY type (replaces pgvector)
- **`main.py`** - FastAPI server with `/process-row` endpoint
- **`config.py`** - Configuration from `.env` file

### FastAPI Endpoints

#### 1. Process Single Row
```http
POST /process-row
Content-Type: application/json

{
  "tenantId": "tenant-123",
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "row": {
    "name": "John Do",
    "email": "john.example.com",
    "age": "invalid"
  }
}
```

**Response:**
```json
{
  "tenantId": "tenant-123",
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "result": {
    "id": 1,
    "status": "processed",
    "suggestion": {
      "field": "email",
      "issue_type": "invalid_format",
      "suggested_fix": "Fix: john@example.com",
      "confidence": 0.95,
      "notes": "Missing '@' and proper domain"
    }
  }
}
```

#### 2. Health Check
```http
GET /health
```

#### 3. API Info
```http
GET /
```

---

## 🔌 Spring Boot Integration

### New Services & Controllers

#### 1. **FastAPIService** (`src/main/java/.../service/FastAPIService.java`)
- Handles HTTP requests to FastAPI
- Processes single rows
- Health checks
- Configurable base URL

```java
fastAPIService.processRow(tenantId, datasetId, rowData);
```

#### 2. **AICleaningController** (`src/main/java/.../controller/AICleaningController.java`)
- **POST /api/ai-cleaning/process-row** - Process single row
- **POST /api/ai-cleaning/process-batch** - Process multiple rows
- **GET /api/ai-cleaning/health** - Health status
- **GET /api/ai-cleaning/info** - Service info

### Configuration

**`application.yaml`**:
```yaml
fastapi:
  base-url: http://localhost:8000
```

---

## 🛠️ Implementation Steps

### Step 1: Setup FastAPI Environment

```bash
cd AI_Engine
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r llm/requirements.txt
```

### Step 2: Configure Environment Variables

**`AI_Engine/llm/.env`**:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clean_stream
DB_USER=postgres
DB_PASSWORD=your_password

HF_MODEL_NAME=TinyLlama/TinyLlama-1.1B-Chat-v1.0
HF_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
HF_KEY=your_huggingface_token
```

### Step 3: Start FastAPI Server

```bash
cd AI_Engine/llm
uvicorn main:app --reload --port 8000
```

### Step 4: Update Spring Boot Configuration

Ensure `application.yaml` has:
```yaml
fastapi:
  base-url: http://localhost:8000
```

### Step 5: Test Integration

**From Spring Boot**:
```bash
curl -X POST http://localhost:8080/api/ai-cleaning/process-row \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-1",
    "datasetId": "550e8400-e29b-41d4-a716-446655440000",
    "row": {"name": "John", "email": "invalid"}
  }'
```

---

## 📊 Database Schema

### tenant_embeddings
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-increment ID |
| tenant_id | VARCHAR(255) NOT NULL | Tenant identifier |
| content | VARCHAR NOT NULL | Text content of row |
| embedding | ARRAY(Float) NOT NULL | 384-dim embedding vector |
| created_at | TIMESTAMP | Creation timestamp |

**Index**: `idx_tenant_embeddings_tenant` on `tenant_id`

### cleaning_results
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-increment ID |
| tenant_id | VARCHAR(255) NOT NULL | Tenant identifier |
| dataset_id | UUID NOT NULL | Dataset reference |
| row_data | JSON NOT NULL | Original row |
| ai_suggestion | JSON NOT NULL | LLM output |
| confidence | FLOAT | Confidence score |
| status | VARCHAR(50) | Processing status |
| created_at | TIMESTAMP | Creation timestamp |

**Index**: `idx_cleaning_results_tenant_dataset` on `(tenant_id, dataset_id)`

---

## 🔐 Multi-tenant Isolation

### Tenant Separation
1. **Frontend**: User selects tenant in UI
2. **Spring Boot**: Passes `tenantId` in request body
3. **FastAPI**: Filters embeddings by `tenant_id` in RAG queries
4. **PostgreSQL**: Queries isolated using `WHERE tenant_id = ?`

### Example RAG Query
```python
# Only retrieve similar examples for this tenant
session.query(TenantEmbedding).filter(
    TenantEmbedding.tenant_id == tenant_id
)
```

---

## 🧠 RAG (Retrieval-Augmented Generation) Flow

1. **New row arrives**: `{"name": "John Do", "email": "john.example"}`
2. **Generate embedding**: 384-dimensional vector using `all-MiniLM-L6-v2`
3. **Store embedding**: Save in `tenant_embeddings` for future use
4. **Retrieve context**: Find top 3 most similar rows for this tenant
5. **Build context**: Format similar examples as context
6. **Call LLM**: Send row + context to HuggingFace Inference API
7. **Parse response**: Extract JSON cleaning suggestions
8. **Store result**: Save in `cleaning_results` table

### Example Context Built by RAG

```
## Context (similar previous rows):
{"name": "Jane Smith", "email": "jane@example.com", "age": 28}
---
{"name": "Bob Jones", "email": "bob@example.com", "age": 35}
---
{"name": "Alice Brown", "email": "alice@example.com", "age": 42}

## Row to Clean:
{"name": "John Do", "email": "john.example", "age": "invalid"}
```

---

## 🔄 Batch Processing (Spring Boot)

For large datasets, use batch endpoint:

```http
POST /api/ai-cleaning/process-batch
Content-Type: application/json

{
  "tenantId": "tenant-123",
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "rows": [
    {"name": "John Do", "email": "john.example.com"},
    {"name": "Jane Smith", "email": "jane@example.com"},
    {"name": "Bob Jones", "email": "bob.example.com"}
  ]
}
```

**Response**:
```json
{
  "tenantId": "tenant-123",
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "totalRows": 3,
  "processedCount": 3,
  "errorCount": 0,
  "results": [
    { "id": 1, "status": "processed", "suggestion": {...} },
    { "id": 2, "status": "processed", "suggestion": {...} },
    { "id": 3, "status": "processed", "suggestion": {...} }
  ]
}
```

---

## 📝 Error Handling

### FastAPI
- Validates tenant_id and dataset_id
- Logs all processing steps
- Returns JSON with error field if LLM fails
- Gracefully handles missing RAG context

### Spring Boot
- Validates request payloads
- Retries on transient failures (optional)
- Returns 400 for bad requests
- Returns 500 for server errors
- Includes error messages in response

---

## 🔧 Advanced Configuration

### Customize LLM Model
Edit `AI_Engine/llm/.env`:
```env
HF_MODEL_NAME=mistral-7b-instruct
# Note: Requires HF_KEY to be set for gated models
```

### Adjust RAG Top-K
Edit `AI_Engine/llm/rag.py`:
```python
def retrieve_similar(tenant_id: str, embedding: List[float], top_k: int = 5):
    # top_k=5 retrieves 5 most similar examples
```

### Batch Size for Batch Processing
Edit Spring Boot service:
```java
for (Map<String, Object> row : rows) {
    // Process individual rows
    // Can add batching logic here (e.g., process 100 at a time)
}
```

---

## 🧪 Testing

### Test FastAPI Directly
```bash
curl -X POST http://localhost:8000/process-row \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test-tenant",
    "datasetId": "550e8400-e29b-41d4-a716-446655440000",
    "row": {"name": "Test User", "email": "test@example.com"}
  }'
```

### Test Spring Boot Integration
```bash
curl -X POST http://localhost:8080/api/ai-cleaning/process-row \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test-tenant",
    "datasetId": "550e8400-e29b-41d4-a716-446655440000",
    "row": {"name": "Test User", "email": "invalid"}
  }'
```

### Test Health
```bash
# FastAPI
curl http://localhost:8000/health

# Spring Boot
curl http://localhost:8080/api/ai-cleaning/health
```

---

## 🚀 Production Deployment

### Key Considerations
1. **Secret Management**: Store HF_KEY in environment variables, not .env
2. **Database Migration**: Use PostgreSQL with proper backups
3. **Load Balancing**: FastAPI can scale horizontally
4. **Monitoring**: Log all processing steps
5. **Rate Limiting**: Implement rate limits on Spring Boot endpoints

### Docker Setup (Optional)
```dockerfile
# FastAPI
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY llm/ .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 📚 Additional Resources

- **HuggingFace Inference API**: https://huggingface.co/docs/api-inference
- **Sentence-Transformers**: https://www.sbert.net/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Spring Boot REST**: https://spring.io/guides/gs/rest-service/

---

## 🎯 Next Steps

1. ✅ Implement FastAPI backend (DONE)
2. ✅ Add Spring Boot integration service (DONE)
3. ✅ Create AI cleaning controller (DONE)
4. ⬜ Implement Next.js frontend (UI)
5. ⬜ Add batch processing optimization
6. ⬜ Implement caching for frequent rows
7. ⬜ Add WebSocket for real-time updates
8. ⬜ Deploy to production

---

**Last Updated**: February 14, 2026
