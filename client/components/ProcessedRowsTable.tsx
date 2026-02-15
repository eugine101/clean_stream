"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loader  from "@/components/loader";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProcessedRowsTableProps {
  fileId: string;
  status: string;
  totalRows: number;
}

interface RowData {
  rowNumber: number;
  rowData: Record<string, unknown>;
  result: {
    fix?: string;
    confidence?: number;
    [key: string]: unknown;
  } | null;
  error: string | null;
}

interface ProcessedRowsResponse {
  jobId: string;
  filename: string;
  status: string;
  totalProcessed: number;
  totalRows: number;
  progress: number;
  page: number;
  pageSize: number;
  totalPages: number;
  rows: RowData[];
}

export function ProcessedRowsTable({
  fileId,
  status,
  totalRows,
}: ProcessedRowsTableProps) {
  const [data, setData] = useState<ProcessedRowsResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;

  // Fetch rows with pagination
  const fetchRows = useCallback(async () => {
    try {
      setError(null);
      const response = await api.getProcessedRows(fileId, currentPage, pageSize);
      setData(response);
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch rows";
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [fileId, currentPage, pageSize]);

  // Fetch rows on mount and when page changes
  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Auto-refresh while processing
  useEffect(() => {
    if (status?.toUpperCase() !== "PROCESSING" && status?.toUpperCase() !== "UPLOADING") {
      return;
    }

    const interval = setInterval(fetchRows, 2000); // Refresh every 2 seconds while processing
    return () => clearInterval(interval);
  }, [status, fetchRows]);

  const handleNextPage = () => {
    if (data && currentPage < data.totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50">
        <p className="text-sm font-semibold text-red-800 dark:text-red-300">Error loading rows</p>
        <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
      </Card>
    );
  }

  if (!data || data.rows.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">No processed rows yet</p>
        {status?.toUpperCase() === "PROCESSING" && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Processing in progress...</p>
        )}
      </Card>
    );
  }

  // Get column names from first row
  const columnNames = data.rows.length > 0
    ? Object.keys(data.rows[0].rowData || {})
    : [];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="p-3 bg-blue-50 dark:bg-blue-900/20">
          <p className="text-xs text-gray-600 dark:text-gray-400">Processed</p>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{data.totalProcessed}</p>
        </Card>
        <Card className="p-3 bg-purple-50 dark:bg-purple-900/20">
          <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{data.totalRows}</p>
        </Card>
        <Card className="p-3 bg-green-50 dark:bg-green-900/20">
          <p className="text-xs text-gray-600 dark:text-gray-400">Progress</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-300">{data.progress}%</p>
        </Card>
        <Card className="p-3 bg-indigo-50 dark:bg-indigo-900/20">
          <p className="text-xs text-gray-600 dark:text-gray-400">Remaining</p>
          <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
            {data.totalRows - data.totalProcessed}
          </p>
        </Card>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                  Row #
                </th>
                {columnNames.slice(0, 5).map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white truncate"
                  >
                    {col}
                  </th>
                ))}
                {columnNames.length > 5 && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">
                    +{columnNames.length - 5} more
                  </th>
                )}
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                  AI Fix
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                  Confidence
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {data.rows.map((row, index) => (
                <tr
                  key={`${data.page}-${index}`}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-200">{row.rowNumber}</td>
                  {columnNames.slice(0, 5).map((col) => (
                    <td
                      key={col}
                      className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate max-w-xs"
                      title={String(row.rowData[col] || "")}
                    >
                      {String(row.rowData[col] || "-").substring(0, 50)}
                    </td>
                  ))}
                  {columnNames.length > 5 && <td className="px-4 py-3 text-xs text-gray-500">...</td>}
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate max-w-xs">
                    {row.error ? (
                      <span className="text-xs text-gray-500">-</span>
                    ) : (
                      <span title={String(row.result?.fix || "")} className="text-xs">
                        {String(row.result?.fix || "-").substring(0, 40)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.error ? (
                      <span className="text-xs text-gray-500">-</span>
                    ) : row.result?.confidence ? (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        (row.result.confidence as number) >= 0.8 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : (row.result.confidence as number) >= 0.6
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                      }`}>
                        {((row.result.confidence as number) * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.error ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                        ✗ Error
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        ✓ Success
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {data.page + 1} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= data.totalPages - 1}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Auto-refresh indicator */}
      {status?.toUpperCase() === "PROCESSING" && (
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
          📡 Auto-refreshing every 2 seconds...
        </p>
      )}
    </div>
  );
}
