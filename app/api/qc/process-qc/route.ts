import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ✅ Ambil daftar ProductionUnit + summary QC
export async function GET() {
  try {
    const units = await prisma.productionUnit.findMany({
      include: {
        genUnits: true,
        processQc: { 
          include: {
            logs: {
              include: { qcUser: true },
              orderBy: { createdAt: "desc" },
            },
          },}
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
// ✅ Update / Insert QC
export async function POST(req: Request) {
  try {
    const { productionUnitId, qcUserId, checklist } = await req.json()

    // update atau create ProcessQc
    const qc = await prisma.processQc.upsert({
      where: { productionUnitId },
      update: { ...checklist },
      create: {
        productionUnitId,
        ...checklist,
      },
    })

    // log tiap checklist dengan upsert → update kalau sudah ada
    const logs = await Promise.all(
      Object.entries(checklist).map(([key, value]) =>
        prisma.processQcLog.upsert({
          where: {
            processQcId_action: {
              processQcId: qc.id,
              action: key,
            },
          },
          update: {
            status: Boolean(value),
          },
          create: {
            processQcId: qc.id,
            qcUserId,
            action: key,
            status: Boolean(value),
          },
        })
      )
    )

    return NextResponse.json({ data: qc, logs })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to update QC" }, { status: 500 })
  }
}

