"use client"

import React from "react"
import * as api from "@/lib/api"

type FileItem = {
  fileId?: string
  filename?: string
  status?: string
  uploadedAt?: string
  processedAt?: string | null
  fileSize?: number
  errorMessage?: string | null
}

type AppState = {
  files: FileItem[]
  loading: boolean
  error?: string | null
  tenantId: string
  refresh: () => Promise<void>
  upload: (file: File) => Promise<any>
}

const AppStateContext = React.createContext<AppState | undefined>(undefined)

export function AppStateProvider({ children, tenantId: providedTenantId }: { children: React.ReactNode; tenantId?: string }) {
  const [files, setFiles] = React.useState<FileItem[]>([])
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
      const data = await api.listFiles()
      setFiles(data || [])
    } catch (e: any) {
      setError(e?.message || "Failed to load files")
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

export type { FileItem }
