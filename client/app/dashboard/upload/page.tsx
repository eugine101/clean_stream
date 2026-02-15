"use client";

import { Upload, Sparkles, Zap, Database } from "lucide-react";
import { FileUploadWithProgress } from "@/components/FileUploadWithProgress";
import { useAppState } from "@/context/AppStateContext";
import { useState } from "react";

export default function Page() {
  const { tenantId } = useAppState();
  const [datasetId] = useState<string>("");

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
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Real-time Processing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Live progress tracking with instant updates</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Lightning Fast</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Optimized for large datasets up to 100MB</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 flex items-center justify-center mb-3">
              <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">AI-Powered</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Smart data cleaning with AI suggestions</p>
          </div>
        </div>

        {/* Upload Component */}
        <FileUploadWithProgress
          tenantId={tenantId || "default-tenant"}
          datasetId={datasetId}
          onComplete={(results) => {
            console.log("Processing complete:", results);
          }}
        />
      </div>
    </div>
  );
}