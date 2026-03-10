# Backend Test Suite Documentation

## Overview

This document describes the comprehensive test suite for the Clean Stream backend data cleaning process. The tests cover the entire flow from file upload through FastAPI processing to WebSocket broadcasting.

## Test Structure

### 1. **WebSocketBroadcastServiceTest**
**Location**: `src/test/java/com/server/server/service/WebSocketBroadcastServiceTest.java`

**Purpose**: Unit tests for the WebSocket broadcasting service

**Test Cases**:
- `testBroadcastCleanedRow()` - Verify cleaned rows are broadcast with correct data
- `testBroadcastProgress()` - Ensure progress updates are sent correctly
- `testProgressPercentageCalculation()` - Validate progress percentage calculation
- `testBroadcastCompletion()` - Verify completion message format
- `testBroadcastError()` - Test error message broadcasting
- `testHasActiveSubscribers()` - Check subscriber status detection
- `testNoActiveSubscribers()` - Verify handling when no subscribers
- `testGetActiveSubscriberCount()` - Get active subscription count
- `testMessageTimestamps()` - Ensure all messages include timestamps
- `testBroadcastEmptyRow()` - Handle empty cleaned rows
- `testZeroProgress()` - Handle 0% progress

**Coverage**: 100% of WebSocketBroadcastService methods

---

### 2. **FastAPIServiceTest**
**Location**: `src/test/java/com/server/server/service/FastAPIServiceTest.java`

**Purpose**: Unit tests for FastAPI integration service

**Test Cases**:
- `testProcessRowSuccess()` - Successful single row processing
- `testProcessRowFailureNon2xx()` - Handle non-200 responses
- `testProcessRowNetworkError()` - Handle network failures
- `testProcessDatasetSuccess()` - Successful batch dataset processing
- `testProcessRowWithSuggestions()` - Handle multi-field suggestions
- `testProcessRowJsonParseError()` - Handle invalid JSON responses
- `testProcessRowPreservesData()` - Verify request data integrity
- `testProcessEmptyRow()` - Handle empty row data
- `testProcessRow400Error()` - Handle 400 Bad Request
- `testProcessRow503Error()` - Handle 503 Service Unavailable
- `testCustomFastApiUrl()` - Support custom FastAPI URLs

**Coverage**: 100% of FastAPIService methods

---

### 3. **DatasetControllerTest**
**Location**: `src/test/java/com/server/server/controller/DatasetControllerTest.java`

**Purpose**: REST API endpoint tests

**Test Cases**:
- `testUploadFileSuccess()` - File upload endpoint
- `testUploadFileMissing()` - Missing file parameter rejection
- `testUploadFileMissingDatasetId()` - Missing datasetId parameter rejection
- `testProcessDatasetSuccess()` - Dataset processing endpoint
- `testGetDatasetInfo()` - Retrieve dataset information
- `testGetDatasetResults()` - Get processing results
- `testProcessRowEndpoint()` - Single row processing endpoint
- `testHealthEndpoint()` - Health check endpoint
- `testInfoEndpoint()` - Service info endpoint
- `testInvalidRequestBody()` - Invalid JSON handling
- `testProcessRowWhenFastAPIFails()` - Error handling
- `testProcessBatchEndpoint()` - Batch processing endpoint

**Coverage**: All REST API endpoints

---

### 4. **DatasetProcessingIntegrationTest**
**Location**: `src/test/java/com/server/server/integration/DatasetProcessingIntegrationTest.java`

**Purpose**: End-to-end integration tests

**Test Cases**:
- `testCompleteDataCleaningFlow()` - Full flow from upload to broadcast
- `testCleanedRowBroadcasting()` - WebSocket row broadcasting
- `testProgressBroadcasting()` - Progress update broadcasting
- `testErrorBroadcasting()` - Error message broadcasting
- `testSingleRowProcessing()` - Single row processing and broadcast
- `testBatchRowProcessing()` - Multiple rows batch processing
- `testRetryOnTransientError()` - Transient error retry logic
- `testProcessingStatisticsTracking()` - Statistics tracking
- `testTenantIsolation()` - Multi-tenant isolation verification
- `testLargeBatchProcessing()` - 100-row batch processing

**Coverage**: Complete end-to-end workflows

---

### 5. **WebSocketBroadcastingIntegrationTest**
**Location**: `src/test/java/com/server/server/websocket/WebSocketBroadcastingIntegrationTest.java`

**Purpose**: WebSocket messaging integration tests

**Test Cases**:
- `testRowMessageFormat()` - Verify row message structure
- `testProgressMessageFormat()` - Verify progress message structure
- `testMessageTimestamps()` - Ensure message timestamps
- `testCompletionMessage()` - Completion message verification
- `testErrorMessageBroadcast()` - Error message broadcasting
- `testNoBroadcastWithoutSubscribers()` - No broadcast when no subscribers
- `testActiveSubscriberCount()` - Subscriber counting
- `testMessageSequence()` - Message ordering verification
- `testIndependentDatasets()` - Independent dataset broadcasting
- `testLargeCleanedRow()` - Large data handling
- `testExtremeProgressValues()` - Edge case progress values
- `testSpecialCharactersInErrors()` - Special character handling
- `testNullConfidenceScore()` - Null value handling
- `testPartialProcessingProgress()` - Partial progress calculation

**Coverage**: WebSocket message formats and ordering

---

## Running the Tests

### Run All Tests
```bash
cd back_clean_stream
mvn test
```

