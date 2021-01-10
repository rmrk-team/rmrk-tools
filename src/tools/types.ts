export type Options = {
  ws: string;
  from: string;
  to: string;
  prefix: string;
  blocks: string;
  json: string;
  folder: string;
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
