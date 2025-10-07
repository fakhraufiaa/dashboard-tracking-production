// app/api/stats/production-bar/route.ts
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import {
  startOfMonth,
  endOfMonth,
  differenceInCalendarWeeks,
  getWeekOfMonth,
} from "date-fns"
import dayjs from "@/lib/dayjs"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const monthParam = searchParams.get("month") // contoh "2025-09" (YYYY-MM)

    // kalau ada query bulan, pakai itu, kalau tidak pakai bulan sekarang
    const baseDate = monthParam ? dayjs(monthParam + "-01") : dayjs()
    const now = baseDate.toDate()

    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // ambil semua production units beserta genUnits (proses)
    const units = await prisma.productionUnit.findMany({
      include: { genUnits: true },
    })

    // akumulasi jumlah unit yang selesai semua proses per minggu
    const weekCounts: Record<number, number> = {}

    for (const unit of units) {
      const genUnits = unit.genUnits
      if (!genUnits || genUnits.length === 0) continue

      // cek semua genUnits status === true
      const allTrue = genUnits.every((g) => g.status === true)
      if (!allTrue) continue

      // ambil completion date = max updatedAt
      const maxMs = Math.max(...genUnits.map((g) => g.updatedAt.getTime()))
      const completionDate = new Date(maxMs)

      // hanya hitung jika completionDate di bulan terpilih
      if (completionDate < monthStart || completionDate > monthEnd) continue

      const weekNumber = getWeekOfMonth(completionDate, { weekStartsOn: 0 })
      weekCounts[weekNumber] = (weekCounts[weekNumber] || 0) + 1
    }

    // hitung total minggu
    const totalWeeks =
      differenceInCalendarWeeks(monthEnd, monthStart, { weekStartsOn: 0 }) + 1

    const data = Array.from({ length: totalWeeks }, (_, i) => {
      const week = i + 1
      return { week, count: weekCounts[week] || 0 }
    })

    return NextResponse.json({
      month: now.toLocaleString("default", { month: "long" }),
      data,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 })
  }
}
