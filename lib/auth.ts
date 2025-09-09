import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import type { User, Role } from "@prisma/client"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createUser(data: {
  uniqCode: number
  name: string
  role: Role
  password: string
}): Promise<User> {
  const hashedPassword = await hashPassword(data.password)

  return prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
  })
}

export async function authenticateUser(uniqCode: number, password: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { uniqCode },
  })

  if (!user) return null

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) return null

  return user
}
