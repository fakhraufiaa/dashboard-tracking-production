// app/api/months/route.ts
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { format } from "date-fns"

export async function GET() {
  try {
    // Cari tahun paling baru dari production_units
    const latest = await prisma.productionUnit.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    })

    const year = latest ? latest.createdAt.getFullYear() : new Date().getFullYear()

    // Generate list bulan Jan–Dec untuk tahun tsb
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(year, i, 1)
      return format(date, "yyyy-MM")
    })

    return NextResponse.json({ data: months })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch months" }, { status: 500 })
  }
}
