import dayjs from "dayjs"

export function getToday6am() {
  const tz = process.env.APP_TIMEZONE || "Asia/Jakarta"

  // kalau dayjs sudah pakai plugin timezone:
  let base = dayjs().tz(tz).hour(6).minute(0).second(0).millisecond(0)
  if (dayjs().tz(tz).hour() < 6) {
    base = base.subtract(1, "day")
  }
  return base.toDate()
}
