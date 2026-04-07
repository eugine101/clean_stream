"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Lightbulb,
  TrendingUp,
  Download,
  Filter,
  Eye,
  EyeOff 
} from "lucide-react";
import * as api from "@/lib/api";

interface Row {
  rowNumber: number;
  rowData: Record<string, any>;
  result?: {
    tenantId?: string;
    datasetId?: string;
    result?: {
      id?: number;
      status?: string;
      suggestion?: {
        field: string;
        issue_type: string;
        suggested_fix: string;
        confidence: number;
        notes?: string;
      };
      suggestions?: Array<{
        field: string;
        issue?: string;
        issue_type?: string;
        suggestion?: string;
        suggested_fix?: string;
        confidence: number;
        notes?: string;
      }>;
    };
  };
  error?: string | null;
}

interface RowWithCleaning extends Row {}

interface DataCleaningDetailsViewProps {
  fileId: string;
  fileName: string;
}

export function DataCleaningDetailsView({ fileId, fileName }: DataCleaningDetailsViewProps) {
  const [rows, setRows] = useState<RowWithCleaning[]>([]);
  const [filteredRows, setFilteredRows] = useState<RowWithCleaning[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "cleaned" | "failed">("all");
  const [columns, setColumns] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const pageSize = 50;
  const [page, setPage] = useState(0);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.getProcessedRows(fileId, page, pageSize);
        setRows(response.rows || []);
        
        // Extract columns from first row
        if (response.rows && response.rows.length > 0) {
          const cols = Object.keys(response.rows[0].rowData || {});
          setColumns(cols);
          setVisibleColumns(new Set(cols.slice(0, 5))); // Show first 5 columns by default
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [fileId, page, pageSize]);

  // Filter rows based on search and status
  useEffect(() => {
    let filtered = rows;

    // Filter by status
    if (filterStatus === "cleaned") {
      filtered = filtered.filter(r => !r.error && r.result?.result?.status === "processed");
    } else if (filterStatus === "failed") {
      filtered = filtered.filter(r => r.error || r.result?.result?.status !== "processed");
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(r => {
        const rowStr = JSON.stringify(r.rowData).toLowerCase();
        const suggestion = r.result?.result?.suggestion?.suggested_fix?.toLowerCase() || "";
        const suggestions = (r.result?.result?.suggestions || [])
          .map(s => s.suggested_fix?.toLowerCase() || s.suggestion?.toLowerCase() || "")
          .join(" ");
        return rowStr.includes(searchQuery.toLowerCase()) || suggestion.includes(searchQuery.toLowerCase()) || suggestions.includes(searchQuery.toLowerCase());
      });
    }

    setFilteredRows(filtered);
  }, [rows, searchQuery, filterStatus]);

  const stats = {
    total: rows.length,
    cleaned: rows.filter(r => !r.error && r.result?.result?.status === "processed").length,
    failed: rows.filter(r => r.error || r.result?.result?.status !== "processed").length,
    avgConfidence: rows.reduce((sum, r) => {
      const suggestion = r.result?.result?.suggestion?.confidence || 0;
      const suggestions = (r.result?.result?.suggestions || []).reduce((max, s) => Math.max(max, s.confidence || 0), 0);
      return sum + Math.max(suggestion, suggestions);
    }, 0) / (rows.length || 1),
  };

  const toggleColumnVisibility = (col: string) => {
    const newSet = new Set(visibleColumns);
    if (newSet.has(col)) {
      newSet.delete(col);
    } else {
      newSet.add(col);
    }
    setVisibleColumns(newSet);
  };

  const handleDownload = () => {
    const csv = generateCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}_details.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateCSV = () => {
    const headers = ["Row #", "Status", "Max Confidence", "Fields with Suggestions", "Issues and Fixes", ...Array.from(visibleColumns)];
    const rows_csv = filteredRows.map(r => {
      const suggestion = r.result?.result?.suggestion;
      const suggestions = r.result?.result?.suggestions || [];
      const allSuggestions = suggestion ? [suggestion, ...suggestions] : suggestions;
      
      const fields = allSuggestions.map(s => s.field).join("; ");
      const fixes = allSuggestions.map(s => {
        const issue = (s as any).issue_type || (s as any).issue || "";
        const fix = (s as any).suggested_fix || (s as any).suggestion || "";
        return `${issue}: ${fix}`;
      }).join("; ");
      const maxConf = allSuggestions.length > 0 
        ? Math.max(...allSuggestions.map(s => s.confidence || 0)) 
        : 0;
      
      return [
        r.rowNumber,
        r.error ? "Error" : "Success",
        maxConf > 0 ? (maxConf * 100).toFixed(0) + "%" : "-",
        fields || "-",
        fixes || "-",
        ...Array.from(visibleColumns).map(col => r.rowData[col] || ""),
      ];
    });
    
    const csv = [headers, ...rows_csv].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    return csv;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wide">Total Rows</p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{stats.total}</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-400 uppercase tracking-wide">Cleaned</p>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">{stats.cleaned}</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border-red-200 dark:border-red-800">
          <p className="text-xs text-red-700 dark:text-red-400 uppercase tracking-wide">Failed</p>
          <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-2">{stats.failed}</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
          <p className="text-xs text-purple-700 dark:text-purple-400 uppercase tracking-wide">Avg Confidence</p>
          <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">{(stats.avgConfidence * 100).toFixed(0)}%</p>
        </Card>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search rows or suggestions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-lg"
              />
            </div>
          </div>
          <Button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            variant="outline"
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Columns
          </Button>
          <Button
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3">
          {(["all", "cleaned", "failed"] as const).map(status => (
            <Button
              key={status}
              onClick={() => setFilterStatus(status)}
              variant={filterStatus === status ? "default" : "outline"}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>

        {/* Column Selector */}
        {showColumnSelector && (
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Visible Columns</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {columns.map(col => (
                <label key={col} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(col)}
                    onChange={() => toggleColumnVisibility(col)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{col}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-24">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-24">Confidence</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Preview</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-12">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRows.map((row, idx) => (
                <tbody key={row.rowNumber}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{row.rowNumber}</td>
                    <td className="px-4 py-3">
                      {row.error ? (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-xs text-red-600 dark:text-red-400">Error</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-green-600 dark:text-green-400">Success</span>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const suggestion = row.result?.result?.suggestion;
                        const suggestions = row.result?.result?.suggestions || [];
                        const allSuggestions = suggestion ? [suggestion, ...suggestions] : suggestions;
                        const maxConf = allSuggestions.length > 0 
                          ? Math.max(...allSuggestions.map(s => s.confidence || 0))
                          : 0;
                        
                        if (maxConf === 0) return null;
                        
                        return (
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            maxConf >= 0.8 
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : maxConf >= 0.6
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          }`}>
                            {(maxConf * 100).toFixed(0)}%
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                      {(() => {
                        const suggestion = row.result?.result?.suggestion;
                        const suggestions = row.result?.result?.suggestions || [];
                        const allSuggestions = suggestion ? [suggestion, ...suggestions] : suggestions;
                        
                        if (allSuggestions.length === 0) {
                          return <span className="text-gray-500">No issues</span>;
                        }
                        
                        return (
                          <div className="space-y-1">
                            {allSuggestions.slice(0, 2).map((s, idx) => (
                              <span key={idx} className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-xs block">
                                {s.field}: {(s as any).suggested_fix || (s as any).suggestion}
                              </span>
                            ))}
                            {allSuggestions.length > 2 && (
                              <span className="text-xs text-gray-500 px-2">+{allSuggestions.length - 2} more</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedRow(expandedRow === row.rowNumber ? null : row.rowNumber)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
                      >
                        {expandedRow === row.rowNumber ? (
                          <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Row Details */}
                  {expandedRow === row.rowNumber && (
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="space-y-4">
                          {/* Original Data */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              Original Data
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {Array.from(visibleColumns).map(col => (
                                <div key={col} className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">{col}</p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 word-break">{String(row.rowData[col] || "-")}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Cleaning Results */}
                          {(() => {
                            const suggestion = row.result?.result?.suggestion;
                            const suggestions = row.result?.result?.suggestions || [];
                            const allSuggestions = suggestion ? [suggestion, ...suggestions] : suggestions;
                            
                            if (allSuggestions.length === 0) {
                              return (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    No Issues Found
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">This row passed validation with no cleaning suggestions needed.</p>
                                </div>
                              );
                            }
                            
                            return (
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                  <Lightbulb className="w-4 h-4" />
                                  Cleaning Suggestions ({allSuggestions.length})
                                </h4>
                                {allSuggestions.map((sug, idx) => (
                                  <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-800 space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-600 dark:text-gray-400">Field:</span>
                                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{sug.field}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-600 dark:text-gray-400">Issue Type:</span>
                                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{(sug as any).issue_type || (sug as any).issue || "Unknown"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-600 dark:text-gray-400">Suggested Fix:</span>
                                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{(sug as any).suggested_fix || (sug as any).suggestion}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-gray-600 dark:text-gray-400">Confidence:</span>
                                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{((sug.confidence || 0) * 100).toFixed(0)}%</span>
                                    </div>
                                    {((sug as any).notes || (sug as any).issue) && (
                                      <div className="flex justify-between">
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Notes:</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{(sug as any).notes || (sug as any).issue}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}

                          {row.error && (
                            <div className="p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                              <p className="text-sm text-red-700 dark:text-red-400">{row.error}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredRows.length === 0 && (
        <div className="text-center p-8 text-gray-600 dark:text-gray-400">
          No rows match your filters
        </div>
      )}
    </div>
  );
}
