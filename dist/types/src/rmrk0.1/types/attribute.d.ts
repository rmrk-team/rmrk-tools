export interface Attribute {
    display_type: DisplayType;
    trait_type: string;
    value: number | string;
}
export declare enum DisplayType {
    null = 0,
    "boost_number" = 1,
    "number" = 2,
    "boost_percentage" = 3
}
