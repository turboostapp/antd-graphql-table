import { omit, pick } from "lodash";
import qs from "qs";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useLocalStorage } from "react-use";

export default function useRouteParamsState(
  options: string[],
  id: string
): [
  { [key: string]: string },
  Dispatch<
    SetStateAction<{
      [key: string]: string;
    }>
  >
] {
  const queryParams = useMemo(
    () => qs.parse(window.location.search, { ignoreQueryPrefix: true }),
    []
  );

  const [state, setState] = useState<{
    [key: string]: string;
  }>(
    pick(queryParams, options) as {
      [key: string]: string;
    }
  );

  const [, setLocalStorageValue] = useLocalStorage(
    `graphql-table-query-params:${id}`
  );

  return [
    state,
    useCallback(
      (newState) => {
        const tempNewState = {
          // 改变筛选或排序时删除 before after，从第一页开始
          ...omit(queryParams, ["before", "after"]),
          ...newState,
        };

        // filter 为空时删除
        Object.keys(newState).forEach((key) => {
          if (!newState[key] || decodeURIComponent(newState[key]) === "{}") {
            delete tempNewState[key];
          }
        });

        setLocalStorageValue(tempNewState);

        if (Object.keys(tempNewState).length > 0) {
          window.history.pushState(
            {},
            "",
            `${window.location.pathname}?${qs.stringify(tempNewState)}`
          );
        } else {
          window.history.pushState({}, "", window.location.pathname);
        }

        return setState(newState);
      },
      [queryParams, setLocalStorageValue]
    ),
  ];
}
