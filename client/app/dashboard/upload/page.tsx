"use client";

import { useState } from "react";
import { Upload, FileCheck, AlertCircle, CheckCircle2, XCircle, Sparkles, Zap, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppStateContext";

export default function Page() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<{
    totalRows: number;
    validRows: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);

  const { upload, refresh } = useAppState();

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
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setUploadStatus("idle");
    setUploadProgress(0);
    simulateValidation(file);
  };

  const simulateValidation = (file: File) => {
    const mockResults = {
      totalRows: Math.floor(Math.random() * 10000) + 1000,
      validRows: 0,
      errors: [] as Array<{ row: number; message: string }>
    };
    mockResults.validRows = mockResults.totalRows - Math.floor(Math.random() * 50);

    if (mockResults.validRows < mockResults.totalRows) {
      for (let i = 0; i < Math.min(5, mockResults.totalRows - mockResults.validRows); i++) {
        mockResults.errors.push({
          row: Math.floor(Math.random() * mockResults.totalRows) + 1,
          message: "Invalid email format"
        });
      }
    }

    setValidationResults(mockResults);
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;
    setUploadStatus("uploading");
    setUploadProgress(5);

    try {
      const res = await upload(uploadedFile);
      setUploadProgress(100);
      setUploadStatus("success");
      await refresh();
      return res;
    } catch (e: any) {
      setUploadStatus("error");
      setUploadProgress(0);
      console.error(e);
      return Promise.reject(e);
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setValidationResults(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-950 dark:via-blue-950/20 dark:to-indigo-950/20">
      {/* Glassmorphic Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Upload Data
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Upload CSV or JSON files for intelligent processing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Smart Validation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Automatic data quality checks</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Lightning Fast</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Optimized for large datasets</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 flex items-center justify-center mb-3">
              <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Secure Processing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Enterprise-grade security</p>
          </div>
        </div>

        {/* Drop Zone */}
        <div className="rounded-3xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden">
          <div className="p-8">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed p-16 transition-all duration-300 ${
                isDragging
                  ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 scale-[1.02] shadow-2xl shadow-blue-500/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-gradient-to-br from-gray-50/50 to-blue-50/30 dark:from-gray-900/30 dark:to-blue-900/10"
              }`}
            >
              <div className="flex flex-col items-center justify-center text-center space-y-6">
                <div
                  className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all transform ${
                    isDragging
                      ? "scale-110 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/40"
                      : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:scale-105"
                  }`}
                >
                  <Upload className={`w-10 h-10 transition-colors ${isDragging ? "text-white" : "text-gray-600 dark:text-gray-400"}`} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isDragging ? "Drop it here!" : "Drag & drop your file"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Supports CSV and JSON files up to 100MB
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full max-w-xs">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">OR</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                </div>

                <input type="file" id="file-upload" accept=".csv,.json" onChange={handleFileInput} className="hidden" />
                <label htmlFor="file-upload">
                  <Button
                    size="lg"
                    asChild
                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
                  >
                    <span className="cursor-pointer px-8">Browse Files</span>
                  </Button>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* File Details */}
        {uploadedFile && (
          <div className="rounded-3xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 space-y-6">
              {/* File Info Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                    <FileCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{uploadedFile.name}</h3>
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {uploadedFile.name.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset} className="shrink-0 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">
                  <XCircle className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>

              {/* Validation Results */}
              {validationResults && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Validation Complete</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="group p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/50 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide">Total Rows</p>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      </div>
                      <p className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {validationResults.totalRows.toLocaleString()}
                      </p>
                    </div>

                    <div className="group p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200/50 dark:border-emerald-800/50 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide">Valid Rows</p>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-3xl font-bold bg-gradient-to-br from-emerald-600 to-green-600 bg-clip-text text-transparent">
                        {validationResults.validRows.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Quality Score */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-800/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-purple-900 dark:text-purple-300">Data Quality Score</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {((validationResults.validRows / validationResults.totalRows) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-purple-200/50 dark:bg-purple-900/30 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-1000 ease-out rounded-full"
                        style={{ width: `${(validationResults.validRows / validationResults.totalRows) * 100}%` }}
                      />
                    </div>
                  </div>

                  {validationResults.errors.length > 0 && (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200/50 dark:border-amber-800/50">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-amber-900 dark:text-amber-400 mb-2">
                            Found {validationResults.errors.length} validation {validationResults.errors.length === 1 ? 'issue' : 'issues'}
                          </p>
                          <ul className="space-y-1.5">
                            {validationResults.errors.map((err, idx) => (
                              <li key={idx} className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                <span className="shrink-0 w-1 h-1 rounded-full bg-amber-500 mt-2" />
                                <span>Row {err.row}: {err.message}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Progress */}
              {uploadStatus === "uploading" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploading your file...</span>
                    <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full transition-all duration-300 ease-out rounded-full shadow-lg"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success Message */}
              {uploadStatus === "success" && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200/50 dark:border-emerald-800/50 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-900 dark:text-emerald-300">Upload completed successfully!</p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">Your file is now being processed.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {uploadStatus === "error" && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200/50 dark:border-red-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-900 dark:text-red-300">Upload failed</p>
                      <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">Please try again or contact support.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {uploadStatus !== "success" && (
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleUpload}
                    disabled={uploadStatus === "uploading"}
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadStatus === "uploading" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Start Upload
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}