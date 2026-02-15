import React, { useRef, useState } from 'react';
import { useFileProcessing } from '@/hooks/useFileProcessing';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileCheck, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { ProcessedRowsTable } from '@/components/ProcessedRowsTable';

/**
 * File upload component with real-time progress tracking
 * Shows upload status, processing progress, results, and allows download
 */
export const FileUploadWithProgress: React.FC<{
  tenantId: string;
  datasetId: string;
  onComplete?: (results: any[]) => void;
}> = ({ tenantId, datasetId, onComplete }) => {
  const { jobId, status, isUploading, isPolling, error, uploadFile } = useFileProcessing();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.type === 'text/csv' || file.type === 'application/json' || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
      setSelectedFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      const newJobId = await uploadFile(selectedFile, tenantId, datasetId);
      return newJobId;
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  const getStatusColor = () => {
    if (!status) return 'bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50';
    switch (status.status) {
      case 'COMPLETED':
        return 'bg-green-50/80 dark:bg-green-900/20 border-green-200/50 dark:border-green-700/50';
      case 'FAILED':
        return 'bg-red-50/80 dark:bg-red-900/20 border-red-200/50 dark:border-red-700/50';
      case 'PROCESSING':
        return 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-700/50';
      default:
        return 'bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50';
    }
  };

  const getStatusBadgeColor = () => {
    if (!status) return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    switch (status.status) {
      case 'COMPLETED':
        return 'bg-green-500 text-white';
      case 'FAILED':
        return 'bg-red-500 text-white';
      case 'PROCESSING':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Upload Section */}
      {!status || status.status === 'COMPLETED' || status.status === 'FAILED' ? (
        <div className="rounded-3xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden">
          <div className="p-8">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed p-16 transition-all duration-300 ${
                isDragging
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 scale-[1.02] shadow-2xl shadow-blue-500/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-gradient-to-br from-gray-50/50 to-blue-50/30 dark:from-gray-900/30 dark:to-blue-900/10'
              }`}
            >
              <div className="flex flex-col items-center justify-center text-center space-y-6">
                <div
                  className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all transform ${
                    isDragging
                      ? 'scale-110 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/40'
                      : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:scale-105'
                  }`}
                >
                  <Upload className={`w-10 h-10 transition-colors ${isDragging ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                </div>

                <div className="space-y-2 max-w-md">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isDragging ? 'Drop it here!' : selectedFile ? selectedFile.name : 'Drag & drop your file'}
                  </h3>
                  {selectedFile && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                  {!selectedFile && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Supports CSV and JSON files up to 100MB
                    </p>
                  )}
                </div>

                {!selectedFile && (
                  <div className="flex items-center gap-4 w-full max-w-xs">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">OR</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                  </div>
                )}

                <input ref={fileInputRef} type="file" onChange={handleFileInput} disabled={isUploading} accept=".csv,.json" className="hidden" />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50"
                >
                  {selectedFile ? '📁 Choose Different File' : '📁 Browse Files'}
                </Button>
              </div>
            </div>

            {selectedFile && (
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    '✨ Start Processing'
                  )}
                </Button>
                <Button
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                  variant="outline"
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Status Section */}
      {status && (
        <div className={`rounded-3xl backdrop-blur-xl border-2 shadow-xl overflow-hidden ${getStatusColor()}`}>
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  status.status === 'PROCESSING' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  status.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30' :
                  'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {status.status === 'PROCESSING' && <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />}
                  {status.status === 'COMPLETED' && <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />}
                  {status.status === 'FAILED' && <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{status.filename}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Job ID: {status.jobId.slice(0, 8)}...</p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-semibold shrink-0 ${getStatusBadgeColor()}`}>
                {status.status}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gray-100/50 dark:bg-gray-900/30">
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Rows</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{status.totalRows}</p>
              </div>
              <div className="p-4 rounded-xl bg-green-100/50 dark:bg-green-900/30">
                <p className="text-xs text-green-700 dark:text-green-400 uppercase tracking-wide">Processed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{status.processedRows}</p>
              </div>
              <div className="p-4 rounded-xl bg-red-100/50 dark:bg-red-900/30">
                <p className="text-xs text-red-700 dark:text-red-400 uppercase tracking-wide">Failed</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{status.failedRows}</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-100/50 dark:bg-blue-900/30">
                <p className="text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wide">Progress</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{status.progress}%</p>
              </div>
            </div>

            {/* Progress Bar */}
            {status.status === 'PROCESSING' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing Progress</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {status.processedRows + status.failedRows} / {status.totalRows} rows
                  </p>
                </div>
                <Progress value={status.progress} />
              </div>
            )}

            {/* Real-time Processed Rows Table */}
            {(status.status === 'PROCESSING' || status.status === 'COMPLETED') && status.jobId && (
              <ProcessedRowsTable 
                fileId={status.jobId}
                status={status.status}
                totalRows={status.totalRows}
              />
            )}

            {/* Error Message */}
            {status.status === 'FAILED' && status.errorMessage && (
              <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="font-semibold text-red-900 dark:text-red-200">Error Details</p>
                <p className="text-sm text-red-800 dark:text-red-300 mt-1">{status.errorMessage}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <p>Started: {new Date(status.startTime).toLocaleTimeString()}</p>
              {status.endTime && (
                <p>Completed: {new Date(status.endTime).toLocaleTimeString()}</p>
              )}
            </div>

            {/* Active polling indicator */}
            {status.status === 'PROCESSING' && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                <span>Updating in real-time...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Section */}
      {status?.status === 'COMPLETED' && status.results && (
        <div className="rounded-3xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-green-200/50 dark:border-green-800/50 shadow-xl overflow-hidden">
          <div className="p-8 space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Processing Results</h3>
            
            {/* Summary */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/50">
              <p className="text-green-800 dark:text-green-300">
                ✓ Successfully processed <span className="font-bold">{status.processedRows}</span> rows
                {status.failedRows > 0 && ` (${status.failedRows} failed)`}
              </p>
            </div>

            {/* Results Table Preview */}
            {status.results.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Row #</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Suggestion</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {status.results.slice(0, 10).map((result: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/30">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{result.rowNumber}</td>
                        <td className="px-4 py-3">
                          {result.error ? (
                            <span className="text-red-600 dark:text-red-400">❌ Error</span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400">✓ Success</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {result.result?.suggestion?.suggested_fix || result.result?.field || 'No issues'}
                        </td>
                        <td className="px-4 py-3">
                          {result.result?.confidence && (
                            <span className="text-gray-600 dark:text-gray-400">{(result.result.confidence * 100).toFixed(0)}%</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {status.results.length > 10 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing 10 of {status.results.length} results
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={() => {
                  const json = JSON.stringify(status.results, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${status.filename}-results.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              >
                📥 Download Results
              </Button>
              <Button
                onClick={() => setSelectedFile(null)}
                variant="outline"
                className="flex-1"
              >
                📤 Upload Another File
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
