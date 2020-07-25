import { withInfo } from "@storybook/addon-info";
import { storiesOf } from "@storybook/react";
import { ValueType } from "antd-simple-table";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";

import { FilterType, GraphQLTable } from "../src";
const stories = storiesOf("Table1", module);

stories.addDecorator(withInfo);
stories.addParameters({
  info: { inline: true },
  options: {
    panelPosition: "right",
  },
});

stories.add("base", () => (
  <Router>
    <GraphQLTable
      id="as"
      hasMore={false}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onVariablesChange={() => {}}
      columns={[
        {
          title: "账号",
          key: "account",
          dataIndex: "account",
          width: 120,
          sorter: true,
          filterType: FilterType.INPUT,
        },
        {
          title: "开关",
          key: "switch",
          dataIndex: "switch",
          width: 120,
          sorter: true,
          filterType: FilterType.RADIO,
          filters: [
            { text: "开", value: true },
            { text: "关", value: false },
          ],
        },
        {
          title: "颜色",
          key: "color",
          dataIndex: "color",
          width: 120,
          sorter: true,
          filterType: FilterType.CHECKBOX,
          filters: [
            { text: "黑", value: "black" },
            { text: "白", value: "white" },
            { text: "红", value: "red" },
          ],
        },
        {
          title: "日期",
          key: "date",
          dataIndex: "date",
          width: 120,
          sorter: true,
          valueType: ValueType.DATE_TIME,
          filterType: FilterType.DATE_RANGE_PICKER,
        },
        {
          title: "日期时间",
          key: "dateTime",
          dataIndex: "dateTime",
          width: 120,
          sorter: true,
          valueType: ValueType.DATE_TIME,
          filterType: FilterType.DATE_TIME_RANGE_PICKER,
        },
      ]}
      dataSource={[
        {
          account: 123456,
          switch: "开启",
          color: "黑色",
          date: 1593712260997,
          dateTime: 1593722930997,
        },
        {
          account: 111111,
          switch: "关闭",
          color: "白色",
          date: 1593761110997,
          dateTime: 1593761130997,
        },
      ]}
    />
  </Router>
));
