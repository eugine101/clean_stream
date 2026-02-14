package com.server.server.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class MongoDbInitializer implements CommandLineRunner {

    private final MongoTemplate mongoTemplate;

    public MongoDbInitializer(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        log.info("Initializing MongoDB collections and indexes...");

        try {
            // Create fileRecords collection if it doesn't exist
            if (!mongoTemplate.collectionExists("fileRecords")) {
                mongoTemplate.createCollection("fileRecords");
                log.info("Created fileRecords collection");
            }

            // Create indexes for fileRecords
            mongoTemplate.getCollection("fileRecords").createIndex(new org.bson.Document("status", 1));
            mongoTemplate.getCollection("fileRecords").createIndex(new org.bson.Document("filename", 1));
            mongoTemplate.getCollection("fileRecords").createIndex(new org.bson.Document("fileType", 1));
            mongoTemplate.getCollection("fileRecords").createIndex(new org.bson.Document("uploadedAt", 1));
            log.info("Created indexes for fileRecords collection");

            // Create outputFiles collection if it doesn't exist
            if (!mongoTemplate.collectionExists("outputFiles")) {
                mongoTemplate.createCollection("outputFiles");
                log.info("Created outputFiles collection");
            }

            // Create indexes for outputFiles
            mongoTemplate.getCollection("outputFiles").createIndex(new org.bson.Document("inputFileId", 1));
            mongoTemplate.getCollection("outputFiles").createIndex(new org.bson.Document("n8nWorkflowId", 1));
            mongoTemplate.getCollection("outputFiles").createIndex(new org.bson.Document("fileType", 1));
            mongoTemplate.getCollection("outputFiles").createIndex(new org.bson.Document("createdAt", 1));
            log.info("Created indexes for outputFiles collection");

            log.info("✅ MongoDB initialization completed successfully");

        } catch (Exception e) {
            log.error("❌ Error initializing MongoDB: {}", e.getMessage(), e);
            throw e;
        }
    }
}
