'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDatasetWebSocket, WebSocketRow } from '@/hooks/useDatasetWebSocket';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

interface ProcessedRowData {
  rowIndex: number;
  cleanedRow: Record<string, any>;
  confidence: number;
  timestamp: number;
}

interface RealtimeProcessingDisplayProps {
  datasetId: string;
  tenantId?: string;
  totalRows: number;
  onProcessingComplete?: (stats: { processed: number; failed: number; total: number }) => void;
}

export function RealtimeProcessingDisplay({
  datasetId,
  tenantId = 'default-tenant',
  totalRows,
  onProcessingComplete
}: RealtimeProcessingDisplayProps) {
  const [processedRows, setProcessedRows] = useState<ProcessedRowData[]>([]);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRowReceived = useCallback((row: WebSocketRow) => {
    if (row.type === 'row' && row.cleanedRow && row.rowIndex !== undefined) {
      setProcessedRows(prev => {
        const updated = [...prev];
        updated[row.rowIndex!] = {
          rowIndex: row.rowIndex!,
          cleanedRow: row.cleanedRow!,
          confidence: row.confidence || 0,
          timestamp: row.timestamp || Date.now()
        };
        return updated.sort((a, b) => a.rowIndex - b.rowIndex);
      });
    }
  }, []);

  const handleProgressUpdate = useCallback((
    progressPercent: number,
    processed: number,
    total: number,
    failed: number
  ) => {
    setProgress(progressPercent);
    setProcessedCount(processed);
    setFailedCount(failed);
  }, []);

  const handleCompleted = useCallback((stats: {
    processed: number;
    failed: number;
    total: number;
  }) => {
    setIsCompleted(true);
    setProgress(100);
    onProcessingComplete?.(stats);
  }, [onProcessingComplete]);

  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg);
  }, []);

  const { isConnected, connectionError } = useDatasetWebSocket({
    datasetId,
    tenantId,
    onRowReceived: handleRowReceived,
    onProgressUpdate: handleProgressUpdate,
    onCompleted: handleCompleted,
    onError: handleError,
    autoConnect: true
  });

  const remainingRows = totalRows - processedCount - failedCount;
  const successRate = processedCount + failedCount > 0
    ? ((processedCount / (processedCount + failedCount)) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-muted-foreground">
          {isConnected ? 'Connected to live stream' : 'Connecting...'}
        </span>
        {connectionError && (
          <span className="text-red-500 ml-2">{connectionError}</span>
        )}
      </div>

      {/* Progress Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Processing Progress
          </CardTitle>
          <CardDescription>
            Real-time dataset processing with {totalRows} total rows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{Math.round(progress)}%</span>
              <span className="text-muted-foreground">
                {processedCount + failedCount} / {totalRows} rows processed
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950">
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">Processed</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{processedCount}</div>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950">
              <div className="text-xs text-red-600 dark:text-red-400 font-medium">Failed</div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">{failedCount}</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Remaining</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{remainingRows}</div>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950">
              <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Success Rate</div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{successRate}%</div>
            </div>
          </div>

          {/* Completion Status */}
          {isCompleted && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300 font-medium">
                Dataset processing completed successfully!
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Rows Table */}
      {processedRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Processed Rows ({processedRows.length})</CardTitle>
            <CardDescription>Live stream of cleaned data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {processedRows.map((row) => (
                <div
                  key={row.rowIndex}
                  className="p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Row #{row.rowIndex}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        Confidence: {(row.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(row.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(row.cleanedRow).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="font-medium text-muted-foreground">{key}:</span>{' '}
                        <span className="text-foreground">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
