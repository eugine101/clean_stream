# Clean Data Backend - API Documentation

## Overview
This Spring Boot backend application handles CSV and JSON file uploads, stores them in MongoDB, and sends them to n8n for data cleaning and processing via webhook.

## Architecture

### Components
1. **File Upload Controller** - REST endpoints for file operations
2. **N8n Webhook Service** - Handles communication with n8n
3. **File Processing Service** - Validates and converts file formats
4. **MongoDB Repositories** - Data persistence layer
5. **Models** - FileRecord and OutputFile entities

### Data Flow
```
User → File Upload → Validation → MongoDB Storage → N8n Webhook → Processing → Output Storage
```

## Setup Instructions

### Prerequisites
- Java 17+
- MongoDB (local or Atlas)
- Spring Boot 3.5.7

### Installation

1. **Clone and Configure**
   ```bash
   git clone <repository>
   cd server
   ```

2. **Update MongoDB Connection**
   Edit `src/main/resources/application.yaml`:
   ```yaml
   spring:
     data:
       mongodb:
         uri: mongodb://localhost:27017/clean-data-db
   ```

   For MongoDB Atlas:
   ```yaml
   spring:
     data:
       mongodb:
         uri: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/clean-data-db
   ```

3. **Build and Run**
   ```bash
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```

The application will start on `http://localhost:8080`

## API Endpoints

### 1. Upload File
**Endpoint:** `POST /api/files/upload`

**Description:** Upload a CSV or JSON file to be processed

**Request:**
- Content-Type: `multipart/form-data`
- Parameter: `file` (required) - The CSV or JSON file

**Example:**
```bash
curl -X POST \
  -F "file=@data.csv" \
  http://localhost:8080/api/files/upload
```

**Success Response (200):**
```json
{
  "success": true,
  "fileId": "507f1f77bcf86cd799439011",
  "filename": "data.csv",
  "fileType": "CSV",
  "fileSize": 2048,
  "message": "File uploaded successfully and sent to n8n for processing."
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Invalid file type. Only CSV and JSON files are supported."
}
```

---

### 2. Upload and Convert
**Endpoint:** `POST /api/files/upload-and-convert`

**Description:** Upload a file and optionally convert it to another format

**Request:**
- Content-Type: `multipart/form-data`
- Parameters:
  - `file` (required) - The CSV or JSON file
  - `targetFormat` (optional) - Target format (CSV or JSON)

**Example:**
```bash
curl -X POST \
  -F "file=@data.csv" \
  -F "targetFormat=JSON" \
  http://localhost:8080/api/files/upload-and-convert
```

**Success Response (200):**
```json
{
  "success": true,
  "fileId": "507f1f77bcf86cd799439011",
  "filename": "data.csv",
  "fileType": "CSV",
  "fileSize": 2048,
  "message": "File uploaded, converted, and sent to n8n."
}
```

---

### 3. Get File Status
**Endpoint:** `GET /api/files/status/{fileId}`

**Description:** Retrieve status and metadata of an uploaded file

**Example:**
```bash
curl http://localhost:8080/api/files/status/507f1f77bcf86cd799439011
```

**Response:**
```json
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

---

### 4. List All Files
**Endpoint:** `GET /api/files/list`

**Description:** Retrieve all uploaded files with optional status filtering

**Query Parameters:**
- `status` (optional) - Filter by status: UPLOADED, PROCESSING, FAILED

**Example:**
```bash
curl http://localhost:8080/api/files/list?status=PROCESSING
```

**Response:**
```json
[
  {
    "fileId": "507f1f77bcf86cd799439011",
    "filename": "data.csv",
    "fileType": "CSV",
    "status": "PROCESSING",
    "uploadedAt": "2025-12-05T10:30:00",
    "fileSize": 2048
  },
  {
    "fileId": "507f1f77bcf86cd799439012",
    "filename": "data.json",
    "fileType": "JSON",
    "status": "UPLOADED",
    "uploadedAt": "2025-12-05T10:35:00",
    "fileSize": 3096
  }
]
```

---

### 5. Delete File
**Endpoint:** `DELETE /api/files/{fileId}`

**Description:** Delete a file record from MongoDB

**Example:**
```bash
curl -X DELETE http://localhost:8080/api/files/507f1f77bcf86cd799439011
```

**Response:** 204 No Content

---

## N8n Webhook Integration

### Webhook Configuration
The backend automatically sends uploaded files to your n8n webhook:

```
Webhook URL: https://koyo.app.n8n.cloud/webhook/clean-data
```

### Request Format
Files are sent as binary data with headers:

```
POST /webhook/clean-data HTTP/1.1
Host: koyo.app.n8n.cloud
Content-Type: application/octet-stream
X-File-Name: data.csv
X-File-Type: CSV

