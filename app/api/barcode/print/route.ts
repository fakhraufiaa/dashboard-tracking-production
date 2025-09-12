// /api/barcode/print/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { productionId, unitIds } = await req.json();

    const units = await prisma.productionUnit.findMany({
      where: {
        ...(productionId ? { productionId } : {}),
        ...(unitIds?.length ? { id: { in: unitIds } } : {}),
      },
      include: {
        genUnits: {
          select: { id: true, uniqCode: true, process: true, jsBarcode: true },
          orderBy: { id: "asc" },
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ units });
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
