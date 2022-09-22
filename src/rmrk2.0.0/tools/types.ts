import { Send } from "../classes/send";
import { Buy } from "../classes/buy";
import { List } from "../classes/list";
import { Emote } from "../classes/emote";
import { ChangeIssuer } from "../classes/changeissuer";
import { OP_TYPES } from "./constants";

export type IProperties = Record<string, IAttribute | IRoyaltyAttribute>;

export interface IAttribute {
  _mutation?: {
    allowed: boolean;
    with?: {
      opType: OP_TYPES;
      condition?: string;
    };
  };
  type:
    | "array"
    | "object"
    | "int"
    | "float"
    | "number"
    | "string"
    | "boolean"
    | "datetime"
    | "royalty";
  value: any;
}

export interface IRoyaltyAttribute extends IAttribute {
  type: "royalty";
  value: {
    receiver: string;
    royaltyPercentFloat: number;
  };
}

export interface Metadata {
  mediaUri?: string;
  thumbnailUri?: string;
  externalUri?: string;
  description?: string;
  name?: string;
  license?: string;
  licenseUri?: string;
  type?: string;
  locale?: string;
  properties?: IProperties;
  /** @deprecated deprecated in favour of `externalUri` field */
  external_url?: string;
  /** @deprecated deprecated in favour of `mediaUri` or `thumbnailUri` field */
  image?: string;
  /** @deprecated */
  image_data?: string;
  /** @deprecated deprecated in favour of `mediaUri` field */
  animation_url?: string;
  /* Allow any other arbitrary key value pairs */
  [key: string]: any;
}

export type Options = {
  ws: string;
  from: string;
  to: string;
  prefixes: string;
  blocks: string;
  json: string;
  folder: string;
  append: string;
  remark: string;
};

export type BlockCalls = {
  block: number;
  calls: BlockCall[];
};

export type BlockCall = {
  call: string;
  value: string;
  caller: string;
  extras?: BlockCall[];
};

export type BaseType = "svg" | "png" | string;

export type Interaction = Send | Buy | List | Emote | ChangeIssuer;
