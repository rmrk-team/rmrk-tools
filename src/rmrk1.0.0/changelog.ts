import { OP_TYPES } from "../tools/constants";

export type Change = {
  field: string;
  old: any;
  new: any;
  caller: string;
  block: number;
  valid: boolean;
  extrinsicHash: string;
  opType: OP_TYPES;
};