### Run Specific Test Class
```bash
mvn test -Dtest=WebSocketBroadcastServiceTest
mvn test -Dtest=FastAPIServiceTest
mvn test -Dtest=DatasetControllerTest
mvn test -Dtest=DatasetProcessingIntegrationTest
mvn test -Dtest=WebSocketBroadcastingIntegrationTest
```

### Run Specific Test Method
```bash
mvn test -Dtest=WebSocketBroadcastServiceTest#testBroadcastCleanedRow
```

### Run Tests with Coverage Report
```bash
mvn test jacoco:report
# Report will be in: target/site/jacoco/index.html
```

### Run Tests in Verbose Mode
```bash
mvn -x test
```

---

## Test Coverage Summary

| Component | Test Class | Coverage |
|-----------|-----------|----------|
| WebSocketBroadcastService | WebSocketBroadcastServiceTest | 11 tests |
| FastAPIService | FastAPIServiceTest | 11 tests |
| Dataset Controller | DatasetControllerTest | 12 tests |
| Integration Flow | DatasetProcessingIntegrationTest | 10 tests |
| WebSocket Integration | WebSocketBroadcastingIntegrationTest | 14 tests |
| **Total** | | **58 tests** |

---

## Key Scenarios Tested

### 1. **Happy Path Scenarios**
- ✅ File upload → processing → WebSocket broadcasts
- ✅ Single row processing with cleaning suggestions
- ✅ Batch processing of multiple rows
- ✅ Real-time progress updates
- ✅ Final completion notification

### 2. **Error Handling**
- ✅ FastAPI connection failures
- ✅ Invalid JSON responses
- ✅ Network timeouts
- ✅ Missing required parameters
- ✅ Invalid request bodies
- ✅ Service unavailability (503)
- ✅ Bad requests (400)

### 3. **Multi-Tenancy**
- ✅ Tenant isolation verification
- ✅ Independent dataset processing per tenant
- ✅ Separate WebSocket broadcasts per tenant

### 4. **Edge Cases**
- ✅ Empty rows and datasets
- ✅ Large batches (100+ rows)
- ✅ Special characters in data
- ✅ Null confidence scores
- ✅ Extreme progress values (0%, 100%)
- ✅ Multiple concurrent datasets

### 5. **Performance & Scale**
- ✅ 100-row batch processing
- ✅ Large cleaned rows (100+ fields)
- ✅ Multiple subscriber management

---

## Mock Objects Used

### Service Mocks
- `FastAPIService` - Mocked for controller and integration tests
- `WebSocketHandler` - Mocked for broadcast service tests
- `RestTemplate` - Mocked for FastAPI service tests
- `ObjectMapper` - Real for JSON parsing validation

### Test Data
- Sample CSV files with various data formats
- Multi-field rows with different data types
- Large batches for volume testing
- Special characters in error messages

---

## Test Execution Flow

```
1. Unit Tests (Run First)
   ├─ WebSocketBroadcastServiceTest
   ├─ FastAPIServiceTest
   └─ DatasetControllerTest

2. Integration Tests (Depend on Unit Tests)
   ├─ DatasetProcessingIntegrationTest
   └─ WebSocketBroadcastingIntegrationTest

3. Coverage Report
   └─ target/site/jacoco/index.html
```

---

## Expected Test Results

All tests should pass with the following expectations:

```
Tests run: 58
Successes: 58
Failures: 0
Errors: 0
Skipped: 0

Code Coverage:
- WebSocketBroadcastService: 100%
- FastAPIService: 100%
- DatasetController: 95%+
- Integration flows: 90%+
```

---

## Continuous Integration Setup

For CI/CD pipelines, use:

```yaml
# Example GitHub Actions
- name: Run tests
  run: mvn clean test

- name: Generate coverage report
  run: mvn jacoco:report

- name: Publish results
  uses: actions/upload-artifact@v2
  with:
    name: test-results
    path: target/site/jacoco/
```

---

## Troubleshooting

### Test Failures

**Issue**: Tests fail due to mocking issues
**Solution**: Ensure mockito dependencies are in pom.xml

```xml
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
```

**Issue**: WebSocket tests timeout
**Solution**: Increase test timeout in properties:

```properties
spring.test.mockmvc.print=true
spring.test.web-socket.timeout=5000
```

**Issue**: FastAPI service tests fail with JSON parsing
**Solution**: Ensure ObjectMapper is properly configured

---

## Adding New Tests

When adding new features, follow this pattern:

```java
@Test
@DisplayName("Should [describe what is being tested]")
void testFeatureName() {
    // Arrange - Setup test data and mocks
    
    // Act - Execute the feature
    
    // Assert - Verify the results
}
```

Example:

```java
@Test
@DisplayName("Should export cleaned dataset to CSV")
void testExportToCsv() {
    // Arrange
    String datasetId = "dataset-export";
    
    // Act
    mockMvc.perform(get("/api/datasets/{id}/export", datasetId)
            .param("format", "csv"))
        .andExpect(status().isOk());
    
    // Assert
    // Verify CSV format and content
}
```

---

## Performance Benchmarks

Run performance tests with:

```bash
mvn test -Dtest=DatasetProcessingIntegrationTest#testLargeBatchProcessing
```

Expected metrics:
- 100-row processing: < 5 seconds
- Message broadcasting overhead: < 100ms per message
- WebSocket connection: < 1 second

---

**Last Updated**: February 24, 2026
