import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"
import { Role } from "@prisma/client"

interface Params {
  params: Promise<{ id: string}>
}

// ✅ PUT update user
export async function PUT(req: Request, { params }: Params) {
  try {
    const body = await req.json()
    const { uniqCode, name, role, password } = body

    if (!["ADMIN", "OPT", "QC", "SCM"].includes(role)) {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 })
    }

    interface UserUpdateData {
        uniqCode?: number
        name?: string
        role?: Role
        password?: string
    }

    const data: UserUpdateData = {
    uniqCode,
    name,
    role,
    }

    if (password) {
      data.password = await bcrypt.hash(password, 10)
    }   

    const updatedUser = await prisma.user.update({
      where: { id: Number((await params).id) },
      data,
    })

    return NextResponse.json(updatedUser)
  } catch {
    console.error()
    return NextResponse.json({ error: "Gagal update user" }, { status: 500 })
  }
}

// ✅ DELETE hapus user
export async function DELETE(req: Request, { params }: Params) {
  try {
    await prisma.user.delete({
      where: { id: Number((await params).id)},
    })
    return NextResponse.json({ message: "User dihapus" })
  } catch  {
    console.error()
    return NextResponse.json({ error: "Gagal hapus user" }, { status: 500 })
  }
}
