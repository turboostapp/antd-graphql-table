import { SearchOutlined } from "@ant-design/icons";
import { Button, Input, Popover, Radio } from "antd";
import {
  SimpleTable,
  SimpleTableProps,
  TagValueObjectType,
  ValueType,
} from "antd-simple-table";
import { CheckboxValueType } from "antd/lib/checkbox/Group";
import omit from "lodash/omit";
import qs from "qs";
import React, {
  Fragment,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocalStorage } from "react-use";
import styled from "styled-components";

import FilterDrawer from "./components/FilterDrawer";
import { Pagination } from "./components/Pagination";
import Tag from "./components/Tag";
import useRouteParamsState from "./hooks/useRouteParamsState";
import { GraphQLTableColumnType } from "./interfaces/GraphQLTableColumnType";
import { OrderDirection, PageInfo, Variables } from "./types/BaseTypes";
import { filterToQuery } from "./utils/filterToQuery";

const StyledRadio = styled(Radio)`
  display: block;

  height: 30px;

  line-height: 30px;
`;

const StyledButton = styled(Button)`
  padding: 4px 0;
`;

const SearchButton = styled.span`
  padding: 0 16px;
`;

const SearchWrapper = styled.div`
  display: flex;
  margin-bottom: 20px;
  .ant-input-group-addon {
    cursor: pointer;
    user-select: none;

    color: #888;
    :hover {
      background-color: #f0f0f0;
    }
  }
`;

export interface FilterProps {
  [key: string]: (CheckboxValueType | [string, string])[];
}

export interface GraphQLTableProps<T> extends SimpleTableProps<T> {
  id: string;
  placeholder?: string;
  columns: Array<GraphQLTableColumnType<T>>;
  pageSize?: string | number;
  pageInfo?: PageInfo;
  onVariablesChange: (variables: Variables) => void;
}

