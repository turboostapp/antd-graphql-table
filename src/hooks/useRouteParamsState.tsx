import { pick } from "lodash";
import qs from "qs";
import { Dispatch, SetStateAction, useCallback, useState } from "react";

import { useQuery } from "./useReactRouterQuery";

export default function useRouteParamsState(
  options: string[]
): [
  { [key: string]: string },
  Dispatch<
    SetStateAction<{
      [key: string]: string;
    }>
  >
] {
  const query = useQuery();
  const [state, setState] = useState<{
    [key: string]: string;
  }>(
    pick(query, options) as {
      [key: string]: string;
    }
  );

  return [
    state,
    useCallback(
      (newState) => {
        if (Object.keys(newState).length > 0) {
          const tempNewState = { ...query, ...pick(newState, options) };
          Object.keys(newState).forEach((key) => {
            if (!newState[key] || decodeURIComponent(newState[key]) === "{}") {
              delete tempNewState[key];
            }
          });
          history.pushState(
            {},
            "",
            `${window.location.pathname}?${qs.stringify(tempNewState)}`
          );
        } else {
          history.pushState({}, "", window.location.pathname);
        }
        return setState(newState);
      },
      [history, options, query]
    ),
  ];
}
