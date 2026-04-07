"use client";

import { X } from "lucide-react";
import { DataCleaningDetailsView } from "./DataCleaningDetailsView";

interface DataCleaningDetailsModalProps {
  fileId: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DataCleaningDetailsModal({
  fileId,
  fileName,
  isOpen,
  onClose,
}: DataCleaningDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full my-8">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Data Cleaning Results
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {fileName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(100vh-200px)]">
          <DataCleaningDetailsView fileId={fileId} fileName={fileName} />
        </div>
      </div>
    </div>
  );
}