export function GraphQLTable<T>(props: GraphQLTableProps<T>): ReactElement {
  const {
    id,
    columns,
    placeholder = "",
    pageSize = 10,
    pageInfo = { hasPreviousPage: false, hasNextPage: false },
    onVariablesChange,
  } = props;

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [sortValue, setSortValue] = useState(null);

  const [, setLocalStorageValue] = useLocalStorage(
    `graphql-table-query-params:${id}`
  );

  const [query, setQuery] = useState<string>("");

  // 筛选控件绑定的值
  const [bindValues, setBindValues] = useState<FilterProps>({});

  // 筛选处理后的值
  const [filters, setFilters] = useState<FilterProps>({});

  const [routeParams, setRouteParams] = useRouteParamsState(
    ["query", "filter", "orderBy"],
    id
  );

  // 页面初始化
  useEffect(() => {
    const tempVariables: Variables = {};

    const queryParams = qs.parse(window.location.search, {
      ignoreQueryPrefix: true,
    });
    if (queryParams.before) {
      tempVariables.last = Number(pageSize);
      tempVariables.before = queryParams.before as string;
    } else {
      tempVariables.first = Number(pageSize);
      if (queryParams.after) {
        tempVariables.after = queryParams.after as string;
      }
    }

    if (routeParams.query) {
      setQuery(routeParams.query);
      tempVariables.query = routeParams.query;
    }
    if (routeParams.filter) {
      const tempFilter = JSON.parse(decodeURIComponent(routeParams.filter));
      setFilters(tempFilter);
      setBindValues(tempFilter);
      tempVariables.query = `${tempVariables.query || ""} ${filterToQuery(
        tempFilter,
        columns
      )}`.trim();
    }
    if (routeParams.orderBy) {
      const decodeSortValue = decodeURIComponent(routeParams.orderBy);
      setSortValue(decodeSortValue);
      tempVariables.orderBy = JSON.parse(decodeSortValue);
    }

    setLocalStorageValue(queryParams);

    onVariablesChange(tempVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 点击筛选或排序触发
  const handleVariablesChange = useCallback(
    (parameterFilters?: FilterProps, parameterOrderBy?: string) => {
      // filter 转换成 query
      const changedQuery = filterToQuery(parameterFilters || filters, columns);

      // 改变筛选或排序后只需要 query 和 orderBy，不需要 before after
      const tempVariables = {
        first: Number(pageSize),
        query: `${query} ${changedQuery}`.trim(),
        // parameterOrderBy 有值是刚改变， null 是清空，其它是改变筛选时使用 sortValue
        orderBy: JSON.parse(
          parameterOrderBy || parameterOrderBy === null
            ? parameterOrderBy
            : sortValue
        ),
      };
      if (!tempVariables.query) {
        delete tempVariables.query;
      }
      if (!tempVariables.orderBy) {
        delete tempVariables.orderBy;
      }

      onVariablesChange(tempVariables);

      return tempVariables;
    },
    [filters, columns, pageSize, query, sortValue, onVariablesChange]
  );

  // 需要传给 Pagination 用
  const variables = useMemo(() => {
    const changedQuery = filterToQuery(filters, columns);

    const tempVariables = {
      query: `${query} ${changedQuery}`.trim(),
      orderBy: JSON.parse(sortValue),
    };
    if (!tempVariables.query) {
      delete tempVariables.query;
    }
    if (!tempVariables.orderBy) {
      delete tempVariables.orderBy;
    }

    return tempVariables;
  }, [columns, filters, query, sortValue]);

  const columnsFilterResults = useMemo(
    () => columns.filter((column) => column.filters || column.filterType),
    [columns]
  );

  const columnsSortResults = useMemo(
    () => columns.filter((column) => column.sorter),
    [columns]
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
            ...omit(column, ["filters", "sorter"]),
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
                handleVariablesChange(tempFilters);
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
    [columns, filters, handleVariablesChange, routeParams, setRouteParams]
  );

  return (
    <div>
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
        onSubmit={handleVariablesChange}
      />
      <SearchWrapper>
        <Input
          value={query}
          placeholder={placeholder}
          prefix={<SearchOutlined />}
          addonAfter={
            <SearchButton
              onClick={() => {
                handleVariablesChange(filters);
                setRouteParams({ ...routeParams, query });
              }}
            >
              搜索
            </SearchButton>
          }
          onChange={(event) => setQuery(event.target.value)}
          onPressEnter={() => {
            handleVariablesChange(filters);
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
                    setSortValue(e.target.value);
                    handleVariablesChange(filters, e.target.value);
                    setRouteParams({
                      ...routeParams,
                      orderBy: encodeURIComponent(e.target.value),
                    });
                  }}
                >
                  {columnsSortResults.map((columnsSortResult) => (
                    <Fragment key={columnsSortResult.key}>
                      <StyledRadio
                        value={JSON.stringify({
                          field: columnsSortResult.key,
                          direction: OrderDirection.ASC,
                        })}
                      >
                        {columnsSortResult.title}（正序）
                      </StyledRadio>
                      <StyledRadio
                        value={JSON.stringify({
                          field: columnsSortResult.key,
                          direction: OrderDirection.DESC,
                        })}
                      >
                        {columnsSortResult.title}（倒序）
                      </StyledRadio>
                    </Fragment>
                  ))}
                </Radio.Group>
                <StyledButton
                  type="link"
                  onClick={() => {
                    setSortValue(null);
                    handleVariablesChange(filters, null);
                    setRouteParams({ ...routeParams, orderBy: null });
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
      </SearchWrapper>
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
                if (
                  tempBindValues[tag.field] &&
                  tempBindValues[tag.field][0] instanceof Array
                ) {
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
                if (
                  tempBindValues[tag.field] &&
                  tempFilters[tag.field][0] instanceof Array
                ) {
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
                handleVariablesChange(tempFilters);
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
        pagination={false}
      />
      <Pagination
        id={id}
        pageSize={pageSize}
        pageInfo={pageInfo}
        onVariablesChange={onVariablesChange}
        variables={variables}
      />
    </div>
  );
}
