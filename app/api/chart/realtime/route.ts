// app/api/chart/realtime/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  startOfMonth,
  endOfMonth,
  differenceInCalendarWeeks,
  getWeekOfMonth,
} from "date-fns";
import dayjs from "@/lib/dayjs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month"); // "2025-09"

  let isClosed = false;
  const encoder = new TextEncoder();
  let interval: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      async function sendData() {
        const baseDate = monthParam ? dayjs(monthParam + "-01") : dayjs();
        const now = baseDate.toDate();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        if (isClosed) return;
        try {
          // ambil semua production units beserta genUnits
          const units = await prisma.productionUnit.findMany({
            include: { genUnits: true },
          });

          const weekCounts: Record<number, number> = {};

          for (const unit of units) {
            const genUnits = unit.genUnits;
            if (!genUnits || genUnits.length === 0) continue;

            const allTrue = genUnits.every((g) => g.status === true);
            if (!allTrue) continue;

            const maxMs = Math.max(
              ...genUnits.map((g) => g.updatedAt.getTime())
            );
            const completionDate = new Date(maxMs);

            if (completionDate < monthStart || completionDate > monthEnd)
              continue;

            const weekNumber = getWeekOfMonth(completionDate, {
              weekStartsOn: 0,
            });
            weekCounts[weekNumber] = (weekCounts[weekNumber] || 0) + 1;
          }

          const totalWeeks =
            differenceInCalendarWeeks(monthEnd, monthStart, {
              weekStartsOn: 0,
            }) + 1;
          const data = Array.from({ length: totalWeeks }, (_, i) => {
            const week = i + 1;
            return { week, count: weekCounts[week] || 0 };
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                month: now.toLocaleString("default", { month: "long" }),
                data,
              })}\n\n`
            )
          );
        } catch (err) {
          console.error("SSE error:", err);
        }
      }

      // Kirim data pertama kali
      await sendData();

      // Kirim data setiap 5 detik
      interval = setInterval(sendData, 5000);
    },
    cancel() {
      isClosed = true;
      clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
