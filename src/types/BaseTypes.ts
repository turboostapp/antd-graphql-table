export enum OrderDirection {
  ASC = "ASC",
  DESC = "DESC",
}

export type Ordering = {
  direction: OrderDirection;
  field: string;
};

export type PageInfo = {
  __typename?: "PageInfo";
  endCursor?: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string | null;
};
