import { getLinesSummary } from "@/lib/getLinesSummary"

export async function GET() {
  const summary = await getLinesSummary()
  return Response.json(summary)
}