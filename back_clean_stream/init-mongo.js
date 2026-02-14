db = db.getSiblingDB('clean-data-db');

db.createCollection('fileRecords');
db.createCollection('outputFiles');

db.fileRecords.createIndex({ status: 1 });
db.fileRecords.createIndex({ filename: 1 });
db.fileRecords.createIndex({ fileType: 1 });
db.fileRecords.createIndex({ uploadedAt: 1 });

db.outputFiles.createIndex({ inputFileId: 1 });
db.outputFiles.createIndex({ n8nWorkflowId: 1 });
db.outputFiles.createIndex({ fileType: 1 });
db.outputFiles.createIndex({ createdAt: 1 });

print("Initialized clean-data-db with collections and indexes");
