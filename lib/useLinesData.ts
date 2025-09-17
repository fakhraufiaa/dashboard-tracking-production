"use client"

import { useEffect, useState } from "react"
import { LinesData } from "./type"

export function useLinesData() {
  const [data, setData] = useState<LinesData | null>(null)
  const [loading, setLoading] = useState(true)

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
        setData(parsed)
      } catch {
        console.error("Error parsing SSE data")
      }
    }
    es.onerror = () => {
      console.error("SSE error")
      es.close()
    }

    return () => es.close()
  }, [])

  return { data, loading }
}
