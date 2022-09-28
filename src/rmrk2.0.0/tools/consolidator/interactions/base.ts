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
  const part_ids = [];
  for (let i = 0; i < base.parts.length; i++) {
    if (part_ids.includes(base.parts[i].id)) {
      throw new Error(`[${OP_TYPES.BASE}] Duplicate base part id found: ${base.parts[i].id}`);
    } else {
      part_ids.push(base.parts[i].id);
    }
  }
  return base;
};
