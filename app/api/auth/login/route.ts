import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth"
import { cookies } from "next/headers"
import { SignJWT } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key")

export async function POST(request: NextRequest) {
  try {
    const { uniqCode, password } = await request.json()

    if (!uniqCode || !password) {
      return NextResponse.json({ error: "Kode unik dan password diperlukan" }, { status: 400 })
    }

    const user = await authenticateUser(Number.parseInt(uniqCode), password)

    if (!user) {
      return NextResponse.json({ error: "Kode unik atau password salah" }, { status: 401 })
    }

    // Create JWT token
    const token = await new SignJWT({ userId: user.id, uniqCode: user.uniqCode })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(secret)

    // Set cookie
    ;(await
          // Set cookie
          cookies()).set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400, // 24 hours
    })

    // Return user data (without password)
    const { password: userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
