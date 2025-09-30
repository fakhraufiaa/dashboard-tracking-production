import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezone)

// ✅ Baca dari .env atau fallback ke Asia/Jakarta
const TZ = process.env.TZ || "Asia/Jakarta"
dayjs.tz.setDefault(TZ)
    