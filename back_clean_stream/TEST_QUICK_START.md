# Quick Test Execution Guide

## Overview
Comprehensive test suite for the Clean Stream backend data cleaning process. 58 tests covering file upload, FastAPI integration, WebSocket broadcasting, and end-to-end data cleaning workflows.

## Quick Commands

### Run All Tests
```bash
cd back_clean_stream && mvn test
```

### Run Tests with Coverage
```bash
cd back_clean_stream && mvn clean test jacoco:report
# Open report: target/site/jacoco/index.html
```

### Run Specific Test Suite

**WebSocket Broadcasting Tests** (11 tests)
```bash
mvn test -Dtest=WebSocketBroadcastServiceTest
```

**FastAPI Integration Tests** (11 tests)
```bash
mvn test -Dtest=FastAPIServiceTest
```

**REST API Endpoints Tests** (12 tests)
```bash
mvn test -Dtest=DatasetControllerTest
```

**End-to-End Integration Tests** (10 tests)
```bash
mvn test -Dtest=DatasetProcessingIntegrationTest
```

**WebSocket Message Tests** (14 tests)
```bash
mvn test -Dtest=WebSocketBroadcastingIntegrationTest
```

### Run Single Test
```bash
mvn test -Dtest=WebSocketBroadcastServiceTest#testBroadcastCleanedRow
```

## Test Results Summary

```
Total Tests: 58
✅ Unit Tests: 34 tests
✅ Integration Tests: 24 tests

Coverage by Component:
- WebSocketBroadcastService: 100%
- FastAPIService: 100%
- DatasetController: 95%+
- Complete End-to-End Flows: 90%+
```

## Test Categories

### 1️⃣ Unit Tests (WebSocket Broadcasting)
Tests message broadcasting for cleaned rows, progress updates, completions, and errors.

```bash
mvn test -Dtest=WebSocketBroadcastServiceTest
# 11 tests covering all broadcast scenarios
```

**Key Tests**:
- Row broadcast with confidence score
- Progress percentage calculation
- Error message broadcasting
- Active subscriber management

---

### 2️⃣ Unit Tests (FastAPI Integration)  
Tests HTTP calls to FastAPI with success/error scenarios.

```bash
mvn test -Dtest=FastAPIServiceTest
# 11 tests covering all FastAPI interactions
```

**Key Tests**:
- Successful row processing
- Error handling (400, 503, network errors)
- JSON parsing validation
- Batch dataset processing

---

### 3️⃣ REST API Tests
Tests all Spring Boot REST endpoints for file upload and processing.

```bash
mvn test -Dtest=DatasetControllerTest
# 12 tests covering all endpoints
```

**Key Tests**:
- File upload validation
- Dataset processing trigger
- Single row processing
- Health & info endpoints

---

### 4️⃣ End-to-End Integration Tests
Complete workflow from file upload through WebSocket broadcasting.

```bash
mvn test -Dtest=DatasetProcessingIntegrationTest
# 10 tests covering full workflows
```

**Key Tests**:
- Complete upload → process → broadcast flow
- Multi-tenant isolation
- Large batch processing (100+ rows)
- Error retry logic

---

### 5️⃣ WebSocket Integration Tests
WebSocket messaging format and delivery verification.

```bash
mvn test -Dtest=WebSocketBroadcastingIntegrationTest
# 14 tests covering WebSocket communication
```

**Key Tests**:
- Message format validation
- Progress calculation accuracy
- Independent dataset broadcasting
- Special character handling

---

## What's Tested

### ✅ Happy Path
- File upload → Row processing → WebSocket broadcast
- Single and batch row cleaning
- Real-time progress updates
- Final completion notification

### ✅ Error Scenarios
- FastAPI connection failures
- Invalid JSON responses
- Network timeouts
- Missing parameters
- Service unavailability

### ✅ Multi-Tenancy
- Separate tenant isolation
- Independent broadcasts
- Isolated embeddings storage

### ✅ Edge Cases
- Empty rows/datasets
- 100+ row batches
- Special characters
- Null values
- Extreme progress values (0%, 100%)

## Expected Output

```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.server.server.service.WebSocketBroadcastServiceTest
[INFO] Tests run: 11, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.5s
[INFO] Running com.server.server.service.FastAPIServiceTest
[INFO] Tests run: 11, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.2s
[INFO] Running com.server.server.controller.DatasetControllerTest
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.1s
[INFO] Running com.server.server.integration.DatasetProcessingIntegrationTest
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.8s
[INFO] Running com.server.server.websocket.WebSocketBroadcastingIntegrationTest
[INFO] Tests run: 14, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.5s
[INFO] -------------------------------------------------------
[INFO] Total Tests run: 58, Passed: 58
[INFO] SUCCESS
```

## Test Execution Time

- **Quick tests** (unit only): ~1 minute
- **Full suite**: ~3-5 minutes
- **With coverage report**: ~5-7 minutes

## View Coverage Report

After running `mvn clean test jacoco:report`:

```bash
# Open in browser
open target/site/jacoco/index.html    # macOS
start target/site/jacoco/index.html   # Windows
xdg-open target/site/jacoco/index.html # Linux
```

## CI/CD Integration

Add to your CI pipeline (GitHub Actions):

```yaml
- name: Run Backend Tests
  run: cd back_clean_stream && mvn clean test

- name: Generate Coverage
  run: cd back_clean_stream && mvn jacoco:report

- name: Publish Coverage
  uses: codecov/codecov-action@v3
  with:
    files: back_clean_stream/target/site/jacoco/jacoco.xml
```

## Troubleshooting

**Tests timeout:**
```bash
mvn -DargLine="-Xmx1024m" test
```

**Skip tests during build:**
```bash
mvn clean install -DskipTests
```

**Run only integration tests:**
```bash
mvn test -Dtest=*Integration*
```

**Verbose output:**
```bash
mvn -X test
```

## Test Documentation

Detailed test documentation: [BACKEND_TESTS.md](./BACKEND_TESTS.md)

## Dependencies

```xml
<!-- Test Dependencies in pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.assertj</groupId>
    <artifactId>assertj-core</artifactId>
    <scope>test</scope>
</dependency>
```

---

**Last Updated**: February 24, 2026
