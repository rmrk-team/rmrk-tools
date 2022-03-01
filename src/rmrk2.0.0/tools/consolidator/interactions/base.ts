import { Remark } from "../remark";
import { OP_TYPES } from "../../constants";
import {Base} from "../../../classes/base";

export const getBaseFromRemark = (remark: Remark, ss58Format?: number) => {
  const base = Base.fromRemark(remark.remark, remark.block, ss58Format);
  if (typeof base === "string") {
    throw new Error(`[${OP_TYPES.BASE}] Dead before instantiation: ${base}`);
  }
  return base;
};
