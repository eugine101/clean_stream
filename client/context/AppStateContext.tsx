"use client"

import React from "react"
import * as api from "@/lib/api"

type CleaningResultItem = {
  id?: number
  fileId?: string
  filename?: string
  status?: string
  uploadedAt?: string
  processedAt?: string | null
  fileSize?: number
  errorMessage?: string | null
  // Cleaning result specific fields
  tenantId?: string
  datasetId?: string
  rowData?: string
  aiSuggestion?: string
  confidence?: number
  createdAt?: string
}

type AppState = {
  files: CleaningResultItem[]
  loading: boolean
  error?: string | null
  tenantId: string
  refresh: () => Promise<void>
  upload: (file: File) => Promise<any>
}

const AppStateContext = React.createContext<AppState | undefined>(undefined)

export function AppStateProvider({ children, tenantId: providedTenantId }: { children: React.ReactNode; tenantId?: string }) {
  const [files, setFiles] = React.useState<CleaningResultItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [tenantId, setTenantId] = React.useState<string>(providedTenantId || "tenant-001")

  // Update tenantId when it changes (e.g., after user logs in)
  React.useEffect(() => {
    setTenantId(providedTenantId || "tenant-001")
  }, [providedTenantId])

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // First try to fetch cleaning results (tenant-specific)
      const cleaningData = await api.getCleaningResults(0, 100)
      if (cleaningData && cleaningData.content) {
        setFiles(cleaningData.content || [])
      } else {
        // Fallback to listFiles if cleaning results endpoint is not available
        const fileData = await api.listFiles()
        setFiles(fileData || [])
      }
    } catch (e: any) {
      console.error("Error fetching cleaning results:", e)
      // Fallback to listFiles on error
      try {
        const fileData = await api.listFiles()
        setFiles(fileData || [])
      } catch (fallbackError: any) {
        setError(fallbackError?.message || "Failed to load files")
        setFiles([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh files when tenantId changes
  React.useEffect(() => {
    refresh()
  }, [tenantId, refresh])

  const upload = React.useCallback(async (file: File) => {
    try {
      const res = await api.uploadFile(file, "dataset-001", tenantId)
      // optimistic refresh
      await refresh()
      return res
    } catch (e) {
      throw e
    }
  }, [refresh, tenantId])

  return (
    <AppStateContext.Provider value={{ files, loading, error, tenantId, refresh, upload }}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const ctx = React.useContext(AppStateContext)
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider")
  return ctx
}

export type { CleaningResultItem as FileItem }
