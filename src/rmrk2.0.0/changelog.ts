import { OP_TYPES } from "./tools/constants";

export type ChangeExtraBalanceTransfer = {
  receiver: string;
  amount: string;
};

export type Change = {
  field: string;
  old: any;
  new: any;
  caller: string;
  block: number;
  opType: OP_TYPES;
  extraTransfers?: ChangeExtraBalanceTransfer[];
};
