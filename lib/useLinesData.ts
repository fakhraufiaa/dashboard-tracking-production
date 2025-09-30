"use client"

import { useEffect, useState } from "react"
import { LinesData } from "./type"
import { getToday6amStr } from "@/lib/time"

export function useLinesData() {
  const [data, setData] = useState<LinesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastResetDate, setLastResetDate] = useState<string>(getToday6amStr())

  const checkReset = () => {
    const todayStr = getToday6amStr()
    if (lastResetDate !== todayStr) {
      setLastResetDate(todayStr)
      // kalau perlu reset local state:
      setData(null)
      setLoading(true)
      // optional: bisa refetch kalau mau langsung fresh data
      fetch("/api/lines")
        .then((res) => res.json())
        .then((json) => setData(json))
        .catch((err) => console.error("Error refetch after reset", err))
        .finally(() => setLoading(false))
    }
  }

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res = await fetch("/api/lines")
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error("Error fetching initial lines data", err)
      } finally {
        setLoading(false)
      }
    }
    fetchInitial()

    const es = new EventSource("/api/lines/realtime")
    es.onmessage = (event) => {
      try {
        const parsed: LinesData = JSON.parse(event.data)
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

    // Cek reset tiap menit
    const interval = setInterval(checkReset, 60_000)

    return () => {
      es.close()
      clearInterval(interval)
    }
  }, [lastResetDate])

  return { data, loading }
}
