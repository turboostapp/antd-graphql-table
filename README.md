<h1>🚀 antd-graphql-table</h1>

- [✨ 特色功能](#-特色功能)
- [📦 安装](#-安装)
- [API](#api)
- [🔨 使用说明](#-使用说明)
  - [筛选器配置](#筛选器配置)
  - [翻页配置](#翻页配置)
  - [graphql 请求参数设置](#graphql-请求参数设置)
    - [最简单用法](#最简单用法)
    - [自定义每次请求的 variables](#自定义每次请求的-variables)
    - [自定义每页条数](#自定义每页条数)

<center>
  <a class="other-link" href="https://github.com/shadowolfapp/antd-simple-table" alt="https://github.com/shadowolfapp/antd-simple-table"><i class="fab fa-github-square fa-2x" ></i></a>
</center>

<br/>

## ✨ 特色功能

- 通过配置生成自定义的筛选器与排序器，并将参数存进 url，刷新页面会保留筛选和排序条件
- 基于 graphql 的分页，默认会帮你设置好请求需要的 first、last、 before、 after，刷新页面会停留在当前页
- 将当前筛选排序分页参数存进 localstorage，可以利用其来跳转到当前参数页

<br/>

## 📦 安装

```
npm i antd-graphql-table
```

<br/>

## API

| 参数              | 说明                                                                             | 类型                                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| columns           | 列配置                                                                           | Array<GraphQLTableColumnType\<T>>                                                                                                   |
| id                | 筛选排序分页参数存进 localstorage 的 key 值为 `graphql-table-query-params:${id}` | string                                                                                                                              |
| PageInfo          | 分页需提供的参数                                                                 | { \_\_typename?: "PageInfo";startCursor?: string \| null; endCursor?: string \| null;hasPreviousPage: boolean;hasNextPage: boolean} |
| onVariablesChange | 页面第一次加载、筛选排序分页改变时触发回调事件                                   | function(variables, pageType: "prev" \|"next")                                                                                      |

<br/>

## 🔨 使用说明

### 筛选器配置

&emsp; 需要排序的列，设置 sorter 为 true。

&emsp; 需要筛选的列，设置 filterType， 如果筛选类型是单选或者多选，需要设置 filters，每项需设置 text 和 value。

```javascript
<GraphQLTable
  columns={[
    {
      title: "日期",
      key: "day",
      dataIndex: "day",
      sorter: true,
      filterType: FilterType.DATE_RANGE_PICKER,
    },
    {
      title: "颜色",
      key: "color",
      dataIndex: "color",
      filterType: FilterType.CHECKBOX,
      filters: [
        { text: "红", value: "red" },
        { text: "蓝", value: "blue" },
      ],
    },
  ]}
/>
```

FilterType 目前支持的值类型如下：

| 类型                              | 描述       |
| --------------------------------- | ---------- |
| FilterType.INPUT                  | 输入框     |
| FilterType.INPUT_NUMBER           | 数字输入框 |
| FilterType.RADIO                  | 单选       |
| FilterType.CHECKBOX               | 多选       |
| FilterType.DATE_RANGE_PICKER      | 日期（天） |
| FilterType.DATE_TIME_RANGE_PICKER | 日期（秒） |

<br/>

### 翻页配置

&emsp;需配置 **PageInfo** 和 **id**

```javascript
// 需使用没有缓存的策略 no-cache，可以避免很多缓存问题
const [getDiscounts, { data, loading, refetch }] = useDiscountsLazyQuery({
  fetchPolicy: "no-cache",
});

<GraphQLTable id="user" PageInfo={data?.discounts.pageInfo} />;
```

&emsp; **id** 配置了之后，会把筛选排序分页的参数存到 localstorage 里，在需要的地方可以利用它来跳转到原来的地方。

```javascript
// 例如返回上一页
history.push(
  `/xxx?${qs.stringify(
    JSON.parse(localStorage.getItem("graphql-table-query-params:user") || "{}")
  )}`
);
```

<br/>

### graphql 请求参数设置

<br />

&emsp; 组件暴露出一个 **onVariablesChange** 方法，提供两个参数 **variables**、**pageInfo**，包含筛选排序和翻页（query、orderBy、after、before、first、last）

&emsp; <font color="red"> onVariablesChange 会在页面第一次加载时触发一次，不要在 useEffect 中请求第一次的数据。</font>

<br />

#### 最简单用法

```javascript
// 需使用没有缓存的策略 no-cache，可以避免很多缓存问题
const [getDiscounts, { data, loading, refetch }] = useDiscountsLazyQuery({
  fetchPolicy: "no-cache",
});

// variables 默认为 first: 10, 当 url 参数包含 before，会变为 last: 10
<GraphQLTable onVariablesChange={(variables) => getDiscounts({ variables })} />;
```

<br />

#### 自定义每次请求的 variables

```javascript
<GraphQLTable
  id="user"
  onVariablesChange={(variables) =>
    getDiscounts({
      variables: {
        ...variables,
        query: `${variables.query || ""} name:"123"`.trim(),
      },
    })
  }
/>
```

<br />

#### 自定义每页条数

```javascript
<GraphQLTable
  id="user"
  onVariablesChange={(variables, pageInfo) => {
    // 点击上一页触发
    if(pageInfo === "prev) {
      getDiscounts({ variables: { ...variables, last: 20 } })
    }
    // 点击下一页触发
    else if(pageInfo === "next) {
      getDiscounts({ variables: { ...variables, first: 20 } })
    }
    // 页面第一次加载或改变筛选排序时触发，需判断 url 有无 before
    else {
      const queryParams = qs.parse(window.location.search, {
       ignoreQueryPrefix: true,
      });

      getDiscounts({
        variables: {
        ...variables,
        first: queryParams.before ? null : 20,
        last: queryParams.before ? 20 : null,
        },
      });
    }
   }
  }
/>
```
