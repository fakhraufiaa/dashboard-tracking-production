// app/api/barcode/scan/log/route.ts
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const uniqCode = searchParams.get("uniqCode")

  if (!uniqCode) {
    return new Response("uniqCode wajib diisi", { status: 400 })
  }

  // SSE setup
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      async function sendLogs() {
        const productionUnit = await prisma.productionUnit.findUnique({
          where: { uniqCode: uniqCode as string },
          include: {
            genUnits: {
              include: {
                infoScans: {
                  include: { user: true },
                  orderBy: { createdAt: "asc" },
                },
              },
            },
          },
        })

        if (!productionUnit) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "ProductionUnit tidak ditemukan" })}\n\n`)
          )
          return
        }

        const logs = productionUnit.genUnits
          .flatMap((gen) =>
            gen.infoScans.map((scan) => ({
              id: scan.id,
              code: gen.uniqCode,
              process: gen.process,
              status: gen.status ? "Done" : "Pending",
              pekerja: scan.user?.name || "-",
              role: scan.user?.role || "-",
              datetime: scan.createdAt,
            }))
          )
          .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ logs })}\n\n`))
      }

      // pertama kali kirim
      await sendLogs()

      // interval polling tiap 2 detik
      const interval = setInterval(sendLogs, 2000)

      // bersihin stream kalau client disconnect
            // cleanup kalau client disconnect
      return () => clearInterval(interval)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
