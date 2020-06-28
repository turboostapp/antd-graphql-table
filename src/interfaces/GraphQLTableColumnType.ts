import { SimpleColumnType } from "antd-simple-table";

import { FilterType } from "../types/FilterType";

export interface GraphQLTableColumnType<T> extends SimpleColumnType<T> {
  filterType?: FilterType;
}
