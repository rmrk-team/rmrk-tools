import { Send } from "../classes/send";
import { Buy } from "../classes/buy";
import { List } from "../classes/list";
import { NFT } from "../classes/nft";
import { Emote } from "../classes/emote";
import { ChangeIssuer } from "../classes/changeissuer";

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

export enum OP_TYPES {
  BUY = "BUY",
  LIST = "LIST",
  MINT = "MINT",
  MINTNFT = "MINTNFT",
  SEND = "SEND",
  EMOTE = "EMOTE",
  CONSUME = "CONSUME",
  CHANGEISSUER = "CHANGEISSUER",
}

export type Interaction = Send | Buy | List | Emote | ChangeIssuer;
