// lib/time.ts
import dayjsBase from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjsBase.extend(utc)
dayjsBase.extend(timezone)

dayjsBase.tz.setDefault(process.env.NEXT_PUBLIC_APP_TIMEZONE || "Asia/Jakarta")

export const dayjs = dayjsBase
export default dayjs