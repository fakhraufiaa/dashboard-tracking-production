import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { unitIds } = await request.json()

    if (!unitIds || !Array.isArray(unitIds)) {
      return NextResponse.json({ error: "Unit IDs harus diisi" }, { status: 400 })
    }

    const units = await prisma.productionUnit.findMany({
      where: {
        id: { in: unitIds },
      },
      include: {
        genUnits: {
          select: {
            id: true,
            uniqCode: true,
            process: true,
            jsBarcode: true,
          },
          orderBy: { id: "asc" },
        },
      },
      orderBy: { id: "asc" },
    })

    return NextResponse.json({ units })
  } catch (error) {
    console.error("Print barcode error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
