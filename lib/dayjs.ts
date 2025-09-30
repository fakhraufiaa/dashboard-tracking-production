import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezone)

// ✅ Baca dari .env atau fallback ke Asia/Jakarta
const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Jakarta"
dayjs.tz.setDefault(APP_TIMEZONE)
    