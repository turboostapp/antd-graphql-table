export enum OrderDirection {
  ASC = "ASC",
  DESC = "DESC",
}

export type Maybe<T> = T | null;

export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: any;
  JSONObject: any;
};

export type Ordering = {
  direction?: Maybe<OrderDirection>;
  field: Scalars["String"];
};
