"use client";

import { CheckCircle2, Clock, AlertCircle, Zap, Database, FileCheck, BarChart3 } from "lucide-react";

interface ProcessStepsProps {
  status: string;
  errorMessage?: string;
}

export function ProcessSteps({ status, errorMessage }: ProcessStepsProps) {
  const steps = [
    {
      id: "uploaded",
      label: "File Uploaded",
      description: "File received and validated",
      icon: FileCheck,
      color: "blue",
      completed: ["UPLOADED", "PROCESSING", "COMPLETED", "PROCESSED"].includes(status?.toUpperCase()),
    },
    {
      id: "queued",
      label: "Queued",
      description: "Waiting for n8n processing",
      icon: Clock,
      color: "indigo",
      completed: ["PROCESSING", "COMPLETED", "PROCESSED"].includes(status?.toUpperCase()),
      active: status?.toUpperCase() === "PROCESSING",
    },
    {
      id: "processing",
      label: "Processing",
      description: "Running data cleaning pipeline",
      icon: Zap,
      color: "purple",
      completed: ["COMPLETED", "PROCESSED"].includes(status?.toUpperCase()),
      active: status?.toUpperCase() === "PROCESSING",
    },
    {
      id: "validation",
      label: "Validation",
      description: "Checking data quality",
      icon: Database,
      color: "violet",
      completed: ["COMPLETED", "PROCESSED"].includes(status?.toUpperCase()),
      active: false,
    },
    {
      id: "completed",
      label: "Completed",
      description: "Ready for download",
      icon: BarChart3,
      color: "green",
      completed: ["COMPLETED", "PROCESSED"].includes(status?.toUpperCase()),
      active: false,
    },
  ];

  const failed = status?.toUpperCase() === "FAILED";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const bgColor = {
            blue: "bg-blue-100 dark:bg-blue-900/30",
            indigo: "bg-indigo-100 dark:bg-indigo-900/30",
            purple: "bg-purple-100 dark:bg-purple-900/30",
            violet: "bg-violet-100 dark:bg-violet-900/30",
            green: "bg-green-100 dark:bg-green-900/30",
          }[step.color];

          const textColor = {
            blue: "text-blue-700 dark:text-blue-300",
            indigo: "text-indigo-700 dark:text-indigo-300",
            purple: "text-purple-700 dark:text-purple-300",
            violet: "text-violet-700 dark:text-violet-300",
            green: "text-green-700 dark:text-green-300",
          }[step.color];

          return (
            <div key={step.id} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-8 left-full w-4 h-0.5 ${
                    step.completed ? "bg-linear-to-r from-green-500 to-green-400" : "bg-gray-300 dark:bg-gray-700"
                  } hidden md:block`}
                />
              )}

              {/* Step card */}
              <div className={`text-center p-3 rounded-lg transition-all ${bgColor} ${step.active ? "ring-2 ring-offset-2 ring-yellow-400" : ""}`}>
                <div className="flex justify-center mb-2">
                  {step.completed ? (
                    <CheckCircle2 className={`w-8 h-8 ${textColor}`} />
                  ) : failed ? (
                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  ) : step.active ? (
                    <div className="relative">
                      <Icon className={`w-8 h-8 ${textColor} animate-pulse`} />
                      <div className="absolute inset-0 rounded-full animate-ping opacity-75" />
                    </div>
                  ) : (
                    <Icon className={`w-8 h-8 ${textColor} opacity-50`} />
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{step.label}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {failed && errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">Processing Failed</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Status badges */}
      <div className="flex gap-2 flex-wrap justify-center">
        <div className="px-4 py-2 rounded-full text-sm font-medium bg-linear-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300">
          📊 Status: {status?.toUpperCase()}
        </div>
        {steps[steps.length - 1].completed && (
          <div className="px-4 py-2 rounded-full text-sm font-medium bg-linear-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300">
            ✨ Ready for download
          </div>
        )}
      </div>
    </div>
  );
}
