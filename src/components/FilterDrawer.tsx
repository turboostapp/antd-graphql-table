import { Button, Checkbox, Collapse, Drawer, Input, Select } from "antd";
import { FilterType } from "../types/FilterType";
import { CheckboxValueType } from "antd/lib/checkbox/Group";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { GraphQLTableColumnType } from "../interfaces/Temp";

import getDataIndex from "../utils/getDataIndex";

const { Panel } = Collapse;
const { Option } = Select;

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

export interface FilterProps {
  [key: string]: CheckboxValueType[];
}

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
  const [selectValues, setSelectValues] = useState({});
  useEffect(() => {
    if (routeParams.filter) {
      const tempFilter = JSON.parse(decodeURIComponent(routeParams.filter));

      // 将 column 中是 selectInput 类型的都取出来，将 dataIndex 放进 selectArr 中
      const columnsResults = columns.filter(
        (item) => item.filterType === FilterType.SelectInput
      );
      const selectArr = [];
      if (columns.length > 0) {
        columnsResults.forEach((item) => {
          selectArr.push(item.dataIndex);
        });
      }

      // 判断 url 中的 filter 是否有 selectInput 类型，且包含 > < 符号的，需拆开
      const tempSelectValues = {};
      Object.keys(tempFilter).forEach((key) => {
        if (selectArr.includes(key)) {
          const firstString = tempFilter[key][0].slice(0, 1);
          if (firstString === "<" || firstString === ">") {
            tempSelectValues[key] = firstString;
          }
        }
      });
      setSelectValues(tempSelectValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
              {columnsFilterResult.filterType === FilterType.SelectInput && (
                <>
                  <Input.Group compact>
                    <Select
                      defaultValue="="
                      style={{ width: "20%" }}
                      value={selectValues[columnIndex]}
                      onChange={(value) => {
                        const tempSelectValues = { ...selectValues };
                        tempSelectValues[columnIndex] = value;
                        setSelectValues(tempSelectValues);
                      }}
                    >
                      <Option value="=">=</Option>
                      <Option value=">">&gt;</Option>
                      <Option value="<">&lt;</Option>
                    </Select>
                    <Input
                      style={{ width: "80%" }}
                      value={`${
                        bindValues[columnIndex]
                          ? bindValues[columnIndex][0]
                          : ""
                      }`}
                      onChange={(event) => {
                        const tempBindValues = { ...bindValues };
                        tempBindValues[columnIndex] = [
                          event.target.value.replace(/[^(\d|.|\-|:|\s)]/g, ""),
                        ];
                        if (
                          event.target.value.replace(
                            /[^(\d|.|\-|:|\s)]/g,
                            ""
                          ) === ""
                        ) {
                          delete tempBindValues[columnIndex];
                        }
                        onBindValuesChange(tempBindValues);
                      }}
                      onPressEnter={(event) => {
                        // tag 加上符号,若是 = 符号不显示
                        const tempFilters = { ...filters };
                        const tempSelectValues = { ...selectValues };
                        tempFilters[columnIndex] = [
                          (selectValues[columnIndex] === "=" ||
                          !selectValues[columnIndex]
                            ? ""
                            : selectValues[columnIndex]) +
                            (event.target as HTMLInputElement).value,
                        ];
                        if ((event.target as HTMLInputElement).value === "") {
                          delete tempFilters[columnIndex];
                        }
                        setSelectValues(tempSelectValues);
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
                      const tempSelectValues = { ...selectValues };
                      delete tempBindValues[columnIndex];
                      delete tempFilters[columnIndex];
                      tempSelectValues[columnIndex] = "=";
                      onBindValuesChange(tempBindValues);
                      onFiltersChange(tempFilters);
                      onRouteParamsChange({
                        ...routeParams,
                        filter: encodeURIComponent(JSON.stringify(tempFilters)),
                      });
                      setSelectValues(tempSelectValues);
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
                    value={bindValues[columnIndex]}
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
