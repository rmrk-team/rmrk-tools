export type DisplayType =
  | "boost_number"
  | "boost_percentage"
  | "number"
  | "date";

export interface Attribute {
  display_type?: DisplayType;
  trait_type?: string;
  value: number | string;
  max_value?: number;
  mutable?: boolean;
}
