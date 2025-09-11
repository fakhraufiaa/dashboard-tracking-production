import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

// ✅ GET semua user
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(users)
  } catch {
    console.error()
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 })
  }
}

// ✅ POST tambah user
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { uniqCode, name, role, password } = body

    if (!uniqCode || !name || !role || !password) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    // validasi role biar sesuai enum Prisma
    if (!["ADMIN", "OPT", "QC", "SCM"].includes(role)) {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        uniqCode,
        name,
        role, // enum Role di Prisma
        password: hashedPassword,
      },
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch {
    console.error()
    return NextResponse.json({ error: "Gagal membuat user" }, { status: 500 })
  }
}
