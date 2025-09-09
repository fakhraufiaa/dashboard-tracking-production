import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    (await cookies()).delete("auth-token")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
