"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, RefreshCw, ChevronLeft, ChevronRight, AlertCircle, ChevronDown, Trash2, FileText, Clock, CheckCircle, XCircle, Loader2, Eye } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { ProcessingDetailsModal } from "@/components/ProcessingDetailsModal";
import * as api from "@/lib/api";

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [openOutputMenu, setOpenOutputMenu] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const itemsPerPage = 10;

  const { files, loading, error, refresh } = useAppState();

  const allUploads = files.map((f: any, idx: number) => ({
    id: idx,
    fileId: f.fileId || f.id,
    fileName: f.filename || "-",
    uploadDate: f.uploadedAt ? new Date(f.uploadedAt).toLocaleString() : "-",
    status: f.status || "-",
    rows: f.fileSize ? f.fileSize.toLocaleString() : "-",
    size: f.fileSize ? `${(f.fileSize / 1024).toFixed(1)} KB` : "-"
  }));

  const filteredUploads = allUploads.filter((upload) => {
    const matchesSearch = upload.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || upload.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUploads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUploads = filteredUploads.slice(startIndex, startIndex + itemsPerPage);

  const handleRetry = async (fileId: string) => {
    setRetrying(fileId);
    try {
      await api.retryFile(fileId);
      await refresh();
    } catch (err: any) {
      console.error("Retry failed:", err);
    } finally {
      setRetrying(null);
    }
  };

  const handleDownloadOutput = async (fileId: string, filename: string, format: string = "JSON") => {
    setDownloadingFormat(`${fileId}-${format}`);
    try {
      const blob = await api.downloadOutputFile(fileId, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const ext = format.toUpperCase() === "CSV" ? ".csv" : format.toUpperCase() === "XLSX" ? ".xlsx" : ".json";
      link.download = filename.replace(/\.[^/.]+$/, "_cleaned") + ext;
      link.click();
      URL.revokeObjectURL(url);
      setOpenOutputMenu(null);
    } catch (err: any) {
      console.error("Download failed:", err);
      alert("Failed to download output file: " + err.message);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownloadInput = async (fileId: string, filename: string) => {
    try {
      const { blob, filename: downloadFilename } = await api.downloadInputFile(fileId, filename);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Download failed:", err);
      alert("Failed to download input file: " + err.message);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file record?")) return;
    try {
      await api.deleteFile(fileId);
      await refresh();
    } catch (err: any) {
      console.error("Delete failed:", err);
    }
  };

  const getStatusIcon = (status: string) => {
    const upperStatus = status.toUpperCase();
    if (upperStatus === "COMPLETED") return <CheckCircle className="w-4 h-4" />;
    if (upperStatus === "FAILED") return <XCircle className="w-4 h-4" />;
    return <Loader2 className="w-4 h-4 animate-spin" />;
  };

  const statusOptions = [
    { value: "all", label: "All Files", count: allUploads.length },
    { value: "Completed", label: "Completed", count: allUploads.filter(u => u.status.toUpperCase() === "COMPLETED").length },
    { value: "Processing", label: "Processing", count: allUploads.filter(u => u.status.toUpperCase() === "PROCESSING").length },
    { value: "Failed", label: "Failed", count: allUploads.filter(u => u.status.toUpperCase() === "FAILED").length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-950 dark:via-blue-950/20 dark:to-indigo-950/20">
      {/* Glassmorphic Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Upload History
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {filteredUploads.length} {filteredUploads.length === 1 ? 'file' : 'files'} • Last updated {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => refresh()} 
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 p-5 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-900 dark:text-red-200">Error loading files</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Status Filter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setStatusFilter(option.value);
                setCurrentPage(1);
              }}
              className={`p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
                statusFilter === option.value
                  ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 shadow-lg shadow-blue-500/20"
                  : "border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-gray-800/70 hover:border-blue-300 dark:hover:border-blue-700 backdrop-blur-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-medium ${
                  statusFilter === option.value 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-gray-600 dark:text-gray-400"
                }`}>
                  {option.label}
                </span>
                {statusFilter === option.value && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </div>
              <div className={`text-3xl font-bold ${
                statusFilter === option.value
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                  : "text-gray-900 dark:text-gray-100"
              }`}>
                {option.count}
              </div>
            </button>
          ))}
        </div>

        {/* Main Content Card */}
        <div className="rounded-3xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden">
          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by filename..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-12 h-12 rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Table */}
          {loading && allUploads.length === 0 ? (
            <div className="p-16 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading your files...</p>
            </div>
          ) : (
            <>
              <DataTable
                data={paginatedUploads}
                columns={[
                  { 
                    key: "fileName", 
                    header: "File Name",
                    render: (item: any) => (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{item.fileName}</span>
                      </div>
                    )
                  },
                  { 
                    key: "uploadDate", 
                    header: "Upload Date",
                    render: (item: any) => (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{item.uploadDate}</span>
                      </div>
                    )
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (item: any) => (
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        item.status.toUpperCase() === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : item.status.toUpperCase() === "FAILED"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {getStatusIcon(item.status)}
                        {item.status}
                      </span>
                    ),
                  },
                  { 
                    key: "rows", 
                    header: "Rows",
                    render: (item: any) => (
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.rows}</span>
                    )
                  },
                  { 
                    key: "size", 
                    header: "Size",
                    render: (item: any) => (
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.size}</span>
                    )
                  },
                  {
                    key: "actions",
                    header: "Actions",
                    render: (item: any) => (
                      <div className="flex gap-2 flex-wrap relative">
                        <button
                          onClick={() => handleDownloadInput(item.fileId, item.fileName)}
                          className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title="Download original input file"
                        >
                          Input
                        </button>
                        {(item.status.toUpperCase() === "COMPLETED" || item.status.toUpperCase() === "PROCESSING") && (
                          <div className="relative">
                            <button
                              onClick={() => setOpenOutputMenu(openOutputMenu === item.fileId ? null : item.fileId)}
                              className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg flex items-center gap-1 transition-colors"
                              title="Download processed output file"
                            >
                              Output
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            {openOutputMenu === item.fileId && (
                              <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden min-w-[120px]">
                                <button
                                  onClick={() => handleDownloadOutput(item.fileId, item.fileName, "JSON")}
                                  disabled={downloadingFormat === `${item.fileId}-JSON`}
                                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                >
                                  {downloadingFormat === `${item.fileId}-JSON` ? "⏳ JSON" : "JSON"}
                                </button>
                                <button
                                  onClick={() => handleDownloadOutput(item.fileId, item.fileName, "CSV")}
                                  disabled={downloadingFormat === `${item.fileId}-CSV`}
                                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                >
                                  {downloadingFormat === `${item.fileId}-CSV` ? "⏳ CSV" : "CSV"}
                                </button>
                                <button
                                  onClick={() => handleDownloadOutput(item.fileId, item.fileName, "XLSX")}
                                  disabled={downloadingFormat === `${item.fileId}-XLSX`}
                                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                >
                                  {downloadingFormat === `${item.fileId}-XLSX` ? "⏳ XLSX" : "XLSX"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {(item.status.toUpperCase() === "PROCESSING" || item.status.toUpperCase() === "PAUSED") && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setSelectedFileId(item.fileId);
                              setSelectedFileName(item.fileName);
                            }}
                            title="View processing details and manage pause/resume"
                            className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                          >
                            <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </Button>
                        )}
                        {item.status.toUpperCase() === "FAILED" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRetry(item.fileId)}
                            disabled={retrying === item.fileId}
                            title="Retry sending to n8n"
                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <RefreshCw className={`w-4 h-4 text-blue-600 dark:text-blue-400 ${retrying === item.fileId ? "animate-spin" : ""}`} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(item.fileId)}
                          title="Delete this file record"
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  }
                ]}
                emptyMessage="No uploads found matching your criteria"
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/30">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{startIndex + 1}</span> to{" "}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{Math.min(startIndex + itemsPerPage, filteredUploads.length)}</span> of{" "}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredUploads.length}</span> results
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="icon-sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`rounded-lg w-9 h-9 ${
                              currentPage === pageNum 
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30" 
                                : ""
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Processing Details Modal */}
      {selectedFileId && selectedFileName && (
        <ProcessingDetailsModal
          fileId={selectedFileId}
          filename={selectedFileName}
          isOpen={!!selectedFileId}
          onClose={() => {
            setSelectedFileId(null);
            setSelectedFileName(null);
          }}
        />
      )}
    </div>
  );
}