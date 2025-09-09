import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key")

export async function GET(request: NextRequest) {
  try {
    // cek cookies
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      console.error("❌ Token tidak ditemukan di cookies")
      return NextResponse.json({ error: "Tidak ada token" }, { status: 401 })
    }

    // cek token
    let payload
    try {
      const verified = await jwtVerify(token, secret)
      payload = verified.payload
    } catch (err) {
      console.error("❌ Token tidak valid:", err)
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 })
    }

    const userId = payload.userId as number
    if (!userId) {
      console.error("❌ Payload JWT tidak punya userId:", payload)
      return NextResponse.json({ error: "Payload JWT tidak valid" }, { status: 400 })
    }

    // cek prisma
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        uniqCode: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      console.error("❌ User tidak ditemukan di database untuk id:", userId)
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("🔥 Server error di /api/auth/me:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
