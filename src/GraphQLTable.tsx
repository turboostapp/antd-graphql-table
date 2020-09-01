import { Button, Input, Popover, Radio } from "antd";
import {
  SimpleTable,
  SimpleTableProps,
  TagValueObjectType,
  ValueType,
} from "antd-simple-table";
import { CheckboxValueType } from "antd/lib/checkbox/Group";
import omit from "lodash/omit";
import moment from "moment";
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import styled from "styled-components";

import FilterDrawer from "./components/FilterDrawer";
import Tag from "./components/Tag";
import useChangePageByKeyboard from "./hooks/useChangePageByKeyboard";
import useRouteParamsState from "./hooks/useRouteParamsState";
import { GraphQLTableColumnType } from "./interfaces/GraphQLTableColumnType";
import { Maybe, OrderDirection, Ordering, Scalars } from "./types/BaseTypes";
import { FilterType } from "./types/FilterType";

function dateArrayToQuery(field: string, date: string[]) {
  return `(${field}:>="${moment(date[0])
    .startOf("d")
    .toDate()
    .toISOString()}" ${field}:<="${moment(date[1])
    .endOf("d")
    .toDate()
    .toISOString()}")`;
}

const StyledGraphQLTable = styled.div`
  .ant-pagination-item,
  .ant-pagination-options,
  .ant-pagination-jump-prev,
  .ant-pagination-jump-next {
    display: none !important;
  }

  .ant-table-pagination-right {
    float: none;
  }

  .ant-table-pagination.ant-pagination {
    text-align: center;
  }
`;

const StyledRadio = styled(Radio)`
  display: block;

  height: 30px;

  line-height: 30px;
`;

const StyledButton = styled(Button)`
  padding: 4px 0;
`;

export interface Variables {
  after?: Maybe<Scalars["String"]>;
  query?: Maybe<Scalars["String"]>;
  orderBy?: Maybe<Ordering>;
}

export interface FilterProps {
  [key: string]: (CheckboxValueType | [string, string])[];
}

export interface GraphQLTableProps<T> extends SimpleTableProps<T> {
  dataSource: T[];
  columns: Array<GraphQLTableColumnType<T>>;
  hasMore: boolean;
  variables?: Variables | null;
  defaultSort?: Ordering;
  onLoadMore?: () => void | Promise<void>;
  onVariablesChange: (variables: Variables) => void;
}

