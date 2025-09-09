import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string}>}) {
  try {

    const productionId =  Number.parseInt((await params).id)

    if (isNaN(productionId)) {
      return NextResponse.json({ error: "ID production tidak valid" }, { status: 400 })
    }

    await prisma.production.delete({
      where: { id: productionId },
    })

    return NextResponse.json({
      message: "Production berhasil dihapus",
    })
  } catch (error) {
    console.error("Delete production error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
