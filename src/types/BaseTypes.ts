export enum Direction {
  ASC = "ASC",
  DESC = "DESC",
}

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
  field?: string;
  direction?: Direction;
};
