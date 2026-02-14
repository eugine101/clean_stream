import { useEffect, useState } from "react"
import * as api from "@/lib/api"

export function useFiles() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
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
  }

  useEffect(() => {
    refresh()
  }, [])

  return { files, loading, error, refresh }
}
