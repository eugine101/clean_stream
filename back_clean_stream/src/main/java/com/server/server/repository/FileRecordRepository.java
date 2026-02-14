package com.server.server.repository;

import com.server.server.model.FileRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FileRecordRepository extends MongoRepository<FileRecord, String> {
    List<FileRecord> findByStatus(String status);
    Optional<FileRecord> findByFilename(String filename);
    List<FileRecord> findByFileType(String fileType);
}
