import dayjs from "dayjs"

export function getToday6am() {
  let base = dayjs().hour(6).minute(0).second(0).millisecond(0)
  if (dayjs().hour() < 6) {
    base = base.subtract(1, "day")
  }
  return base.toDate()
}
