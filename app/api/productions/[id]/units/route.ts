import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const productionId = Number.parseInt(params.id)

    if (isNaN(productionId)) {
      return NextResponse.json({ error: "ID production tidak valid" }, { status: 400 })
    }

    const units = await prisma.productionUnit.findMany({
      where: { productionId },
      include: {
        genUnits: {
          select: {
            id: true,
            uniqCode: true,
            process: true,
            jsBarcode: true,
            status: true,
          },
        },
      },
      orderBy: { id: "asc" },
    })

    return NextResponse.json({ units })
  } catch (error) {
    console.error("Get production units error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
