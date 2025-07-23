import { useState, useEffect, useRef } from 'react'

interface UsePollingOptions {
  url: string
  interval: number
  enabled: boolean
  onData: (data: any) => void
  onError?: (error: Error) => void
}

export function usePolling({ url, interval, enabled, onData, onError }: UsePollingOptions) {
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsPolling(false)
      return
    }

    const poll = async () => {
      try {
        setIsPolling(true)
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        onData(data)
      } catch (error) {
        console.error('Polling error:', error)
        onError?.(error as Error)
      } finally {
        setIsPolling(false)
      }
    }

    // Première requête immédiate
    poll()

    // Démarrer l'intervalle
    intervalRef.current = setInterval(poll, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [url, interval, enabled, onData, onError])

  return { isPolling }
} 