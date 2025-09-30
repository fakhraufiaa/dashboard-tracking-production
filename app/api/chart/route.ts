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


export async function GET() {
  try {
    const now = dayjs().toDate()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // ambil semua production units beserta genUnits (proses)
    const units = await prisma.productionUnit.findMany({
      include: { genUnits: true },
    })

    // kita akan akumulasi jumlah unit yang "selesai semua proses" per minggu
    const weekCounts: Record<number, number> = {}

    for (const unit of units) {
      const genUnits = unit.genUnits
      if (!genUnits || genUnits.length === 0) continue

      // cek apakah semua genUnits untuk unit ini status === true
      const allTrue = genUnits.every(g => g.status === true)
      if (!allTrue) continue // kalau belum semua true, tidak dihitung

      // tentukan completion date sebagai waktu terbaru (max updatedAt) dari genUnits
      const maxMs = Math.max(...genUnits.map(g => g.updatedAt.getTime()))
      const completionDate = new Date(maxMs)

      // hanya hitung jika completionDate di dalam bulan yang diminta
      if (completionDate < monthStart || completionDate > monthEnd) continue

      // hitung minggu di dalam bulan dari completionDate
      const weekNumber = getWeekOfMonth(completionDate, { weekStartsOn: 0 }) // weekStartsOn:0 => minggu mulai Minggu
      weekCounts[weekNumber] = (weekCounts[weekNumber] || 0) + 1
    }

    // hitung jumlah minggu dalam bulan (misal bisa 4 atau 5)
    const totalWeeks =
      differenceInCalendarWeeks(monthEnd, monthStart, { weekStartsOn: 0 }) + 1

    // pastikan semua minggu muncul meskipun count = 0
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
