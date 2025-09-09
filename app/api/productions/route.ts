import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const productions = await prisma.production.findMany({
      include: {
        units: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(productions)
  } catch (error) {
    console.error("Error fetching productions:", error)
    return NextResponse.json({ error: "Gagal memuat data produksi" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, jumlah } = await request.json()

    if (!name || !jumlah || jumlah < 1) {
      return NextResponse.json({ error: "Nama dan jumlah unit diperlukan" }, { status: 400 })
    }

    // Create production and units in a transaction
    const production = await prisma.$transaction(async (tx) => {
      // Create the production
      const newProduction = await tx.production.create({
        data: {
          name,
          jumlah: Number.parseInt(jumlah),
        },
      })

      // Create production units
      const units = []
      for (let i = 1; i <= Number.parseInt(jumlah); i++) {
        const uniqCode = `SWIII-${String(newProduction.id).padStart(4, "0")}-${String(i).padStart(3, "0")}`
        units.push({
          productionId: newProduction.id,
          uniqCode,
        })
      }

      await tx.productionUnit.createMany({
        data: units,
      })

      return newProduction
    })

    return NextResponse.json(production)
  } catch (error) {
    console.error("Error creating production:", error)
    return NextResponse.json({ error: "Gagal membuat produksi" }, { status: 500 })
  }
}
