// lib/dayjs.ts
import dayjsBase from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjsBase.extend(utc)
dayjsBase.extend(timezone)

// ✅ Ambil dari env kalau ada, fallback ke Asia/Jakarta
// Client-side hanya bisa baca env dengan prefix NEXT_PUBLIC_
const TZ =
  process.env.NEXT_PUBLIC_APP_TIMEZONE ||
  process.env.APP_TIMEZONE || // server-side (API route, server actions)
  "Asia/Jakarta"

dayjsBase.tz.setDefault(TZ)

export const dayjs = dayjsBase
export default dayjs
