package com.server.server.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Service to parse CSV and JSON files into rows.
 */
@Slf4j
@Service
public class FileParsingService {

    private final ObjectMapper objectMapper;

    public FileParsingService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Parse a CSV file into a list of row maps.
     *
     * @param fileContent the CSV file content as bytes
     * @return List of maps, each representing a row
     * @throws IOException if parsing fails
     */
    public List<Map<String, Object>> parseCSV(byte[] fileContent) throws IOException {
        log.info("Parsing CSV file, size: {} bytes", fileContent.length);
        
        List<Map<String, Object>> rows = new ArrayList<>();
        String csvContent = new String(fileContent, StandardCharsets.UTF_8);
        
        try (Reader reader = new StringReader(csvContent);
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader())) {
            
            for (CSVRecord record : csvParser) {
                Map<String, Object> row = new HashMap<>(record.toMap());
                rows.add(row);
            }
        }
        
        log.info("Parsed {} rows from CSV", rows.size());
        return rows;
    }

    /**
     * Parse a JSON file into a list of row maps.
     * Supports both:
     * - Array of objects: [{...}, {...}]
     * - Single object: {...}
     *
     * @param fileContent the JSON file content as bytes
     * @return List of maps, each representing a row
     * @throws IOException if parsing fails
     */
    public List<Map<String, Object>> parseJSON(byte[] fileContent) throws IOException {
        log.info("Parsing JSON file, size: {} bytes", fileContent.length);
        
        String jsonContent = new String(fileContent, StandardCharsets.UTF_8);
        List<Map<String, Object>> rows = new ArrayList<>();
        
        try {
            // Try to parse as array first
            if (jsonContent.trim().startsWith("[")) {
                List<Map<String, Object>> list = objectMapper.readValue(
                    jsonContent,
                    objectMapper.getTypeFactory()
                        .constructCollectionType(List.class, Map.class)
                );
                rows.addAll(list);
            } else {
                // Parse as single object and wrap in list
                Map<String, Object> map = objectMapper.readValue(jsonContent, Map.class);
                rows.add(map);
            }
        } catch (Exception e) {
            log.error("Error parsing JSON: {}", e.getMessage(), e);
            throw new IOException("Failed to parse JSON file: " + e.getMessage(), e);
        }
        
        log.info("Parsed {} rows from JSON", rows.size());
        return rows;
    }

    /**
     * Detect file type from filename.
     *
     * @param filename the original filename
     * @return file type (CSV or JSON)
     */
    public String detectFileType(String filename) {
        if (filename == null || filename.isEmpty()) {
            throw new IllegalArgumentException("Filename cannot be null or empty");
        }
        
        String extension = filename.substring(filename.lastIndexOf(".") + 1).toUpperCase();
        
        if ("CSV".equals(extension) || "JSON".equals(extension)) {
            return extension;
        }
        
        throw new IllegalArgumentException("Unsupported file type: " + extension + ". Only CSV and JSON are supported.");
    }

    /**
     * Parse file content based on detected file type.
     *
     * @param fileContent the file content as bytes
     * @param fileType the file type (CSV or JSON)
     * @return List of maps, each representing a row
     * @throws IOException if parsing fails
     */
    public List<Map<String, Object>> parseFile(byte[] fileContent, String fileType) throws IOException {
        if ("CSV".equalsIgnoreCase(fileType)) {
            return parseCSV(fileContent);
        } else if ("JSON".equalsIgnoreCase(fileType)) {
            return parseJSON(fileContent);
        } else {
            throw new IllegalArgumentException("Unsupported file type: " + fileType);
        }
    }
}
