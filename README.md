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

### 1. **Complete End-to-End Workflow**

```
FRONTEND (Next.js)
        ↓
        1. User uploads CSV/XLSX file
        2. File sent to Spring Boot POST /api/files/upload
        3. Establish WebSocket connection (ws://localhost:8080/ws/dataset/{datasetId})
        ↓
BACKEND (Spring Boot)
        ↓
        4. Validate file & extract rows
        5. Store file metadata in MongoDB
        6. Trigger batch processing via POST /api/process-dataset
        ↓
        7. For each row in dataset:
           a. Send HTTP POST to FastAPI /process-row
           b. Wait for cleaning suggestions
           c. Store result in PostgreSQL
           d. Broadcast via WebSocket to all connected clients
        ↓
AI ENGINE (FastAPI)
        ↓
        8. Receive row data
        9. Generate embedding (Sentence-Transformers)
        10. Retrieve similar examples via RAG (cosine similarity)
        11. Call LLM with context to generate cleaning suggestions
        12. Store embedding in tenant_embeddings table
        13. Return cleaned row + suggestions to Spring Boot
        ↓
BACKEND BROADCASTS
        ↓
        14. WebSocket message types:
            - "row": Cleaned row received (index, cleanedRow, confidence)
            - "progress": Processing update (processed, total, failed, percentage)
            - "completed": All rows processed (final stats)
            - "error": Processing failed (error message)
        ↓
FRONTEND RECEIVES
        ↓
        15. useDatasetWebSocket hook receives messages
        16. Update state with:
            - Table with cleaned rows
            - Progress bar / percentage
            - Real-time statistics
            - Error notifications
        ↓
FINAL STATE
        ↓
        17. User can download cleaned dataset or review suggestions
```

---

## � Real-Time WebSocket Communication

### Frontend → Backend
- **Endpoint**: `ws://localhost:8080/ws/dataset/{datasetId}`
- **Authentication**: JWT token in URL or headers
- **Connection Flow**:
  1. Next.js establishes WebSocket connection after file upload
  2. Sends keep-alive ping every 30 seconds
  3. Listens for incoming messages

### Backend → Frontend Messages

#### 1. Connection Established
```json
{
  "type": "connected",
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Connected to dataset stream"
}
```

#### 2. Row Processed
```json
{
  "type": "row",
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "rowIndex": 0,
  "cleanedRow": {
    "name": "John Doe",
    "email": "john@example.com",
    "age": 25
  },
  "confidence": 0.95,
  "timestamp": 1708854000000
}
```

#### 3. Processing Progress
```json
{
  "type": "progress",
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "processedRows": 50,
  "totalRows": 1000,
  "failedRows": 2,
  "progress": 5,
  "timestamp": 1708854000000
}
```

#### 4. Processing Completed
```json
{
  "type": "completed",
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Processing complete",
  "processedRows": 1000,
  "totalRows": 1000,
  "failedRows": 2,
  "timestamp": 1708854000000
}
```

#### 5. Error Occurred
```json
{
  "type": "error",
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "error": "Failed to process row 15: Invalid email format",
  "timestamp": 1708854000000
}
```

### Frontend Implementation
```typescript
// useDatasetWebSocket hook usage
const { isConnected, stats, rows, errors } = useDatasetWebSocket({
  datasetId: "550e8400-e29b-41d4-a716-446655440000",
  tenantId: "tenant-123",
  onRowReceived: (row) => {
    // Update table with cleaned row
    setRows(prev => [...prev, row]);
  },
  onProgressUpdate: (progress, processed, total, failed) => {
    // Update progress bar
    setProgress(progress);
    setStats({ processed, total, failed });
  },
  onCompleted: (stats) => {
    // Show completion message
    showNotification("Processing complete!");
  },
  onError: (error) => {
    // Show error notification
    showErrorNotification(error);
  }
});
```

---

## �🚀 FastAPI Setup

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

### File Upload & Processing

