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
};

export enum OP_TYPES {
  BUY = "BUY",
  LIST = "LIST",
  MINT = "MINT",
  MINTNFT = "MINTNFT",
  SEND = "SEND",
  EMOTE = "EMOTE",
  CHANGEISSUER = "CHANGEISSUER",
}
