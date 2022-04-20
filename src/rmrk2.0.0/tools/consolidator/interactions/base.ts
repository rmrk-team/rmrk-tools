import { Remark } from "../remark";
import { OP_TYPES } from "../../constants";
import {Base} from "../../../classes/base";
import { encodeAddress } from "@polkadot/keyring";

export const getBaseFromRemark = (remark: Remark, ss58Format?: number) => {
  const issuer = encodeAddress(remark.caller, ss58Format);
  const base = Base.fromRemark(remark.remark, issuer, remark.block);
  if (typeof base === "string") {
    throw new Error(`[${OP_TYPES.BASE}] Dead before instantiation: ${base}`);
  }
  return base;
};
