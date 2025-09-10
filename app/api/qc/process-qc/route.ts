import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ✅ Ambil daftar ProductionUnit + summary QC
export async function GET() {
  try {
    const units = await prisma.productionUnit.findMany({
      include: {
        genUnits: true,
        processQc: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ data: units })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch Process Log" }, { status: 500 })
  }
}

// ✅ Update / Insert QC
export async function POST(req: Request) {
  try {
    const { productionUnitId, qcUserId, checklist } = await req.json()

    // update atau create ProcessQc
    const qc = await prisma.processQc.upsert({
      where: { productionUnitId },
      update: {
        ...checklist,
      },
      create: {
        productionUnitId,
        ...checklist,
      },
    })

    // log setiap checklist yang diubah
    const logs = await Promise.all(
      Object.keys(checklist).map((key) =>
        prisma.processQcLog.create({
          data: {
            processQcId: qc.id,
            qcUserId,
            action: key,
            status: checklist[key],
          },
        })
      )
    )

    return NextResponse.json({ qc, logs })
  } catch  {
    console.error()
    return NextResponse.json({ error: "Failed to update QC" }, { status: 500 })
  }
}
