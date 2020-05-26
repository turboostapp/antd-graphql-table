import { FilterType } from "../types/FilterType";
import { SimpleColumnType } from "antd-simple-table";

export interface GraphQlTableColumnType<T> extends SimpleColumnType<T> {
  filterType?: FilterType;
}
