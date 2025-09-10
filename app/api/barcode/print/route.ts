import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"


export async function POST(request: NextRequest) {
  try {

    const { unitIds } = await request.json()

    const units = await prisma.productionUnit.findMany({
      where: {
        ...(unitIds?.length ? { id: { in: unitIds } } : {}), // kalau kosong ambil semua
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
  } catch {
    console.error()
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
