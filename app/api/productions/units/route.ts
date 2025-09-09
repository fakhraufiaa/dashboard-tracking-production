import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ✅ POST → generate ProductionUnit + GenProductionUnit
export async function GET() {
  try {
    const units = await prisma.productionUnit.findMany({
      where: {
        genUnits: {
          some: {}, // artinya ada minimal 1 record
        },
      },
      include: {
        genUnits: true,
        production: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ data: units })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 })
  }
}