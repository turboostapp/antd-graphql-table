import qs from "qs";
import { useCallback } from "react";
import { useHistory } from "react-router-dom";

export const useGoBackPage = (pathname: string, id: string): (() => void) => {
  const history = useHistory();

  return useCallback(
    () =>
      history.push(
        `${pathname}?${qs.stringify(
          JSON.parse(
            localStorage.getItem(`graphql-table-query-params:${id}`) || "{}"
          )
        )}`
      ),
    [history, id, pathname]
  );
};
