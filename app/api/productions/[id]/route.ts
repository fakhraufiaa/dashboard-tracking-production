import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSession()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const productionId = Number.parseInt(params.id)

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
