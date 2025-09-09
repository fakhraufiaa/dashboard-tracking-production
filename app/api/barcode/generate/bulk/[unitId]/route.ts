import { NextRequest, NextResponse } from "next/server"
import { PrismaClient} from "@prisma/client"
export const runtime = "nodejs" // ✅ pastikan jalan di Node.js

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: {  params: Promise<{ unitId: string }> }
) {
    const { unitId } = await params
  const barcodes = await prisma.genProductionUnit.findMany({
    where: { productionUnitId: Number(unitId) }
  })
  return NextResponse.json(barcodes)
}