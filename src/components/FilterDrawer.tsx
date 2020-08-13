import {
  Button,
  Checkbox,
  Collapse,
  DatePicker,
  Drawer,
  Input,
  Radio,
} from "antd";
import moment from "moment";
import React, { ReactElement, useEffect, useRef } from "react";
import styled from "styled-components";

import { FilterProps } from "../GraphQLTable";
import { GraphQLTableColumnType } from "../interfaces/GraphQLTableColumnType";
import { FilterType } from "../types/FilterType";
import getDataIndex from "../utils/getDataIndex";

const { Panel } = Collapse;
const { RangePicker } = DatePicker;

const StyledDrawer = styled(Drawer)`
  .ant-drawer-body {
    padding: 10px;
  }
  .ant-collapse {
    border: none;
    background-color: #fff;
  }

  .ant-collapse > .ant-collapse-item {
    border-bottom: none;
  }

  .ant-collapse-content {
    border-top: none;
    border-bottom: 1px solid #d9d9d9;
  }
`;

const StyledCheckbox = styled(Checkbox)`
  display: block;

  height: 30px;
  margin: 0 !important;
`;

const StyledRadio = styled(Radio)`
  display: block;

  height: 30px;
`;

const StyledButton = styled(Button)`
  padding: 4px 0;
`;

interface FilterDrawerProps<T> {
  columns: GraphQLTableColumnType<T>[];
  visible: boolean;
  filters: FilterProps;
  bindValues: FilterProps;
  onFiltersChange: (filters: FilterProps) => void;
  routeParams: {
    [key: string]: string;
  };
  onRouteParamsChange: (routeParams: { [key: string]: string }) => void;
  onBindValuesChange: (bindValues: FilterProps) => void;
  onSubmit: (filters: FilterProps) => void;
  onClose: () => void;
}

