import { cookies } from "next/headers"
import { prisma } from "./prisma"

export interface SessionUser {
  id: number
  uniqCode: number
  name: string
  role: "ADMIN" | "OPT" | "QC" | "SCM"
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return null
    }

    const sessionData = JSON.parse(sessionCookie.value)
    const user = await prisma.user.findUnique({
      where: { id: sessionData.userId },
      select: {
        id: true,
        uniqCode: true,
        name: true,
        role: true,
      },
    })

    return user
  } catch{
    return null
  }
}

export async function createSession(userId: number) {
  const cookieStore = await cookies()
  const sessionData = JSON.stringify({ userId })

  cookieStore.set("session", sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}
