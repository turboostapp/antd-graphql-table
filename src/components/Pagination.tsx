import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { omit } from "lodash";
import qs from "qs";
import React, { FC, useCallback, useMemo } from "react";
import { useLocalStorage } from "react-use";
import styled from "styled-components";

import useChangePageByKeyboard from "../hooks/useChangePageByKeyboard";
import { PageInfo, Variables } from "../types/BaseTypes";

const PaginationWrapper = styled.div<{ visible: boolean }>`
  display: ${(props) => (props.visible ? "flex" : "none")};
  justify-content: center;
  align-items: center;
  margin: 16px 0;
`;

const PrevButtonWrapper = styled.div`
  width: 32px;
  height: 32px;
  line-height: 32px;
  margin-right: 8px;
`;

const PrevButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  outline: none;
  cursor: pointer;

  &:hover {
    color: #1890ff;
    border-color: #1890ff;
  }

  &:disabled {
    color: rgba(0, 0, 0, 0.25);
    cursor: not-allowed;

    &:hover {
      border-color: #d9d9d9;
    }
  }
`;

const NextButtonWrapper = styled.div`
  width: 32px;
  height: 32px;
  line-height: 32px;
`;

const NextButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  outline: none;
  cursor: pointer;

  &:hover {
    color: #1890ff;
    border-color: #1890ff;
  }

  &:disabled {
    color: rgba(0, 0, 0, 0.25);
    cursor: not-allowed;

    &:hover {
      border-color: #d9d9d9;
    }
  }
`;

const StyledLeftOutlined = styled(LeftOutlined)`
  color: currentColor;
`;

const StyledRightOutlined = styled(RightOutlined)`
  color: currentColor;
`;

export interface PaginationProps {
  id: string;
  pageSize: string | number;
  pageInfo: PageInfo;
  variables: Variables;
  onVariablesChange: (variables: Variables) => void;
}

export const Pagination: FC<PaginationProps> = ({
  id,
  variables,
  pageSize,
  pageInfo,
  onVariablesChange,
}) => {
  const [, setLocalStorageValue] = useLocalStorage(
    `graphql-table-query-params:${id}`
  );

  const queryParams = useMemo(
    () =>
      qs.parse(window.location.search, {
        ignoreQueryPrefix: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [window.location.search]
  );

  const onLoadPrev = useCallback(() => {
    if (onVariablesChange && pageInfo.hasPreviousPage) {
      // 点击之后更新 localstorage 和 pushState
      const newQueryParams = omit({ ...queryParams }, ["after"]);

      const tempVariables = { ...variables };
      tempVariables.last = Number(pageSize);

      if (pageInfo.startCursor) {
        newQueryParams.before = pageInfo.startCursor;
        tempVariables.before = pageInfo.startCursor;
      }

      if (Object.keys(newQueryParams).length > 0) {
        window.history.pushState(
          {},
          "",
          `${window.location.pathname}?${qs.stringify(newQueryParams)}`
        );
      } else {
        window.history.pushState({}, "", window.location.pathname);
      }

      setLocalStorageValue(newQueryParams);

      onVariablesChange(tempVariables);
    }
  }, [
    onVariablesChange,
    pageInfo,
    pageSize,
    queryParams,
    setLocalStorageValue,
    variables,
  ]);

  const onLoadNext = useCallback(() => {
    if (onVariablesChange && pageInfo.hasNextPage) {
      // 点击之后更新 localstorage 和 pushState
      const newQueryParams = omit({ ...queryParams }, ["before"]);

      const tempVariables = { ...variables };
      tempVariables.first = Number(pageSize);

      if (pageInfo.endCursor) {
        tempVariables.after = pageInfo.endCursor;
        newQueryParams.after = pageInfo.endCursor;
      }

      if (Object.keys(newQueryParams).length > 0) {
        window.history.pushState(
          {},
          "",
          `${window.location.pathname}?${qs.stringify(newQueryParams)}`
        );
      } else {
        window.history.pushState({}, "", window.location.pathname);
      }

      setLocalStorageValue(newQueryParams);

      onVariablesChange(tempVariables);
    }
  }, [
    onVariablesChange,
    pageInfo,
    pageSize,
    queryParams,
    setLocalStorageValue,
    variables,
  ]);

  // 翻页快捷键
  useChangePageByKeyboard(onLoadPrev, onLoadNext);

  return (
    <PaginationWrapper
      visible={pageInfo?.hasPreviousPage || pageInfo?.hasNextPage}
    >
      <PrevButtonWrapper>
        <PrevButton disabled={!pageInfo?.hasPreviousPage} onClick={onLoadPrev}>
          <StyledLeftOutlined />
        </PrevButton>
      </PrevButtonWrapper>
      <NextButtonWrapper>
        <NextButton disabled={!pageInfo?.hasNextPage} onClick={onLoadNext}>
          <StyledRightOutlined />
        </NextButton>
      </NextButtonWrapper>
    </PaginationWrapper>
  );
};
