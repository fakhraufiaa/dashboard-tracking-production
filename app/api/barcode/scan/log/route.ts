// app/api/barcode/scan/log/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const uniqCode = searchParams.get("uniqCode")

    if (!uniqCode) {
      return NextResponse.json({ error: "uniqCode wajib diisi" }, { status: 400 })
    }

    // Cari ProductionUnit berdasarkan uniqCode induk
    const productionUnit = await prisma.productionUnit.findUnique({
      where: { uniqCode },
      include: {
        genUnits: {
          include: {
            infoScans: {
              include: {
                user: true, // PIC
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    })

    if (!productionUnit) {
      return NextResponse.json({ error: "ProductionUnit tidak ditemukan" }, { status: 404 })
    }

    // Flatten log dari semua genUnits
    const logs = productionUnit.genUnits
    .flatMap((gen) =>
        gen.infoScans.map((scan) => ({
        code: gen.uniqCode,
        process: gen.process,
        status: gen.status ? "Done" : "Pending",
        pic: scan.user?.name || "-",
        role: scan.user?.role || "-",
        datetime: scan.createdAt,
        }))
    )
    .sort(
        (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime() // ⬅️ lama → terbaru
    )

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("❌ Error get log scan:", error)
    return NextResponse.json({ error: "Gagal mengambil log scan" }, { status: 500 })
  }
}
