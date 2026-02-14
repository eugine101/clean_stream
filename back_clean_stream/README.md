# Clean Data Backend - Complete Setup

A Spring Boot backend application for uploading CSV/JSON files to MongoDB and sending them to n8n for data cleaning via webhook.

## 🚀 Quick Start (5 minutes)

### Prerequisites
- MongoDB running on `localhost:27017`
- Java 17+

### Setup

```bash
# 1. Navigate to project
cd "c:\Users\eugin\OneDrive\Desktop\Year4 Project\server"

# 2. Initialize MongoDB
mongosh
# Run initialization commands (see QUICK_START.md)

# 3. Build
./mvnw clean install

# 4. Run
./mvnw spring-boot:run

# 5. Test
curl -F "file=@sample_data.csv" http://localhost:8080/api/files/upload
```

---

## 📋 Architecture Overview

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ (CSV/JSON)
       ▼
┌─────────────────────────────────┐
│  Spring Boot Backend             │
│  - FileUploadController          │
│  - N8nWebhookService             │
│  - FileProcessingService         │
└──────────┬──────────────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌────────┐    ┌──────────────┐
│MongoDB │    │ N8n Webhook  │
│- Input │    │   (Process)  │
│- Output│    │ (clean-data) │
└────────┘    └──────────────┘
```

---

## 📁 Project Structure

```
src/main/java/com/server/server/
├── controller/
│   └── FileUploadController.java       # REST endpoints
├── service/
│   ├── N8nWebhookService.java          # N8n integration
│   └── FileProcessingService.java      # File validation & conversion
├── model/
│   ├── FileRecord.java                 # Input file entity
│   └── OutputFile.java                 # Output file entity
├── repository/
│   ├── FileRecordRepository.java       # Input file repository
│   └── OutputFileRepository.java       # Output file repository
├── dto/
│   ├── FileUploadResponse.java         # Upload response DTO
│   └── FileStatusResponse.java         # Status response DTO
├── config/
│   └── RestTemplateConfig.java         # Spring beans
├── exception/
│   ├── FileProcessingException.java    # Custom exception
│   └── GlobalExceptionHandler.java     # Exception handling
└── ServerApplication.java              # Main application
```

---

## 🔌 API Endpoints

### 1. Upload File
```
POST /api/files/upload
Content-Type: multipart/form-data

Parameters:
- file: CSV or JSON file

Response:
{
  "success": true,
  "fileId": "507f1f77bcf86cd799439011",
  "filename": "data.csv",
  "fileType": "CSV",
  "fileSize": 2048,
  "message": "File uploaded successfully and sent to n8n for processing."
}
```

**Example:**
```bash
curl -X POST -F "file=@sample_data.csv" http://localhost:8080/api/files/upload
```

---

### 2. Upload & Convert
```
POST /api/files/upload-and-convert
Content-Type: multipart/form-data

Parameters:
- file: CSV or JSON file
- targetFormat: CSV or JSON (optional)

Response: Same as upload endpoint
```

**Example:**
```bash
curl -X POST \
  -F "file=@data.csv" \
  -F "targetFormat=JSON" \
  http://localhost:8080/api/files/upload-and-convert
```

---

### 3. Get File Status
```
GET /api/files/status/{fileId}

Response:
{
  "fileId": "507f1f77bcf86cd799439011",
  "filename": "data.csv",
  "fileType": "CSV",
  "status": "PROCESSING",
  "uploadedAt": "2025-12-05T10:30:00",
  "processedAt": "2025-12-05T10:30:15",
  "fileSize": 2048,
  "errorMessage": null,
  "n8nWebhookId": "webhook-123"
}
```

**Example:**
```bash
curl http://localhost:8080/api/files/status/507f1f77bcf86cd799439011
```

---

### 4. List Files
```
GET /api/files/list
GET /api/files/list?status=PROCESSING

Response:
[
  {
    "fileId": "507f1f77bcf86cd799439011",
    "filename": "data.csv",
    "fileType": "CSV",
    "status": "PROCESSING",
    "uploadedAt": "2025-12-05T10:30:00",
    "fileSize": 2048
  }
]
```

**Example:**
```bash
# All files
curl http://localhost:8080/api/files/list

# By status
curl "http://localhost:8080/api/files/list?status=PROCESSING"
```

---

### 5. Delete File
```
DELETE /api/files/{fileId}

