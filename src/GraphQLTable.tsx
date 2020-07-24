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
import { Direction, Ordering } from "./types/BaseTypes";

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
  query?: string;
  orderBy?: Ordering[];
}

export interface FilterProps {
  [key: string]: (CheckboxValueType | [string, string])[];
}

export interface GraphQLTableProps<T> extends SimpleTableProps<T> {
  dataSource: T[];
  columns: Array<GraphQLTableColumnType<T>>;
  hasMore: boolean;
  variables?: Variables;
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
    "sort",
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

  // 解决 refresh 后 page 未恢复
  useEffect(() => {
    if (maxPage === 2 && hasMore) {
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

  // 将输入框上的属性名都转成对应的 key
  const finalQuery = useMemo(() => {
    let resultQuery = query;
    // 匹配带冒号的，例如结果为 ["日期:","email:"]
    const titleArr = resultQuery.match(/(\S+):/g);
    if (titleArr) {
      titleArr.forEach((item) => {
        // 用没冒号的去查找
        const notSymbolItem = item.replace(":", "");
        const column = columns.find((column) => column.title === notSymbolItem);
        if (column) {
          resultQuery = resultQuery.replace(item, `${column.key}:`);
        }
      });
    }
    return resultQuery;
  }, [columns, query]);

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
                newValue = /(^[-+]?[0-9]+(\.[0-9]+)?)$/.test(newValue)
                  ? newValue
                  : `"${newValue}"`;
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
        query: `${parameterQuery || finalQuery} ${newFilter}`.trim(),
        orderBy: [
          {
            sort: orderByArr[0],
            direction: Direction[orderByArr[1]],
          },
        ],
      };
      if (tempVariables.query === "") {
        delete tempVariables.query;
      }
      if (!orderByArr || orderByArr.length !== 2 || parameterOrderBy === "") {
        delete tempVariables.orderBy;
      }
      onVariablesChange(tempVariables);
    },
    [finalQuery, onVariablesChange, variables, sortValue]
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
      defaultSort?.sort && defaultSort?.direction
        ? `${defaultSort?.sort} ${defaultSort?.direction}`
        : "";
    handelSubmitFilters(
      routeParams.filter
        ? JSON.parse(decodeURIComponent(routeParams.filter))
        : {},
      routeParams.query,
      routeParams.sort && routeParams.direction
        ? `${routeParams.sort} ${routeParams.direction}`
        : sort
    );
    if (routeParams.query) {
      let resultQuery = routeParams.query;
      // 获取英文 title 名带冒号数组，例如结果为 ["domain:","tags:"]
      const titleArr = routeParams.query.match(/(\S+):/g);
      if (titleArr) {
        titleArr.forEach((item) => {
          // 用没冒号的去查找
          const notSymbolItem = item.replace(":", "");
          const column = columns.find((column) => column.key === notSymbolItem);
          if (column) {
            resultQuery = resultQuery.replace(
              item,
              `${column.title as string}:`
            );
          }
        });
      }
      setQuery(resultQuery);
    }
    if (routeParams.filter) {
      const tempFilter = JSON.parse(decodeURIComponent(routeParams.filter));
      setFilters(tempFilter);
      setBindValues(tempFilter);
    }
    if (routeParams.sort && routeParams.direction) {
      setSortValue(`${routeParams.sort} ${routeParams.direction}`);
    } else if (defaultSort?.sort && defaultSort?.direction) {
      setSortValue(`${defaultSort?.sort} ${defaultSort?.direction}`);
      setRouteParams({
        ...routeParams,
        sort: defaultSort?.sort,
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
            setRouteParams({ ...routeParams, query: finalQuery });
          }}
        />
        <Button
          style={{ marginLeft: 10 }}
          onClick={() => setDrawerVisible(true)}
        >
          筛选器
        </Button>
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
                    sort: sortValueArr[0],
                    direction: sortValueArr[1],
                  });
                }}
              >
                {columnsSortResults.map(
                  (columnsSortResult) =>
                    columnsSortResult.sorter && (
                      <div key={columnsSortResult.key}>
                        <StyledRadio
                          value={`${columnsSortResult.key} ${Direction.ASC}`}
                        >
                          {columnsSortResult.title}（正序）
                        </StyledRadio>
                        <StyledRadio
                          value={`${columnsSortResult.key} ${Direction.DESC}`}
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
                  setRouteParams({ ...routeParams, sort: "", direction: "" });
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
              {columns.find(
                (column) =>
                  // 如果 dataIndex 是数组，用 JSON.stringify 判断两个数组是否相等
                  JSON.stringify(column.dataIndex) ===
                  JSON.stringify(
                    column.dataIndex instanceof Array
                      ? tag.field.split(".")
                      : tag.field
                  )
              ).title || tag.field}
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
