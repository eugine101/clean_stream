package com.server.server.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.ByteArrayInputStream;
import java.util.*;

@Slf4j
@Service
public class FileProcessingService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Validate if file is valid CSV or JSON
     * @param fileContent The file content as bytes
     * @param fileType The file type (CSV or JSON)
     * @return true if valid, false otherwise
     */
    public boolean validateFile(byte[] fileContent, String fileType) {
        try {
            if (fileType.equalsIgnoreCase("CSV")) {
                return validateCSV(fileContent);
            } else if (fileType.equalsIgnoreCase("JSON")) {
                return validateJSON(fileContent);
            }
            return false;
        } catch (Exception e) {
            log.error("Validation error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Validate CSV file format
     */
    private boolean validateCSV(byte[] fileContent) throws IOException {
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(new ByteArrayInputStream(fileContent))
        );
        
        CSVParser csvParser = CSVFormat.DEFAULT.withFirstRecordAsHeader().parse(reader);
        int recordCount = 0;
        
        for (CSVRecord record : csvParser) {
            recordCount++;
            if (recordCount > 0) {
                break; // Just check if at least one record exists
            }
        }
        
        csvParser.close();
        return recordCount > 0;
    }

    /**
     * Validate JSON file format
     */
    private boolean validateJSON(byte[] fileContent) throws IOException {
        String content = new String(fileContent);
        try {
            objectMapper.readValue(content, Object.class);
            return true;
        } catch (Exception e) {
            log.error("Invalid JSON format: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Convert CSV to JSON
     */
    public byte[] convertCSVtoJSON(byte[] csvContent) throws IOException {
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(new ByteArrayInputStream(csvContent))
        );

        CSVParser csvParser = CSVFormat.DEFAULT.withFirstRecordAsHeader().parse(reader);
        List<Map<String, String>> records = new ArrayList<>();

        for (CSVRecord record : csvParser) {
            Map<String, String> row = record.toMap();
            records.add(row);
        }

        csvParser.close();
        return objectMapper.writeValueAsBytes(records);
    }

    /**
     * Convert JSON to CSV
     */
    public byte[] convertJSONtoCSV(byte[] jsonContent) throws IOException {
        String content = new String(jsonContent);
        List<Map<String, Object>> records = objectMapper.readValue(
                content,
                objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class)
        );

        if (records.isEmpty()) {
            return new byte[0];
        }

        // Get column names from first record
        Set<String> columns = records.get(0).keySet();
        StringBuilder csv = new StringBuilder();

        // Write header
        csv.append(String.join(",", columns)).append("\n");

        // Write records
        for (Map<String, Object> record : records) {
            List<String> values = new ArrayList<>();
            for (String column : columns) {
                Object value = record.get(column);
                values.add(value != null ? value.toString() : "");
            }
            csv.append(String.join(",", values)).append("\n");
        }

        return csv.toString().getBytes();
    }

    /**
     * Convert JSON array to XLSX format
     */
    public byte[] convertJSONtoXLSX(byte[] jsonContent) throws IOException {
        String content = new String(jsonContent);
        List<Map<String, Object>> records = objectMapper.readValue(
                content,
                objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class)
        );

        if (records.isEmpty()) {
            return new byte[0];
        }

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Data");

            // Get column names from first record
            List<String> columns = new ArrayList<>(records.get(0).keySet());

            // Create header row with styling
            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            for (int i = 0; i < columns.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns.get(i));
                cell.setCellStyle(headerStyle);
            }

            // Create data rows
            int rowNum = 1;
            for (Map<String, Object> record : records) {
                Row row = sheet.createRow(rowNum++);
                for (int i = 0; i < columns.size(); i++) {
                    Cell cell = row.createCell(i);
                    Object value = record.get(columns.get(i));
                    if (value != null) {
                        if (value instanceof Number) {
                            cell.setCellValue(((Number) value).doubleValue());
                        } else if (value instanceof Boolean) {
                            cell.setCellValue((Boolean) value);
                        } else {
                            cell.setCellValue(value.toString());
                        }
                    }
                }
            }

            // Auto-size columns
            for (int i = 0; i < columns.size(); i++) {
                sheet.autoSizeColumn(i);
            }

            // Write to bytes
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    /**
     * Get file statistics
     */
    public Map<String, Object> getFileStatistics(byte[] fileContent, String fileType) {
        Map<String, Object> stats = new HashMap<>();
        try {
            if (fileType.equalsIgnoreCase("CSV")) {
                stats = getCSVStatistics(fileContent);
            } else if (fileType.equalsIgnoreCase("JSON")) {
                stats = getJSONStatistics(fileContent);
            }
        } catch (Exception e) {
            log.error("Error getting statistics: {}", e.getMessage());
        }
        return stats;
    }

    /**
     * Get CSV statistics
     */
    private Map<String, Object> getCSVStatistics(byte[] fileContent) throws IOException {
        Map<String, Object> stats = new HashMap<>();
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(new ByteArrayInputStream(fileContent))
        );

        CSVParser csvParser = CSVFormat.DEFAULT.withFirstRecordAsHeader().parse(reader);
        int rowCount = 0;

        for (CSVRecord record : csvParser) {
            rowCount++;
        }

        stats.put("rowCount", rowCount);
        stats.put("columnCount", csvParser.getHeaderMap().size());
        stats.put("columns", csvParser.getHeaderMap().keySet());
        csvParser.close();

        return stats;
    }

    /**
     * Get JSON statistics
     */
    private Map<String, Object> getJSONStatistics(byte[] fileContent) throws IOException {
        Map<String, Object> stats = new HashMap<>();
        String content = new String(fileContent);

        List<Map<String, Object>> records = objectMapper.readValue(
                content,
                objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class)
        );

        stats.put("recordCount", records.size());
        if (!records.isEmpty()) {
            stats.put("keys", records.get(0).keySet());
        }

        return stats;
    }
}