[Binary File Content]
```

### N8n Workflow Integration
In your n8n workflow:
1. Add a webhook trigger node
2. Configure it to receive the file from your backend
3. Process the file through your cleanup/transformation nodes
4. Return processed data to your backend

---

## MongoDB Collections

### fileRecords
Stores original uploaded files:
```javascript
{
  _id: ObjectId,
  filename: string,
  fileType: string (CSV|JSON),
  contentType: string,
  fileContent: BinData,
  fileSize: number,
  status: string (UPLOADED|PROCESSING|FAILED),
  uploadedAt: ISODate,
  processedAt: ISODate,
  n8nWebhookId: string,
  errorMessage: string
}
```

### outputFiles
Stores processed files returned from n8n:
```javascript
{
  _id: ObjectId,
  inputFileId: ObjectId,
  filename: string,
  fileType: string,
  contentType: string,
  fileContent: BinData,
  fileSize: number,
  createdAt: ISODate,
  n8nWorkflowId: string,
  n8nStatus: string,
  processingNotes: string
}
```

---

## Configuration

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
      max-file-size: 100MB          # Maximum file size
      max-request-size: 100MB       # Maximum request size

n8n:
  webhook:
    url: https://koyo.app.n8n.cloud/webhook/clean-data

server:
  servlet:
    context-path: /api
  port: 8080                        # Server port
```

---

## Supported File Formats

### CSV
- Must have headers in first row
- Comma-separated values
- Valid format required

### JSON
- Must be valid JSON (array or object)
- Supports nested structures
- Array of objects recommended

---

## Error Handling

### Common Errors

**Invalid File Type**
```json
{
  "success": false,
  "message": "Invalid file type. Only CSV and JSON files are supported."
}
```

**Invalid File Format**
```json
{
  "success": false,
  "message": "Invalid CSV file format."
}
```

**N8n Connection Error**
```json
{
  "success": false,
  "fileId": "507f1f77bcf86cd799439011",
  "message": "File uploaded but failed to send to n8n webhook."
}
```

---

## Usage Examples

### Example 1: Upload CSV
```bash
curl -X POST \
  -F "file=@customers.csv" \
  http://localhost:8080/api/files/upload

# Response
{
  "success": true,
  "fileId": "507f1f77bcf86cd799439011",
  "filename": "customers.csv",
  "fileType": "CSV"
}
```

### Example 2: Upload JSON
```bash
curl -X POST \
  -F "file=@users.json" \
  http://localhost:8080/api/files/upload

# Response
{
  "success": true,
  "fileId": "507f1f77bcf86cd799439012",
  "filename": "users.json",
  "fileType": "JSON"
}
```

### Example 3: Check Processing Status
```bash
curl http://localhost:8080/api/files/status/507f1f77bcf86cd799439011

# Response
{
  "fileId": "507f1f77bcf86cd799439011",
  "status": "PROCESSING",
  "uploadedAt": "2025-12-05T10:30:00",
  "processedAt": "2025-12-05T10:30:15"
}
```

---

## Development

### Project Structure
```
src/main/java/com/server/server/
├── controller/
│   └── FileUploadController.java
├── service/
│   ├── N8nWebhookService.java
│   └── FileProcessingService.java
├── model/
│   ├── FileRecord.java
│   └── OutputFile.java
├── repository/
│   ├── FileRecordRepository.java
│   └── OutputFileRepository.java
├── dto/
│   ├── FileUploadResponse.java
│   └── FileStatusResponse.java
├── config/
│   └── RestTemplateConfig.java
├── exception/
│   ├── FileProcessingException.java
│   └── GlobalExceptionHandler.java
└── ServerApplication.java
```

---

## Troubleshooting

**MongoDB Connection Error**
- Verify MongoDB is running on `localhost:27017`
- Check connection URI in `application.yaml`
- For Atlas, ensure IP whitelist includes your IP

**N8n Webhook Not Receiving**
- Verify webhook URL is correct
- Check n8n webhook is active
- Monitor application logs

**File Upload Fails**
- Check file format validity
- Verify file size < 100MB
- Ensure proper MIME type

---

## License
Proprietary
