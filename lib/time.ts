import dayjs from "@/lib/dayjs"

export function nowJakarta() {
  return dayjs().tz("Asia/Jakarta")
}

/**
 * Ambil range harian 06:00 WIB → 06:00 WIB (UTC biar cocok sama DB)
 */
export function getTodayRangeUTC() {
  let startJakarta = nowJakarta().hour(6).minute(0).second(0).millisecond(0)

  if (nowJakarta().hour() < 6) {
    startJakarta = startJakarta.subtract(1, "day")
  }

  const endJakarta = startJakarta.add(1, "day")

  return {
    start: startJakarta.utc().toDate(),
    end: endJakarta.utc().toDate(),
  }
}

/**
 * Ambil tanggal (YYYY-MM-DD) berdasarkan 06:00 WIB terakhir
 * → dipakai untuk state reset frontend
 */
export function getToday6amStr(): string {
  let base = nowJakarta().hour(6).minute(0).second(0).millisecond(0)

  if (nowJakarta().hour() < 6) {
    base = base.subtract(1, "day")
  }

  return base.format("YYYY-MM-DD")
}
