"use client"

import { useEffect, useState } from "react"
import { LinesData } from "./type"

export function useLinesData() {
   const [data, setData] = useState<LinesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastResetDate, setLastResetDate] = useState<string>("")

  const checkReset = () => {
    const now = new Date()
    const todayStr = now.toISOString().split("T")[0]

    if (lastResetDate !== todayStr && now.getHours() >= 6) {
      setLastResetDate(todayStr)
      // tidak perlu fetch lagi karena SSE akan kirim data baru
    }
  }

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res = await fetch("/api/lines")
        const json = await res.json()
        setData(json)
      } catch {
        console.error("Error fetching initial lines data")
      } finally {
        setLoading(false)
      }
    }
    fetchInitial()

    const es = new EventSource("/api/lines/realtime")
    es.onmessage = (event) => {
      try {
        const parsed: LinesData = JSON.parse(event.data)
        checkReset()
        setData(parsed)
        setLoading(false)
      } catch {
        console.error("Error parsing SSE data")
      }
    }
    es.onerror = () => {
      console.error("SSE error")
      es.close()
    }

    // Cek reset tiap menit, jika SSE tidak datang tepat jam 06
    const interval = setInterval(checkReset, 60_000)

    return () => es.close()
    clearInterval(interval)
  }, [lastResetDate])

  return { data, loading }
}
