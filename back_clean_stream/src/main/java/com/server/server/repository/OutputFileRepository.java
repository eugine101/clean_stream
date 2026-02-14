package com.server.server.repository;

import com.server.server.model.OutputFile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OutputFileRepository extends MongoRepository<OutputFile, String> {
    List<OutputFile> findByInputFileId(String inputFileId);
    Optional<OutputFile> findByN8nWorkflowId(String workflowId);
    List<OutputFile> findByFileType(String fileType);
}
