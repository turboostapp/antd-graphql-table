import { Button, Input, Popover, Radio, Tag } from "antd";
import {
  FilterType,
  SimpleTable,
  SimpleTableProps,
  TagValueObjectType,
  ValueType,
} from "antd-simple-table";
import { CheckboxValueType } from "antd/lib/checkbox/Group";
import omit from "lodash/omit";
import Mousetrap from "mousetrap";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import { Direction, Ordering } from "./types/types";

import FilterDrawer from "./components/FilterDrawer";
import useRouteParamsState from "./hooks/useRouteParamsState";

const StyledGraphQLTable = styled.div`
  .ant-pagination-item {
    display: none;
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

export interface GraphQLTableProps<T> extends SimpleTableProps<T> {
  dataSource: T[];
  hasMore: boolean;
  variables: Variables;
  onLoadMore?: () => void | Promise<void>;
  onVariablesChange: (variables: Variables) => void;
}

export function GraphQLTable<T>(props: GraphQLTableProps<T>) {
  const {
    columns,
    dataSource = [],
    hasMore,
    loading,
    variables = {},
    onLoadMore,
    onVariablesChange,
  } = props;

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [sortValue, setSortValue] = useState("");

  const [query, setQuery] = useState<string>(variables.query || "");

  // 控件绑定的值，不包含 > <
  const [bindValues, setBindValues] = useState<{
    [key: string]: CheckboxValueType[];
  }>({});

  // 处理后的筛选，包含 > <
  const [filters, setFilters] = useState<{
    [key: string]: CheckboxValueType[];
  }>({});

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
  useEffect(() => {
    Mousetrap.bind(["j"], () => handlePageChange(page - 1));
    Mousetrap.bind(["k"], () => handlePageChange(page + 1));
    return () => Mousetrap.unbind("j", "k");
  }, [handlePageChange, page]);

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

  const handelSubmitFilters = useCallback(
    (
      parameterFilters: {
        [key: string]: CheckboxValueType[];
      },
      parameterQuery?: string,
      parameterOrderBy?: string
    ) => {
      let newFilter = "";
      // 将 column 中是 selectInput 类型的都取出来，将 dataIndex 放进 selectArr 中
      const columnsResults = columnsFilterResults.filter(
        (item) => item.filterType === FilterType.SelectInput
      );
      const selectArr = [];
      if (columnsFilterResults.length > 0) {
        columnsResults.forEach((item) => {
          selectArr.push(item.dataIndex);
        });
      }
      Object.entries(parameterFilters).forEach(([field, values]) => {
        if (values && values[0] !== "") {
          values.forEach((value) => {
            let newValue = value;
            if (typeof newValue === "string") {
              // 如果是 selectInput 类型的
              if (selectArr.includes(field)) {
                if (!/(^[-+]?[0-9]+(\.[0-9]+)?)$/.test(newValue)) {
                  if (/^[<>]/.test(newValue)) {
                    newValue = /(^[-+]?[0-9]+(\.[0-9]+)?)$/.test(
                      newValue.slice(1)
                    )
                      ? newValue
                      : `${newValue.slice(0, 1)}"${newValue.slice(1)}"`;
                  } else {
                    newValue = `"${newValue}"`;
                  }
                }
              } else {
                newValue = /(^[-+]?[0-9]+(\.[0-9]+)?)$/.test(newValue)
                  ? newValue
                  : `"${newValue}"`;
              }
            }
            newFilter = `${
              newFilter ? `${newFilter} ` : ""
            }${field}:${newValue}`;
          });
        }
      });

      const orderByArr = parameterOrderBy
        ? parameterOrderBy.split(" ")
        : sortValue.split(" ");

      const tempVariables = {
        ...variables,
        query: `${parameterQuery || query} ${newFilter}`.trim(),
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
    [columnsFilterResults, onVariablesChange, query, variables, sortValue]
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
                if (tempFilters.tags) {
                  if (tempFilters.tags.indexOf(tagItem[0]) < 0) {
                    tempFilters.tags.push(tagItem[0]);
                  } else {
                    tempFilters.tags = tempFilters.tags.filter(
                      (tempTagList) => tempTagList !== tagItem[0]
                    );
                    if (tempFilters.tags.length === 0) {
                      delete tempFilters.tags;
                    }
                  }
                } else {
                  tempFilters.tags = [tagItem[0]];
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
    handelSubmitFilters(
      routeParams.filter
        ? JSON.parse(decodeURIComponent(routeParams.filter))
        : {},
      routeParams.query,
      routeParams.sort && routeParams.direction
        ? `${routeParams.sort} ${routeParams.direction}`
        : ""
    );
    if (routeParams.query) {
      setQuery(routeParams.query);
    }
    if (routeParams.filter) {
      const tempFilter = JSON.parse(decodeURIComponent(routeParams.filter));
      // 将 column 中是 selectInput 类型的都取出来，将 dataIndex 放进 selectArr 中
      const columnsResults = columnsFilterResults.filter(
        (item) => item.filterType === FilterType.SelectInput
      );
      const selectArr = [];
      if (columnsFilterResults.length > 0) {
        columnsResults.forEach((item) => {
          selectArr.push(item.dataIndex);
        });
      }
      // 判断 url 中的 filter 是否有 selectInput 类型，且包含 > < 符号的，需拆开
      Object.keys(tempFilter).forEach((key) => {
        if (selectArr.includes(key)) {
          tempFilter[key][0] = tempFilter[key][0].replace(/[>|<]/, "");
        }
      });
      setFilters(JSON.parse(decodeURIComponent(routeParams.filter)));
      setBindValues(tempFilter);
    }
    if (routeParams.sort && routeParams.direction) {
      setSortValue(`${routeParams.sort} ${routeParams.direction}`);
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
          const tagList: {
            field: string;
            value: string | number | boolean;
          }[] = [];

          Object.keys(filters).forEach((field) => {
            filters[field].forEach((value) => {
              tagList.push({ field, value });
            });
          });
          return tagList.map((tag) => (
            <Tag
              closable
              key={`${tag.field}:${tag.value}`}
              onClose={() => {
                // 处理filters,例如此时标签的值为 >123,但输入框里需显示为123，要做特殊处理
                const tempBindValues = { ...bindValues };
                const result = columnsFilterResults.find(
                  (item) => item.dataIndex === tag.field
                );
                if (result?.filterType === FilterType.SelectInput) {
                  delete tempBindValues[tag.field];
                } else if (tag.field !== "tags") {
                  tempBindValues[tag.field] = tempBindValues[tag.field].filter(
                    (item) => item !== tag.value
                  );
                  if (tempBindValues[tag.field].length === 0) {
                    delete tempBindValues[tag.field];
                  }
                }
                setBindValues(tempBindValues);
                // 处理 tags
                const tempFilters = { ...filters };
                tempFilters[tag.field] = tempFilters[tag.field].filter(
                  (item) => item !== tag.value
                );
                if (tempFilters[tag.field].length === 0) {
                  delete tempFilters[tag.field];
                }
                setRouteParams({
                  ...routeParams,
                  filter: encodeURIComponent(JSON.stringify(tempFilters)),
                });
                setFilters(tempFilters);
                handelSubmitFilters(tempFilters);
              }}
            >
              {tag.field}:{String(tag.value)}
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