Response: 204 No Content
```

**Example:**
```bash
curl -X DELETE http://localhost:8080/api/files/507f1f77bcf86cd799439011
```

---

## 🗄️ MongoDB Collections

### fileRecords
Stores original uploaded files
```javascript
{
  _id: ObjectId,
  filename: "data.csv",
  fileType: "CSV",
  contentType: "text/csv",
  fileContent: BinData(0, "..."),
  fileSize: 2048,
  status: "PROCESSING",  // UPLOADED, PROCESSING, FAILED
  uploadedAt: ISODate("2025-12-05T10:30:00Z"),
  processedAt: ISODate("2025-12-05T10:30:15Z"),
  n8nWebhookId: "webhook-123",
  errorMessage: null
}
```

### outputFiles
Stores processed data from n8n
```javascript
{
  _id: ObjectId,
  inputFileId: ObjectId("..."),
  filename: "data_cleaned.csv",
  fileType: "CSV",
  contentType: "text/csv",
  fileContent: BinData(0, "..."),
  fileSize: 1850,
  createdAt: ISODate("2025-12-05T10:30:30Z"),
  n8nWorkflowId: "workflow-456",
  n8nStatus: "completed",
  processingNotes: "Removed duplicates, standardized headers"
}
```

---

## ⚙️ Configuration

Edit `src/main/resources/application.yaml`:

```yaml
spring:
  application:
    name: server
  
  data:
    mongodb:
      uri: mongodb://localhost:27017/clean-data-db
  
  servlet:
    multipart:
      max-file-size: 100MB
      max-request-size: 100MB

n8n:
  webhook:
    url: https://koyo.app.n8n.cloud/webhook/clean-data

server:
  servlet:
    context-path: /api
  port: 8080

logging:
  level:
    root: INFO
    com.server.server: DEBUG
```

---

## 🔗 N8n Integration

### Webhook Configuration

**URL:** `https://koyo.app.n8n.cloud/webhook/clean-data`

**Request Format:**
```
POST /webhook/clean-data HTTP/1.1
Content-Type: application/octet-stream
X-File-Name: data.csv
X-File-Type: CSV

[Binary file content]
```

### Setting Up N8n Workflow

1. Create a new workflow in n8n
2. Add Webhook trigger node
3. Listen for POST requests
4. Process the received file
5. Return cleaned data back to backend

---

## 📊 File Format Support

### CSV Requirements
- Headers in first row
- Comma-separated values
- Valid format validation required

### JSON Requirements
- Valid JSON (array or object)
- Array of objects recommended
- Nested structures supported

---

## 🧪 Testing

### Using Sample Data

Test files are included:
- `sample_data.csv` - Sample CSV data
- `sample_data.json` - Sample JSON data

### Upload CSV
```bash
curl -X POST \
  -F "file=@sample_data.csv" \
  http://localhost:8080/api/files/upload
```

### Upload JSON
```bash
curl -X POST \
  -F "file=@sample_data.json" \
  http://localhost:8080/api/files/upload
```

### Import Postman Collection
- Use `Clean_Data_Backend_API.postman_collection.json`
- Set variables and test endpoints

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error connecting to MongoDB at localhost:27017
```

**Fix:**
```bash
# Verify MongoDB is running
mongosh

# If not running, start it
mongod
```

### Build Fails
```bash
# Clear Maven cache
./mvnw clean

# Rebuild
./mvnw clean install
```

### N8n Webhook Not Receiving
- Verify webhook URL is correct
- Check n8n webhook is active
- Monitor application logs for errors

### File Upload Fails
- Verify file format validity
- Check file size < 100MB
- Ensure proper MIME type

---

## 📦 Dependencies

```xml
<!-- Spring Boot -->
spring-boot-starter-web
spring-boot-starter-data-jpa
spring-boot-starter-data-mongodb
spring-boot-starter-webflux

<!-- HTTP Client -->
spring-web (RestTemplate)

<!-- File Processing -->
commons-csv
jackson-databind

<!-- Utilities -->
lombok
```

---

## 🔄 File Processing Workflow

```
1. User uploads file (CSV/JSON)
   ↓
2. Validate file format and content
   ↓
3. Store original file in MongoDB (fileRecords)
   ↓
4. Send file to n8n webhook
   ↓
5. Update file status to "PROCESSING"
   ↓
6. N8n processes and cleans data
   ↓
7. Store output in MongoDB (outputFiles)
   ↓
8. Update file status to "COMPLETED"
```

---

## 📝 File Status States

| Status | Meaning |
|--------|---------|
| UPLOADED | File received and stored |
| PROCESSING | Sent to n8n, awaiting response |
| FAILED | Error during upload or processing |
| COMPLETED | Processing complete (via webhook response) |

---

## 🚀 Deployment

### Docker Compose (Optional)
```bash
docker-compose up -d
```

This starts:
- MongoDB on port 27017
- Mongo Express UI on port 8081

### Manual Deployment
1. Ensure MongoDB is accessible
2. Build: `./mvnw clean install`
3. Run JAR: `java -jar target/server-0.0.1-SNAPSHOT.jar`

---

## 📚 Documentation Files

- **QUICK_START.md** - Step-by-step setup guide
- **API_DOCUMENTATION.md** - Detailed API reference
- **README.md** - This file

---

## ✨ Features

✅ CSV and JSON support
✅ MongoDB storage (input & output)
✅ N8n webhook integration
✅ Format conversion (CSV ↔ JSON)
✅ File validation
✅ Real-time status tracking
✅ Comprehensive error handling
✅ RESTful API
✅ Swagger/OpenAPI ready

---

## 📞 Support

For detailed API documentation: See `API_DOCUMENTATION.md`
For setup issues: See `QUICK_START.md`

---

## 📄 License

Proprietary - Year 4 Project
