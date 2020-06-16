import { Button, Checkbox, Collapse, DatePicker, Drawer, Input } from "antd";
import moment from "moment";
import React from "react";
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

export default function FilterDrawer<T extends {}>({
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
}: FilterDrawerProps<T>) {
  return (
    <StyledDrawer
      closable
      footer={
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
          return (
            <Panel
              header={columnsFilterResult.title}
              key={columnsFilterResult.key}
            >
              {columnsFilterResult.filterType === FilterType.Input && (
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
                    }}
                    onPressEnter={(event) => {
                      const tempFilters = { ...filters };
                      tempFilters[columnIndex] = [
                        (event.target as HTMLInputElement).value,
                      ];
                      if ((event.target as HTMLInputElement).value === "") {
                        delete tempFilters[columnIndex];
                      }
                      onRouteParamsChange({
                        ...routeParams,
                        filter: encodeURIComponent(JSON.stringify(tempFilters)),
                      });
                      onFiltersChange(tempFilters);
                      onSubmit(tempFilters);
                    }}
                  />
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
                </>
              )}
              {(columnsFilterResult.filterType === FilterType.DateRangePicker ||
                columnsFilterResult.filterType ===
                  FilterType.DateTimeRangePicker) && (
                <>
                  <Input.Group compact>
                    <RangePicker
                      showTime={
                        columnsFilterResult.filterType !==
                        FilterType.DateRangePicker
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
                  <StyledButton
                    type="link"
                    onClick={() => {
                      const tempBindValues = { ...bindValues };
                      const tempFilters = { ...filters };
                      delete tempBindValues[columnIndex];
                      delete tempFilters[columnIndex];
                      onBindValuesChange(tempBindValues);
                      onFiltersChange(tempFilters);
                      onRouteParamsChange({
                        ...routeParams,
                        filter: encodeURIComponent(JSON.stringify(tempFilters)),
                      });
                      onSubmit(tempFilters);
                    }}
                  >
                    清除
                  </StyledButton>
                </>
              )}
              {columnsFilterResult.filters && (
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
                        filter: encodeURIComponent(JSON.stringify(tempFilters)),
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
                </>
              )}
            </Panel>
          );
        })}
      </Collapse>
    </StyledDrawer>
  );
}
