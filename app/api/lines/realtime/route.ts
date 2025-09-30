import { getLinesSummary } from "@/lib/getLinesSummary";

export const config = {
  runtime: "nodejs",
};

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        let isClosed = false;

        async function sendSummary() {
          if (isClosed) return;
          try {
            const summary = await getLinesSummary();
            if (!isClosed) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(summary)}\n\n`)
              );
            }
          } catch (e) {
            console.error("Error sending summary:", e);
          }
        }

        // kirim awal
        await sendSummary();

        // interval
        const interval = setInterval(sendSummary, 5000);

        // stop kalau client disconnect
        req.signal.addEventListener("abort", () => {
          clearInterval(interval);
          isClosed = true;
          controller.close();
        });
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    }
  );
}
