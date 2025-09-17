import { getLinesSummary } from "@/lib/getLinesSummary"

export async function GET(req: Request) {
  const encoder = new TextEncoder()

  return new Response(
    new ReadableStream({
      async start(controller) {
        async function sendSummary() {
          try {
            const summary = await getLinesSummary()
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(summary)}\n\n`)
            )
          } catch (e) {
            console.error("Error sending summary:", e)
          }
        }

        // kirim awal
        await sendSummary()

        // interval
        const interval = setInterval(sendSummary, 5000)

        // stop kalau client disconnect
        req.signal.addEventListener("abort", () => {
          clearInterval(interval)
          controller.close()
        })
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }
  )
}
