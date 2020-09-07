import { FilterProps } from "../GraphQLTable";
import { GraphQLTableColumnType } from "../interfaces/GraphQLTableColumnType";
import { FilterType } from "../types/FilterType";
import { dateArrayToQuery } from "./dateArrayToQuery";

export function filterToQuery<T>(
  filters: FilterProps,
  columns: Array<GraphQLTableColumnType<T>>
): string {
  let query = "";
  Object.entries(filters).forEach(([field, values]) => {
    if (values && values[0] !== "") {
      values.forEach((value) => {
        let newValue = value;
        // Array 是日期格式，转换成 ISO 格式
        if (newValue instanceof Array) {
          query = `${query ? `${query} ` : ""}${dateArrayToQuery(
            field,
            newValue
          )}`;
        } else {
          // 如果是 string 的话，要加引号
          if (typeof newValue === "string") {
            if (
              columns.find((column) => column.key === field).filterType !==
              FilterType.INPUT_NUMBER
            ) {
              newValue = `"${newValue}"`;
            }
          }
          query = `${query ? `${query} ` : ""}${field}:${newValue}`;
        }
      });
    }
  });
  return query;
}
