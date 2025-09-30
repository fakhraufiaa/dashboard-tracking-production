import { getListUnitsToday } from "@/lib/getLinesSummary"

export async function GET() {
  const list = await getListUnitsToday()
  return Response.json(list)
}
