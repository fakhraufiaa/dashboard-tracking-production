import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key")

// ✅ Middleware kecil untuk ambil user dari cookie JWT
async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.userId as number

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, uniqCode: true, role: true },
    })

    return user
  } catch (err) {
    console.error("JWT error:", err)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { barcodeText } = await req.json()
    if (!barcodeText) {
      return NextResponse.json({ error: "Barcode tidak ditemukan" }, { status: 400 })
    }

    // ✅ Ambil user login
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Cari GenProductionUnit berdasarkan uniqCode (barcode)
    const genUnit = await prisma.genProductionUnit.findUnique({
      where: { uniqCode: barcodeText },
      include: { productionUnit: true },
    })

    if (!genUnit) {
      return NextResponse.json({ error: "UniqCode tidak ditemukan" }, { status: 404 })
    }

    // ✅ Format response tanpa update atau insert ke InfoScanProduction
    return NextResponse.json({
      uniqCode: genUnit.uniqCode,
      process: genUnit.process,
      productionUnit: genUnit.productionUnit.uniqCode,
      status: genUnit.status,
    })
  } catch (error) {
    console.error("❌ Error preview barcode:", error)
    return NextResponse.json({ error: "Gagal memproses barcode" }, { status: 500 })
  }
}
