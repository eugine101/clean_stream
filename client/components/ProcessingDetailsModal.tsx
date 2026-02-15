"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { ProcessedRowsTable } from "@/components/ProcessedRowsTable";

interface ProcessingDetailsModalProps {
  fileId: string;
  filename: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ProcessingDetailsModal({
  fileId,
  filename,
  isOpen,
  onClose,
}: ProcessingDetailsModalProps) {
  const [status, setStatus] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPauseLoading, setIsPauseLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getFileStatus(fileId);
      setStatus(data);
      setIsPaused(data.status === "PAUSED");
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch status";
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    if (!isOpen) return;
    fetchStatus();
  }, [isOpen, fetchStatus]);

  // Auto-refresh while processing
  useEffect(() => {
    if (!isOpen || !status || (status.status !== "PROCESSING" && status.status !== "PAUSED")) {
      return;
    }

    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [isOpen, status, fetchStatus]);

  const handlePause = async () => {
    setIsPauseLoading(true);
    try {
      await api.pauseFile(fileId);
      setIsPaused(true);
      await fetchStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to pause";
      setError(errorMessage);
    } finally {
      setIsPauseLoading(false);
    }
  };

  const handleResume = async () => {
    setIsPauseLoading(true);
    try {
      await api.resumeFile(fileId);
      setIsPaused(false);
      await fetchStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to resume";
      setError(errorMessage);
    } finally {
      setIsPauseLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto rounded-3xl shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                {filename}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                ID: {fileId.slice(0, 12)}...
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50">
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">Error</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            </Card>
          )}

          {isLoading && !status ? (
            <div className="flex items-center justify-center p-12">
              <Loader />
            </div>
          ) : status ? (
            <>
              {/* Status Header */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                      isPaused 
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : status.status === "PROCESSING"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : status.status === "COMPLETED"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {isPaused ? "⏸ PAUSED" : status.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {status.processedRows + status.failedRows} of {status.totalRows} rows processed
                  </p>
                </div>

                {(status.status === "PROCESSING" || status.status === "PAUSED") && (
                  <div className="flex gap-2">
                    {isPaused ? (
                      <Button
                        onClick={handleResume}
                        disabled={isPauseLoading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    ) : (
                      <Button
                        onClick={handlePause}
                        disabled={isPauseLoading}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Processed</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                    {status.processedRows}
                  </p>
                </Card>
                <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">Failed</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
                    {status.failedRows}
                  </p>
                </Card>
                <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">Progress</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                    {status.progress}%
                  </p>
                </Card>
                <Card className="p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Remaining</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                    {status.totalRows - (status.processedRows + status.failedRows)}
                  </p>
                </Card>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500"
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {status.progress === 100 ? "Completed" : `${status.progress}% complete`}
                </p>
              </div>

              {/* Real-time Rows Table */}
              <ProcessedRowsTable
                fileId={fileId}
                status={isPaused ? "PAUSED" : status.status}
                totalRows={status.totalRows}
              />

              {/* Auto-refresh indicator */}
              {(status.status === "PROCESSING" || status.status === "PAUSED") && (
                <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                  📡 {isPaused ? "Processing paused" : "Auto-updating every 2 seconds..."}
                </p>
              )}
            </>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
