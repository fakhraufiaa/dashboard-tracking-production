// app/api/barcode/scan/log/route.ts
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const uniqCode = searchParams.get("uniqCode")

  if (!uniqCode) {
    return new Response("uniqCode wajib diisi", { status: 400 })
  }

  const encoder = new TextEncoder()
  let interval: NodeJS.Timeout

  const stream = new ReadableStream({
    async start(controller) {
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
            encoder.encode(
              `data: ${JSON.stringify({ error: "ProductionUnit tidak ditemukan" })}\n\n`
            )
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
          .sort(
            (a, b) =>
              new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
          )

        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ logs })}\n\n`)
          )
        } catch (err) {
          // kalau controller sudah close, jangan enqueue lagi
          clearInterval(interval)
        }
      }

      // pertama kali kirim
      await sendLogs()

      // interval polling tiap 2 detik
      interval = setInterval(sendLogs, 2000)
    },

    cancel() {
      // ✅ dipanggil otomatis kalau client disconnect
      clearInterval(interval)
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