#### 1. **Upload Endpoint** 
```http
POST /api/files/upload
Content-Type: multipart/form-data

file: <CSV or XLSX file>
datasetId: "550e8400-e29b-41d4-a716-446655440000"
tenantId: "tenant-123"
```

**Response:**
```json
{
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "fileName": "customers.csv",
  "rowCount": 1000,
  "status": "uploaded"
}
```

#### 2. **Process Dataset Endpoint**
```http
POST /api/process-dataset
Content-Type: application/json

{
  "datasetId": "550e8400-e29b-41d4-a716-446655440000",
  "tenantId": "tenant-123"
}
```

**Flow:**
1. Spring Boot reads rows from MongoDB
2. For each row, calls FastAPI POST /process-row
3. Receives cleaned row + suggestions
4. Broadcasts result via WebSocket to all connected clients
5. Returns final statistics

#### 3. **WebSocket Endpoint**
```
ws://localhost:8080/ws/dataset/{datasetId}?token={jwtToken}
```

**Connection Lifecycle:**
- Client connects → receive "connected" message
- Client receives "row" messages as they're processed
- Client receives periodic "progress" messages
- Client receives "completed" message when done
- Client receives "error" messages if failures occur

### Services & Controllers

#### 1. **WebSocketBroadcastService**
- Broadcasts cleaned rows to all dataset subscribers
- Sends progress updates
- Notifies on processing completion
- Sends error messages
- Methods:
  - `broadcastCleanedRow(datasetId, rowIndex, cleanedRow, confidence)`
  - `broadcastProgress(datasetId, processedRows, totalRows, failedRows)`
  - `broadcastCompleted(datasetId, stats)`
  - `broadcastError(datasetId, error)`

#### 2. **FastAPIService**
- Handles HTTP requests to FastAPI
- `processRow(tenantId, datasetId, rowData)` - Process single row
- Health checks
- Error handling & retries
- Configurable base URL from `application.yaml`

#### 3. **DatasetController**
- **POST /api/files/upload** - Upload file
- **POST /api/process-dataset** - Start batch processing
- **GET /api/datasets/{datasetId}** - Get dataset info
- **GET /api/datasets/{datasetId}/results** - Get all results for dataset

#### 4. **AICleaningController**
- **POST /api/ai-cleaning/process-row** - Process single row
- **POST /api/ai-cleaning/process-batch** - Process multiple rows
- **GET /api/ai-cleaning/health** - Health status
- **GET /api/ai-cleaning/info** - Service info

### Configuration

**`application.yaml`** (Spring Boot):
```yaml
fastapi:
  base-url: http://localhost:8000

websocket:
  max-idle-time: 3600000
  allowed-origins: http://localhost:3000

spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/clean_stream
  datasource:
    url: jdbc:postgresql://localhost:5432/clean_stream
    username: postgres
    password: your_password
```

---

## 🛠️ Full Stack Setup & Running

### Prerequisites
- **Node.js 18+** (for Next.js frontend)
- **Java 21+** (for Spring Boot)
- **Python 3.11+** (for FastAPI)
- **PostgreSQL 14+** (for embeddings & results)
- **MongoDB 6+** (for file storage)
- **HuggingFace API Key** (for LLM calls)

### Implementation Steps

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

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
HF_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

### Step 3: Start FastAPI Server

```bash
cd AI_Engine/llm
uvicorn main:app --reload --port 8000
```

Output should show:
```
Uvicorn running on http://127.0.0.1:8000
Application startup complete
```

### Step 4: Setup & Run Spring Boot Backend

```bash
cd back_clean_stream

# Build
mvn clean install

# Run (from IDE or command line)
mvn spring-boot:run
```

Default runs on: `http://localhost:8080`

### Step 5: Setup & Run Next.js Frontend

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

Default runs on: `http://localhost:3000`

### Step 6: Verify All Services Running

```bash
# FastAPI health
curl http://localhost:8000/health

# Spring Boot health
curl http://localhost:8080/actuator/health

# Frontend (open in browser)
http://localhost:3000
```

### Step 7: Test Full Data Cleaning Flow

