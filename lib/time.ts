import dayjs from "@/lib/dayjs"

/**
 * Ambil tanggal jam 6 pagi terakhir.
 * Kalau sekarang < jam 6 → ambil kemarin 06:00
 * Kalau sekarang >= jam 6 → ambil hari ini 06:00
 */
export function getToday6am(): Date {
  const now = dayjs()
  let base = now.hour(6).minute(0).second(0).millisecond(0)

  if (now.hour() < 6) {
    base = base.subtract(1, "day")
  }

  return base.toDate()
}

/**
 * Helper: return string YYYY-MM-DD dari jam 6 pagi terakhir
 */
export function getToday6amStr(): string {
  return dayjs(getToday6am()).format("YYYY-MM-DD")
}
