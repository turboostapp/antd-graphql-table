import moment from "moment-timezone";

export function dateArrayToQuery(
  field: string,
  date: string[],
  timezone: string
): string {
  return `(${field}:>="${moment
    .tz(date[0], timezone)
    .toDate()
    .toISOString()}" ${field}:<="${moment
    .tz(date[1], timezone)
    .toDate()
    .toISOString()}")`;
}
