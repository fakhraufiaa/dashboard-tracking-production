// lib/prisma.ts
import { PrismaClient } from "@prisma/client"

declare global {
  // Biarkan global.prisma tetap ada antar hot-reload (dev mode)
  // supaya gak bikin banyak koneksi ke DB
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"], // opsional: log query di console
  })

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma
}
