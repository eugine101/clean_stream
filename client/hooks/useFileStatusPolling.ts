import { useEffect, useState } from "react"
import * as api from "@/lib/api"

/**
 * Hook to poll file status until it reaches COMPLETED or FAILED
 * Useful for showing real-time processing status
 */
export function useFileStatusPolling(fileId: string | null, onComplete?: () => void) {
  const [status, setStatus] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!fileId) return

    setIsPolling(true)
    const interval = setInterval(async () => {
      try {
        const fileStatus = await api.getFileStatus(fileId)
        setStatus(fileStatus.status)
        setError(null)

        // Stop polling when completed or failed
        if (fileStatus.status === "COMPLETED" || fileStatus.status === "FAILED") {
          setIsPolling(false)
          clearInterval(interval)
          onComplete?.()
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to check status"
        setError(message)
        // Continue polling on error
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [fileId, onComplete])

  return { status, isPolling, error }
}
