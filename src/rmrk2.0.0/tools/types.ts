import { Send } from "../classes/send";
import { Buy } from "../classes/buy";
import { List } from "../classes/list";
import { Emote } from "../classes/emote";
import { ChangeIssuer } from "../classes/changeissuer";
import { OP_TYPES } from "./constants";

export type IProperties = Record<string, IAttribute>;

export interface IAttribute {
  _mutation?: {
    allowed: boolean;
    with?: {
      opType: OP_TYPES;
      condition?: string;
    };
  };
  type: "array" | "object" | "int" | "float" | "string";
  value: any;
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

export type BaseType = "svg";

export type Interaction = Send | Buy | List | Emote | ChangeIssuer;