export function GraphQLTable<T>(props: GraphQLTableProps<T>): ReactElement {
  const {
    columns,
    dataSource = [],
    hasMore,
    loading,
    variables = {},
    defaultSort,
    onLoadMore,
    onVariablesChange,
  } = props;

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [sortValue, setSortValue] = useState("");

  const [query, setQuery] = useState<string>("");

  // 筛选控件绑定的值
  const [bindValues, setBindValues] = useState<FilterProps>({});

  // 筛选处理后的值
  const [filters, setFilters] = useState<FilterProps>({});

  const [routeParams, setRouteParams] = useRouteParamsState([
    "query",
    "filter",
    "field",
    "direction",
  ]);

  const total = useMemo(
    () => (hasMore ? dataSource.length + pageSize : dataSource.length),
    [dataSource.length, hasMore, pageSize]
  );

  const maxPage = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);

  const handlePageChange = useCallback(
    async (nextPage: number) => {
      if (!loading && nextPage >= 1 && nextPage <= maxPage) {
        if (hasMore && nextPage > page && nextPage === maxPage) {
          await onLoadMore();
        }
        setPage(nextPage);
      }
    },
    [hasMore, loading, maxPage, onLoadMore, page]
  );

  // 翻页快捷键
  useChangePageByKeyboard(page, handlePageChange);

  // refetch 后恢复 page
  useEffect(() => {
    if ((maxPage === 2 && hasMore) || (maxPage === 1 && !hasMore)) {
      setPage(1);
    }
  }, [hasMore, maxPage, total]);

  const columnsFilterResults = useMemo(
    () => columns.filter((column) => column.filters || column.filterType),
    [columns]
  );

  const columnsSortResults = useMemo(
    () => columns.filter((column) => column.sorter),
    [columns]
  );

  const handelSubmitFilters = useCallback(
    (
      parameterFilters: FilterProps,
      parameterQuery?: string,
      parameterOrderBy?: string
    ) => {
      let newFilter = "";
      Object.entries(parameterFilters).forEach(([field, values]) => {
        if (values && values[0] !== "") {
          values.forEach((value) => {
            let newValue = value;
            // Array 是日期格式，转换成 ISO 格式
            if (newValue instanceof Array) {
              newFilter = `${
                newFilter ? `${newFilter} ` : ""
              }${dateArrayToQuery(field, newValue)}`;
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
              newFilter = `${
                newFilter ? `${newFilter} ` : ""
              }${field}:${newValue}`;
            }
          });
        }
      });

      const orderByArr = parameterOrderBy
        ? parameterOrderBy.split(" ")
        : sortValue.split(" ");

      const tempVariables = {
        ...variables,
        query: `${parameterQuery || query} ${newFilter}`.trim(),
        orderBy: {
          field: orderByArr[0],
          direction: OrderDirection[orderByArr[1]],
        },
      };
      if (tempVariables.query === "") {
        delete tempVariables.query;
      }
      if (!orderByArr || orderByArr.length !== 2 || parameterOrderBy === "") {
        delete tempVariables.orderBy;
      }
      onVariablesChange(tempVariables);
    },
    [sortValue, variables, query, onVariablesChange, columns]
  );

  const newColumns = useMemo(
    () =>
      columns.map((column) => {
        if (
          column.valueType === ValueType.TAG ||
          (typeof column.valueType === "object" &&
            column.valueType?.type === ValueType.TAG &&
            !(column.valueType as TagValueObjectType<T>)?.onClick)
        ) {
          return {
            ...column,
            valueType: {
              type: ValueType.TAG,
              onClick: (tagItem) => {
                const tempFilters = { ...filters };
                if (tempFilters[column.key]) {
                  if (!tempFilters[column.key].includes(tagItem[0])) {
                    tempFilters[column.key].push(tagItem[0]);
                  } else {
                    tempFilters[column.key] = tempFilters[column.key].filter(
                      (tempTagList) => tempTagList !== tagItem[0]
                    );
                    if (tempFilters[column.key].length === 0) {
                      delete tempFilters[column.key];
                    }
                  }
                } else {
                  tempFilters[column.key] = [tagItem[0]];
                }
                setFilters(tempFilters);
                handelSubmitFilters(tempFilters);
                setRouteParams({
                  ...routeParams,
                  filter: encodeURIComponent(JSON.stringify(tempFilters)),
                });
              },
            },
          };
        }
        return omit(column, ["filters", "sorter"]);
      }),
    [columns, filters, handelSubmitFilters, routeParams, setRouteParams]
  );

  useEffect(() => {
    const sort =
      defaultSort?.field && defaultSort?.direction
        ? `${defaultSort?.field} ${defaultSort?.direction}`
        : "";
    handelSubmitFilters(
      routeParams.filter
        ? JSON.parse(decodeURIComponent(routeParams.filter))
        : {},
      routeParams.query,
      routeParams.field && routeParams.direction
        ? `${routeParams.field} ${routeParams.direction}`
        : sort
    );
    if (routeParams.query) {
      setQuery(routeParams.query);
    }
    if (routeParams.filter) {
      const tempFilter = JSON.parse(decodeURIComponent(routeParams.filter));
      setFilters(tempFilter);
      setBindValues(tempFilter);
    }
    if (routeParams.field && routeParams.direction) {
      setSortValue(`${routeParams.field} ${routeParams.direction}`);
    } else if (defaultSort?.field && defaultSort?.direction) {
      setSortValue(`${defaultSort?.field} ${defaultSort?.direction}`);
      setRouteParams({
        ...routeParams,
        field: defaultSort?.field,
        direction: defaultSort?.direction,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StyledGraphQLTable>
      <FilterDrawer
        bindValues={bindValues}
        columns={columnsFilterResults}
        filters={filters}
        routeParams={routeParams}
        visible={drawerVisible}
        onBindValuesChange={setBindValues}
        onClose={() => setDrawerVisible(false)}
        onFiltersChange={setFilters}
        onRouteParamsChange={setRouteParams}
        onSubmit={handelSubmitFilters}
      />
      <div style={{ display: "flex" }}>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onPressEnter={() => {
            setPage(1);
            handelSubmitFilters(filters);
            setRouteParams({ ...routeParams, query });
          }}
        />
        {columnsFilterResults.length > 0 && (
          <Button
            style={{ marginLeft: 10 }}
            onClick={() => setDrawerVisible(true)}
          >
            筛选器
          </Button>
        )}
        {columnsSortResults.length > 0 && (
          <Popover
            content={
              <>
                <Radio.Group
                  style={{ display: "block" }}
                  value={sortValue}
                  onChange={(e) => {
                    const sortValueArr = e.target.value.split(" ");
                    setSortValue(e.target.value);
                    setPage(1);
                    handelSubmitFilters(filters, undefined, e.target.value);
                    setRouteParams({
                      ...routeParams,
                      field: sortValueArr[0],
                      direction: sortValueArr[1],
                    });
                  }}
                >
                  {columnsSortResults.map(
                    (columnsSortResult) =>
                      columnsSortResult.sorter && (
                        <div key={columnsSortResult.key}>
                          <StyledRadio
                            value={`${columnsSortResult.key} ${OrderDirection.ASC}`}
                          >
                            {columnsSortResult.title}（正序）
                          </StyledRadio>
                          <StyledRadio
                            value={`${columnsSortResult.key} ${OrderDirection.DESC}`}
                          >
                            {columnsSortResult.title}（倒序）
                          </StyledRadio>
                        </div>
                      )
                  )}
                </Radio.Group>
                <StyledButton
                  type="link"
                  onClick={() => {
                    setSortValue("");
                    if (sortValue !== "") {
                      setPage(1);
                    }
                    handelSubmitFilters(filters, undefined, "");
                    setRouteParams({
                      ...routeParams,
                      field: "",
                      direction: "",
                    });
                  }}
                >
                  清除
                </StyledButton>
              </>
            }
            placement="bottomLeft"
            title="排序方式"
            trigger="click"
            visible={popoverVisible}
            onVisibleChange={(visible) => setPopoverVisible(visible)}
          >
            <Button style={{ marginLeft: 10 }}>排序</Button>
          </Popover>
        )}
      </div>
      <div style={{ marginTop: 10 }}>
        {(() => {
          const tagList: Array<{
            field: string;
            value: string | number | boolean;
          }> = [];

          Object.keys(filters).forEach((field) => {
            filters[field].forEach((value) => {
              if (value instanceof Array) {
                tagList.push({ field, value: `${value[0]} 到 ${value[1]}` });
              } else {
                tagList.push({ field, value });
              }
            });
          });
          return tagList.map((tag) => (
            <Tag
              key={`${tag.field}:${tag.value}`}
              onClose={() => {
                const tempBindValues = { ...bindValues };
                if (tempBindValues[tag.field][0] instanceof Array) {
                  delete tempBindValues[tag.field];
                  // ValueType 是 TAG 的没有 tempBindValues[tag.field]
                } else if (tempBindValues[tag.field]) {
                  tempBindValues[tag.field] = tempBindValues[tag.field].filter(
                    (item) => item !== tag.value
                  );
                  if (tempBindValues[tag.field].length === 0) {
                    delete tempBindValues[tag.field];
                  }
                }
                setBindValues(tempBindValues);
                const tempFilters = { ...filters };
                // Array 是日期格式
                if (tempFilters[tag.field][0] instanceof Array) {
                  delete tempFilters[tag.field];
                } else {
                  tempFilters[tag.field] = tempFilters[tag.field].filter(
                    (item) => item !== tag.value
                  );
                  if (tempFilters[tag.field].length === 0) {
                    delete tempFilters[tag.field];
                  }
                }
                setRouteParams({
                  ...routeParams,
                  filter: encodeURIComponent(JSON.stringify(tempFilters)),
                });
                setFilters(tempFilters);
                handelSubmitFilters(tempFilters);
              }}
            >
              {columns.find((column) => column.key === tag.field)?.title ||
                tag.field}
              :{String(tag.value)}
            </Tag>
          ));
        })()}
      </div>
      <SimpleTable<T>
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        columns={newColumns}
        dataSource={dataSource.slice((page - 1) * pageSize, page * pageSize)}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: handlePageChange,
        }}
      />
    </StyledGraphQLTable>
  );
}
