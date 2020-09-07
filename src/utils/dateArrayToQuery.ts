import moment from "moment";

export function dateArrayToQuery(field: string, date: string[]): string {
  return `(${field}:>="${moment(date[0])
    .startOf("d")
    .toDate()
    .toISOString()}" ${field}:<="${moment(date[1])
    .endOf("d")
    .toDate()
    .toISOString()}")`;
}
