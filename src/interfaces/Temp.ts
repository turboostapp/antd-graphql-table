import { FilterType } from "../types/FilterType";
import { SimpleColumnType } from "antd-simple-table";

export interface GraphQLTableColumnType<T> extends SimpleColumnType<T> {
  filterType?: FilterType;
}