export default function FilterDrawer<T>({
  columns,
  visible,
  filters,
  bindValues,
  routeParams,
  onFiltersChange,
  onBindValuesChange,
  onSubmit,
  onClose,
  onRouteParamsChange,
}: FilterDrawerProps<T>): ReactElement {
  const timer = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(timer.current);
    };
  }, []);

  // Input 防抖
  const debounceFilterTypeInput = (value, columnIndex) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const tempFilters = { ...filters };
      tempFilters[columnIndex] = [value];
      if (value === "") {
        delete tempFilters[columnIndex];
      }
      onRouteParamsChange({
        ...routeParams,
        filter: encodeURIComponent(JSON.stringify(tempFilters)),
      });
      onFiltersChange(tempFilters);
      onSubmit(tempFilters);
      timer.current = null;
    }, 1000);
  };

  return (
    <StyledDrawer
      closable
      footer={
        columns.length > 0 && (
          <Button
            onClick={() => {
              onBindValuesChange({});
              onFiltersChange({});
              onSubmit({});
              onRouteParamsChange({});
            }}
          >
            清除所有筛选条件
          </Button>
        )
      }
      placement="right"
      title="筛选器"
      visible={visible}
      width={400}
      onClose={onClose}
    >
      <Collapse expandIconPosition="right">
        {columns.map((columnsFilterResult) => {
          const columnIndex = getDataIndex(columnsFilterResult.dataIndex);
          const ClearButton = (
            <StyledButton
              type="link"
              onClick={() => {
                const tempBindValues = { ...bindValues };
                const tempFilters = { ...filters };
                delete tempBindValues[columnIndex];
                delete tempFilters[columnIndex];
                onBindValuesChange(tempBindValues);
                onFiltersChange(tempFilters);
                onSubmit(tempFilters);
                onRouteParamsChange({
                  ...routeParams,
                  filter: encodeURIComponent(JSON.stringify(tempFilters)),
                });
              }}
            >
              清除
            </StyledButton>
          );
          return (
            <Panel
              header={columnsFilterResult.title}
              key={columnsFilterResult.key}
            >
              {columnsFilterResult.filterType === FilterType.INPUT && (
                <>
                  <Input
                    value={
                      bindValues[columnIndex]
                        ? String(bindValues[columnIndex][0])
                        : ""
                    }
                    onChange={(event) => {
                      const tempBindValues = { ...bindValues };
                      tempBindValues[columnIndex] = [event.target.value];
                      if (event.target.value === "") {
                        delete tempBindValues[columnIndex];
                      }
                      onBindValuesChange(tempBindValues);
                      debounceFilterTypeInput(event.target.value, columnIndex);
                    }}
                    onBlur={(event) => {
                      // 如果计时器还在跑的时候失去焦点，清除计时器，直接执行
                      if (timer.current) {
                        clearTimeout(timer.current);
                        const tempFilters = { ...filters };
                        tempFilters[columnIndex] = [event.target.value];
                        if (event.target.value === "") {
                          delete tempFilters[columnIndex];
                        }
                        onRouteParamsChange({
                          ...routeParams,
                          filter: encodeURIComponent(
                            JSON.stringify(tempFilters)
                          ),
                        });
                        onFiltersChange(tempFilters);
                        onSubmit(tempFilters);
                      }
                    }}
                  />
                  {ClearButton}
                </>
              )}
              {(columnsFilterResult.filterType ===
                FilterType.DATE_RANGE_PICKER ||
                columnsFilterResult.filterType ===
                  FilterType.DATE_TIME_RANGE_PICKER) && (
                <>
                  <Input.Group compact>
                    <RangePicker
                      showTime={
                        columnsFilterResult.filterType !==
                        FilterType.DATE_RANGE_PICKER
                      }
                      style={{ width: "80%" }}
                      value={
                        bindValues[columnIndex]
                          ? [
                              moment(bindValues[columnIndex][0][0]),
                              moment(bindValues[columnIndex][0][1]),
                            ]
                          : null
                      }
                      onChange={(dates, dateStrings) => {
                        const tempBindValues = { ...bindValues };
                        const tempFilters = { ...filters };
                        tempBindValues[columnIndex] = [dateStrings];
                        onBindValuesChange(tempBindValues);
                        if (dates) {
                          tempFilters[columnIndex] = [dateStrings];
                        } else {
                          delete tempBindValues[columnIndex];
                          delete tempFilters[columnIndex];
                        }
                        onFiltersChange(tempFilters);
                        onSubmit(tempFilters);
                        onRouteParamsChange({
                          ...routeParams,
                          filter: encodeURIComponent(
                            JSON.stringify(tempFilters)
                          ),
                        });
                      }}
                    />
                  </Input.Group>
                  {ClearButton}
                </>
              )}
              {columnsFilterResult.filterType === FilterType.CHECKBOX &&
                columnsFilterResult.filters && (
                  <>
                    <Checkbox.Group
                      style={{ display: "block" }}
                      value={
                        bindValues[columnIndex] as (string | number | boolean)[]
                      }
                      onChange={(value) => {
                        const tempBindValues = { ...bindValues };
                        const tempFilters = { ...filters };
                        if (value.length === 0) {
                          delete tempBindValues[columnIndex];
                          delete tempFilters[columnIndex];
                        } else {
                          tempBindValues[columnIndex] = value;
                          tempFilters[columnIndex] = value;
                        }
                        onBindValuesChange(tempBindValues);
                        onFiltersChange(tempFilters);
                        onSubmit(tempFilters);
                        onRouteParamsChange({
                          ...routeParams,
                          filter: encodeURIComponent(
                            JSON.stringify(tempFilters)
                          ),
                        });
                      }}
                    >
                      {columnsFilterResult.filters.map((filter) => (
                        <StyledCheckbox
                          key={String(filter.value)}
                          value={filter.value}
                        >
                          {filter.text}
                        </StyledCheckbox>
                      ))}
                    </Checkbox.Group>
                    {ClearButton}
                  </>
                )}
              {columnsFilterResult.filterType === FilterType.RADIO &&
                columnsFilterResult.filters && (
                  <>
                    <Radio.Group
                      style={{ display: "block" }}
                      value={
                        bindValues[columnIndex]
                          ? bindValues[columnIndex][0]
                          : undefined
                      }
                      onChange={(e) => {
                        const tempBindValues = { ...bindValues };
                        const tempFilters = { ...filters };
                        tempBindValues[columnIndex] = [e.target.value];
                        tempFilters[columnIndex] = [e.target.value];
                        onBindValuesChange(tempBindValues);
                        onFiltersChange(tempFilters);
                        onSubmit(tempFilters);
                        onRouteParamsChange({
                          ...routeParams,
                          filter: encodeURIComponent(
                            JSON.stringify(tempFilters)
                          ),
                        });
                      }}
                    >
                      {columnsFilterResult.filters.map((filter) => (
                        <StyledRadio
                          key={String(filter.value)}
                          value={filter.value}
                        >
                          {filter.text}
                        </StyledRadio>
                      ))}
                    </Radio.Group>
                    {ClearButton}
                  </>
                )}
            </Panel>
          );
        })}
      </Collapse>
    </StyledDrawer>
  );
}
