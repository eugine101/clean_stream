"use client";

import { Charts } from "./components/charts";
import { ProcessSteps } from "@/components/process-steps";
import { StatsCard } from "@/components/ui/stats-card";
import { DataTable } from "@/components/ui/data-table";
import { Upload, FileCheck, TrendingUp, Activity, BarChart3, Clock, Sparkles, Zap } from "lucide-react";
import { AppStateProvider, useAppState } from "@/context/AppStateContext";

function DashboardClient() {
  const { files, loading } = useAppState();

  const totalUploads = files.length;
  const successful = files.filter((f: any) => f.status === "COMPLETED" || f.status === "Completed" || f.status === "PROCESSED").length;
  const processing = files.filter((f: any) => f.status === "PROCESSING" || f.status === "Processing").length;
  const rowsProcessed = files.reduce((sum: number, f: any) => sum + (f.fileSize || 0), 0);

  const recentActivity = files
    .slice()
    .reverse()
    .slice(0, 8)
    .map((f: any, idx: number) => ({
      id: idx,
      fileName: f.filename || "-",
      uploadDate: f.uploadedAt ? new Date(f.uploadedAt).toLocaleString() : "-",
      status: f.status || "-",
      rows: f.fileSize ? f.fileSize.toLocaleString() : "-",
    }));

  const latestFile = files.length > 0 ? files[files.length - 1] : null;

  const successRate = totalUploads > 0 ? ((successful / totalUploads) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-950 dark:via-blue-950/20 dark:to-indigo-950/20">
      {/* Glassmorphic Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Real-time insights and analytics • Updated {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
            {processing > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 border border-orange-200 dark:border-orange-800">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">{processing} processing</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="group p-6 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <Sparkles className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Total Uploads</p>
            <p className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {loading ? "..." : totalUploads}
            </p>
          </div>

          <div className="group p-6 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
              <div className="px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                {successRate}%
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Successful</p>
            <p className="text-3xl font-bold bg-gradient-to-br from-emerald-600 to-green-600 bg-clip-text text-transparent">
              {successful}
            </p>
          </div>

          <div className="group p-6 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <Zap className="w-4 h-4 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Data Processed</p>
            <p className="text-3xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {(rowsProcessed / 1024).toFixed(1)} KB
            </p>
          </div>

          <div className="group p-6 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6 text-white" />
              </div>
              {processing > 0 && <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Processing</p>
            <p className="text-3xl font-bold bg-gradient-to-br from-orange-600 to-amber-600 bg-clip-text text-transparent">
              {loading ? "..." : processing}
            </p>
          </div>
        </div>

        {/* Active Processing Steps */}
        {latestFile && (
          <div className="rounded-3xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Latest Upload Processing</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{latestFile.filename}</p>
                </div>
              </div>
              <ProcessSteps status={latestFile.status} errorMessage={latestFile.errorMessage} />
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="group rounded-3xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upload Trends</h2>
              </div>
              <Charts />
            </div>
          </div>

          <div className="group rounded-3xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Processing Volume</h2>
              </div>
              <Charts />
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="rounded-3xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Last {recentActivity.length} uploads</span>
            </div>
            <DataTable
              data={recentActivity}
              columns={[
                {
                  key: "fileName",
                  header: "File Name",
                  render: (item) => (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center shrink-0">
                        <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{item.fileName}</span>
                    </div>
                  ),
                },
                {
                  key: "uploadDate",
                  header: "Upload Date",
                  render: (item) => (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{item.uploadDate}</span>
                    </div>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (item) => {
                    const isCompleted = item.status === "Completed" || item.status === "COMPLETED" || item.status === "PROCESSED";
                    const isFailed = item.status === "Failed";
                    const isProcessing = item.status === "PROCESSING" || item.status === "Processing";

                    return (
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : isFailed
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                            : isProcessing
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                        }`}
                      >
                        {isProcessing && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                        {isCompleted && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                        {isFailed && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                        {item.status}
                      </span>
                    );
                  },
                },
                {
                  key: "rows",
                  header: "Rows",
                  render: (item) => <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.rows}</span>,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AppStateProvider>
      <DashboardClient />
    </AppStateProvider>
  );
}