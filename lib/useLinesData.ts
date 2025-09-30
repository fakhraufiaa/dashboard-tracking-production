"use client"

import { useEffect, useState } from "react"
import { LinesData } from "./type"
import { getToday6amStr } from "@/lib/time"

export function useLinesData() {
  const [data, setData] = useState<LinesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastResetDate, setLastResetDate] = useState(getToday6amStr())

  // 🟢 Effect untuk SSE (sekali jalan)
  useEffect(() => {
    let es: EventSource | null = null
    let retryTimeout: NodeJS.Timeout

    const connect = () => {
      es = new EventSource("/api/lines/realtime")

      es.onmessage = (event) => {
        try {
          const parsed: LinesData = JSON.parse(event.data)
          setData(parsed)
          setLoading(false)
        } catch {
          console.error("Error parsing SSE data")
        }
      }

      es.onerror = (err) => {
        console.error("SSE error, reconnecting in 3s", err)
        es?.close()
        retryTimeout = setTimeout(connect, 3000)
      }
    }

    // initial fetch
    fetch("/api/lines")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Error fetching initial lines data", err))
      .finally(() => setLoading(false))

    connect()

    return () => {
      es?.close()
      clearTimeout(retryTimeout)
    }
  }, [])

  // 🟢 Effect untuk cek reset harian
  useEffect(() => {
    const checkReset = () => {
      const todayStr = getToday6amStr()
      if (lastResetDate !== todayStr) {
        console.log("⏰ Reset data karena ganti hari 6am")
        setLastResetDate(todayStr)
        setData(null)
        setLoading(true)
        fetch("/api/lines")
          .then((res) => res.json())
          .then((json) => setData(json))
          .catch((err) => console.error("Error refetch after reset", err))
          .finally(() => setLoading(false))
      }
    }

    const interval = setInterval(checkReset, 60_000)
    return () => clearInterval(interval)
  }, [lastResetDate])

  return { data, loading }
}
