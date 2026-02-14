# Quick Start Guide - Clean Data Backend

## Prerequisites
- Java 17+ installed
- MongoDB installed and running locally on port 27017
- Maven (included as mvnw)

## Step 1: Verify MongoDB is Running

### On Windows (Command Prompt or PowerShell)
```bash
# Check if MongoDB service is running
net start MongoDB

# Or start mongod manually
mongod
```

### On Mac (Homebrew)
```bash
# Start MongoDB
brew services start mongodb-community
```

### On Linux
```bash
sudo systemctl start mongodb
sudo systemctl status mongodb
```

### Verify Connection
```bash
mongosh
> db.version()
```

---

## Step 2: Initialize the Database

Connect to MongoDB and run initialization commands:

```bash
mongosh
```

Then execute in mongosh:
```javascript
// Create database
use clean-data-db

// Create collections
db.createCollection('fileRecords')
db.createCollection('outputFiles')

// Create indexes for better query performance
db.fileRecords.createIndex({ status: 1 })
db.fileRecords.createIndex({ filename: 1 })
db.fileRecords.createIndex({ fileType: 1 })
db.fileRecords.createIndex({ uploadedAt: 1 })

db.outputFiles.createIndex({ inputFileId: 1 })
db.outputFiles.createIndex({ n8nWorkflowId: 1 })
db.outputFiles.createIndex({ fileType: 1 })
db.outputFiles.createIndex({ createdAt: 1 })

// Verify
show collections
db.fileRecords.getIndexes()
```

---

## Step 3: Build the Application

Navigate to the project directory:

```bash
cd "c:\Users\eugin\OneDrive\Desktop\Year4 Project\server"
```

Build the project:

```bash
./mvnw clean install
```

---

## Step 4: Run the Application

Start the Spring Boot application:

```bash
./mvnw spring-boot:run
```

Expected output:
```
...
Tomcat started on port(s): 8080 (http)
Started ServerApplication in X.XXX seconds
...
```

---

## Step 5: Test the API

### Option 1: Using cURL

**Upload a CSV file:**
```bash
curl -X POST \
  -F "file=@data.csv" \
  http://localhost:8080/api/files/upload
```

**Check file status:**
```bash
curl http://localhost:8080/api/files/status/{fileId}
```

**List all files:**
```bash
curl http://localhost:8080/api/files/list
```

### Option 2: Using Postman

1. Import `Clean_Data_Backend_API.postman_collection.json`
2. Set the `fileId` variable
3. Run requests

### Option 3: Using the REST Client

Use VS Code REST Client extension with sample requests.

---

## Troubleshooting

### MongoDB Connection Error
```
Error connecting to MongoDB at localhost:27017
```

**Solution:**
1. Verify MongoDB is running: `mongosh`
2. Check port 27017 is not blocked
3. Verify URI in `application.yaml`

### Port Already in Use
```
Address already in use: 8080
```

**Solution:**
Change port in `application.yaml`:
```yaml
server:
  port: 8081
```

### Build Failure
```
[ERROR] BUILD FAILURE
```

**Solution:**
1. Ensure Java 17+ is installed: `java -version`
2. Clear Maven cache: `./mvnw clean`
3. Check internet connection for dependency downloads

---

## Project Structure

```
server/
├── pom.xml                          # Maven configuration with dependencies
├── docker-compose.yml               # Optional Docker setup
├── init-mongo.js                    # MongoDB initialization script
├── API_DOCUMENTATION.md             # Complete API documentation
├── QUICK_START.md                   # This file
├── src/
│   ├── main/
│   │   ├── java/com/server/server/
│   │   │   ├── controller/
│   │   │   │   └── FileUploadController.java
│   │   │   ├── service/
│   │   │   │   ├── N8nWebhookService.java
│   │   │   │   └── FileProcessingService.java
│   │   │   ├── model/
│   │   │   │   ├── FileRecord.java
│   │   │   │   └── OutputFile.java
│   │   │   ├── repository/
│   │   │   │   ├── FileRecordRepository.java
│   │   │   │   └── OutputFileRepository.java
│   │   │   ├── dto/
│   │   │   │   ├── FileUploadResponse.java
│   │   │   │   └── FileStatusResponse.java
│   │   │   ├── config/
│   │   │   │   └── RestTemplateConfig.java
│   │   │   ├── exception/
│   │   │   │   ├── FileProcessingException.java
│   │   │   │   └── GlobalExceptionHandler.java
│   │   │   └── ServerApplication.java
│   │   └── resources/
│   │       └── application.yaml     # Configuration file
│   └── test/
│       └── java/...
```

---

## Key Features

✅ **File Upload** - Support for CSV and JSON formats
✅ **MongoDB Storage** - Both input and output files stored
✅ **N8n Integration** - Automatic webhook to n8n
✅ **Format Conversion** - CSV ↔ JSON conversion
✅ **File Validation** - Input format validation
✅ **Status Tracking** - Real-time file processing status
✅ **Error Handling** - Comprehensive error responses

---

## API Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/files/upload` | Upload file to n8n |
| POST | `/api/files/upload-and-convert` | Upload and convert format |
| GET | `/api/files/status/{fileId}` | Get file processing status |
| GET | `/api/files/list` | List all uploaded files |
| GET | `/api/files/list?status=PROCESSING` | Filter by status |
| DELETE | `/api/files/{fileId}` | Delete file record |

---

## Configuration

Edit `src/main/resources/application.yaml` to customize:

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/clean-data-db  # MongoDB connection
  servlet:
    multipart:
      max-file-size: 100MB          # Max file size
      max-request-size: 100MB       # Max request size

n8n:
  webhook:
    url: https://koyo.app.n8n.cloud/webhook/clean-data  # N8n webhook URL

server:
  port: 8080                        # Server port
```

---

## Next Steps

1. ✅ MongoDB is installed and running
2. ✅ Application is built and running
3. ✅ API is accessible at `http://localhost:8080`
4. 📝 Start uploading files via the API
5. 🔗 Monitor n8n webhook for processed data

---

## Support

For detailed API documentation, see `API_DOCUMENTATION.md`

For issues or questions, check the logs:
```bash
# Application will show detailed logs in console
```
