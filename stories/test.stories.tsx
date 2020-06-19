import { withInfo } from "@storybook/addon-info";
import { storiesOf } from "@storybook/react";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";

import { GraphQLTable } from "../src";
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
      variables={{}}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onVariablesChange={() => {}}
      columns={[
        {
          title: "日期",
          key: "day",
          dataIndex: "day",
          width: 120,
          sorter: true,
        },
        {
          title: "email",
          key: "email",
          dataIndex: "email",
          width: 120,
          sorter: true,
        },
      ]}
      dataSource={[
        { day: 1215, email: ["da", "das"] },
        { day: 1215, email: "das" },
      ]}
    />
  </Router>
));
