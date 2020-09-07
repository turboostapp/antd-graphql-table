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
  const debounceFilterTypeInput = (value, key) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const tempFilters = { ...filters };
      tempFilters[key] = [value];
      if (value === "") {
        delete tempFilters[key];
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
        <Button
          onClick={() => {
            onBindValuesChange({});
            onFiltersChange({});
            onSubmit({});
            onRouteParamsChange({ ...routeParams, filter: "{}" });
          }}
        >
          清除所有筛选条件
        </Button>
      }
      placement="right"
      title="筛选器"
      visible={visible}
      width={400}
      onClose={onClose}
    >
      <Collapse expandIconPosition="right">
        {columns.map((column) => {
          const { key } = column;

          const ClearButton = (
            <StyledButton
              type="link"
              onClick={() => {
                const tempBindValues = { ...bindValues };
                const tempFilters = { ...filters };
                delete tempBindValues[key];
                delete tempFilters[key];
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
            <Panel header={column.title} key={key}>
              {(column.filterType === FilterType.INPUT ||
                column.filterType === FilterType.INPUT_NUMBER) && (
                <>
                  <Input
                    value={bindValues[key] ? String(bindValues[key][0]) : ""}
                    onChange={(event) => {
                      let value = event.target.value;
                      if (column.filterType === FilterType.INPUT_NUMBER) {
                        value = value.replace(/[^\d]+/g, "");
                      }
                      const tempBindValues = { ...bindValues };
                      tempBindValues[key] = [value];
                      if (!value) {
                        delete tempBindValues[key];
                      }
                      onBindValuesChange(tempBindValues);
                      debounceFilterTypeInput(value, key);
                    }}
                    onBlur={(event) => {
                      // 如果计时器还在跑的时候失去焦点，清除计时器，直接执行
                      if (timer.current) {
                        clearTimeout(timer.current);
                        const tempFilters = { ...filters };
                        tempFilters[key] = [event.target.value];
                        if (event.target.value === "") {
                          delete tempFilters[key];
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
              {(column.filterType === FilterType.DATE_RANGE_PICKER ||
                column.filterType === FilterType.DATE_TIME_RANGE_PICKER) && (
                <>
                  <Input.Group compact>
                    <RangePicker
                      showTime={
                        column.filterType !== FilterType.DATE_RANGE_PICKER
                      }
                      style={{ width: "80%" }}
                      value={
                        bindValues[key]
                          ? [
                              moment(bindValues[key][0][0]),
                              moment(bindValues[key][0][1]),
                            ]
                          : null
                      }
                      onChange={(dates, dateStrings) => {
                        const tempBindValues = { ...bindValues };
                        const tempFilters = { ...filters };
                        tempBindValues[key] = [dateStrings];
                        onBindValuesChange(tempBindValues);
                        if (dates) {
                          tempFilters[key] = [dateStrings];
                        } else {
                          delete tempBindValues[key];
                          delete tempFilters[key];
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
              {column.filterType === FilterType.CHECKBOX && column.filters && (
                <>
                  <Checkbox.Group
                    style={{ display: "block" }}
                    value={bindValues[key] as (string | number | boolean)[]}
                    onChange={(value) => {
                      const tempBindValues = { ...bindValues };
                      const tempFilters = { ...filters };
                      if (value.length === 0) {
                        delete tempBindValues[key];
                        delete tempFilters[key];
                      } else {
                        tempBindValues[key] = value;
                        tempFilters[key] = value;
                      }
                      onBindValuesChange(tempBindValues);
                      onFiltersChange(tempFilters);
                      onSubmit(tempFilters);
                      onRouteParamsChange({
                        ...routeParams,
                        filter: encodeURIComponent(JSON.stringify(tempFilters)),
                      });
                    }}
                  >
                    {column.filters.map((filter) => (
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
              {column.filterType === FilterType.RADIO && column.filters && (
                <>
                  <Radio.Group
                    style={{ display: "block" }}
                    value={bindValues[key] ? bindValues[key][0] : undefined}
                    onChange={(e) => {
                      const tempBindValues = { ...bindValues };
                      const tempFilters = { ...filters };
                      tempBindValues[key] = [e.target.value];
                      tempFilters[key] = [e.target.value];
                      onBindValuesChange(tempBindValues);
                      onFiltersChange(tempFilters);
                      onSubmit(tempFilters);
                      onRouteParamsChange({
                        ...routeParams,
                        filter: encodeURIComponent(JSON.stringify(tempFilters)),
                      });
                    }}
                  >
                    {column.filters.map((filter) => (
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