1. **Open Frontend**: Go to `http://localhost:3000/dashboard/upload`
2. **Upload File**: Select a CSV or XLSX file
3. **Watch Progress**: Real-time updates via WebSocket
4. **Review Results**: See cleaned rows and statistics
5. **Download**: Export the cleaned dataset

---

## 📱 Frontend Components

### 1. **FileUploadWithProgress Component**
- Drag-and-drop file upload
- Progress bar for file transfer
- File validation (CSV, XLSX)
- Error handling

### 2. **RealtimeProcessingDisplay Component**
- Shows live progress percentage
- Displays processed/total/failed row counts
- Updates in real-time via WebSocket
- Shows processing speed (rows/sec)

### 3. **ProcessedRowsTable Component**
- Displays all cleaned rows
- Shows confidence scores
- Sortable columns
- Pagination support

### 4. **ProcessingDetailsModal Component**
- Shows detailed cleaning suggestions
- Original vs cleaned values
- Confidence scores
- AI reasoning

### Example Frontend Flow
```typescript
// 1. User uploads file
const handleFileUpload = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('datasetId', generateUUID());
  await api.post('/api/files/upload', formData);
  //  datasetId stored in context
};

// 2. Frontend connects to WebSocket
const { isConnected, stats } = useDatasetWebSocket({
  datasetId,
  onRowReceived: (row) => setRows(prev => [...prev, row]),
  onProgressUpdate: (pct, processed, total, failed) => 
    setStats({ percentage: pct, processed, total, failed })
});

// 3. Real-time UI updates
return (
  <>
    <RealtimeProcessingDisplay stats={stats} />
    <ProcessedRowsTable rows={rows} />
  </>
);
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

## 🧪 Testing the Complete Flow

### 1. Test FastAPI Directly (Optional)
```bash
# Health check
curl http://localhost:8000/health

# Process a single row
curl -X POST http://localhost:8000/process-row \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test-tenant",
    "datasetId": "550e8400-e29b-41d4-a716-446655440000",
    "row": {"name": "John Do", "email": "john.example", "age": "invalid"}
  }'
```

### 2. Test Spring Boot File Upload Endpoint
```bash
# Upload a CSV file
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@customers.csv" \
  -F "datasetId=550e8400-e29b-41d4-a716-446655440000" \
  -F "tenantId=tenant-123"
```

### 3. Test Real-Time Processing via Frontend

**Manual WebSocket Test** (using websocat or similar):
```bash
# Connect to WebSocket
websocat "ws://localhost:8080/ws/dataset/550e8400-e29b-41d4-a716-446655440000"

# You should receive messages like:
# {"type":"connected","datasetId":"550e8400-e29b-41d4-a716-446655440000"}
# {"type":"row","rowIndex":0,"cleanedRow":{...},"confidence":0.95}
# {"type":"progress","processedRows":10,"totalRows":100,"progress":10}
```

### 4. End-to-End UI Test
1. Open `http://localhost:3000/dashboard/upload`
2. Click "Upload File" or drag-and-drop a CSV
3. Watch the:
   - File upload progress
   - Real-time row processing
   - Live statistics update
   - Final completion message
4. Click on a row to see detailed cleaning suggestions
5. Download cleaned dataset

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

## 🎯 Next Steps & Improvements

1. ✅ FastAPI backend with RAG + LLM (DONE)
2. ✅ Spring Boot integration service (DONE)
3. ✅ WebSocket real-time broadcasting (DONE)
4. ✅ Next.js frontend with live updates (DONE)
5. ⬜ Add export cleaned dataset to CSV/XLSX
6. ⬜ Add confidence threshold filtering
7. ⬜ Implement caching for frequently processed rows
8. ⬜ Add batch retry for failed rows
9. ⬜ Implement rate limiting on FastAPI
10. ⬜ Add audit logging for all cleaning operations
11. ⬜ Deploy with Docker Compose
12. ⬜ Setup monitoring & alerting (Prometheus/Grafana)

---

**Last Updated**: February 24, 2026
