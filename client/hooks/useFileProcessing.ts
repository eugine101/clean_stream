import { useState, useCallback, useEffect } from 'react';

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080"

export interface FileProcessingStatus {
  jobId: string;
  filename: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number; // 0-100
  totalRows: number;
  processedRows: number;
  failedRows: number;
  startTime: string;
  endTime?: string;
  lastUpdated: string;
  errorMessage?: string;
  results?: any[];
}

export const useFileProcessing = () => {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<FileProcessingStatus | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload file and start processing
  const uploadFile = useCallback(async (
    file: File,
    tenantId: string,
    datasetId: string
  ) => {
    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenantId', tenantId);
      formData.append('datasetId', datasetId);

      const response = await fetch(`${BASE}/api/process-file/upload-and-process`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      
      if (data.jobId) {
        setJobId(data.jobId);
        setIsPolling(true);
        return data.jobId;
      }

      throw new Error('No job ID returned');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMsg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Poll job status
  const pollJobStatus = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${BASE}/api/process-file/status/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }

      const data: FileProcessingStatus = await response.json();
      setStatus(data);

      // Stop polling when job is completed or failed
      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        setIsPolling(false);
        if (data.status === 'FAILED') {
          setError(data.errorMessage || 'Job processing failed');
        }
      }

      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMsg);
      setIsPolling(false);
      throw err;
    }
  }, []);

  // Auto-poll when jobId changes
  useEffect(() => {
    if (!jobId || !isPolling) return;

    const interval = setInterval(() => {
      pollJobStatus(jobId).catch((err) => {
        console.error('Polling error:', err);
      });
    }, 1000); // Poll every 1 second

    // Initial poll
    pollJobStatus(jobId).catch((err) => {
      console.error('Initial poll error:', err);
    });

    return () => clearInterval(interval);
  }, [jobId, isPolling, pollJobStatus]);

  return {
    jobId,
    status,
    isUploading,
    isPolling,
    error,
    uploadFile,
    pollJobStatus,
  };
};
