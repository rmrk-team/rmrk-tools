import { Remark } from "../remark";
import { OP_TYPES } from "../../constants";
import { Base } from "../../../classes/base";

export const getBaseFromRemark = (remark: Remark, ss58Format?: number) => {
  const base = Base.fromRemark(remark.remark, remark.block, ss58Format);
  if (typeof base === "string") {
    throw new Error(`[${OP_TYPES.BASE}] Dead before instantiation: ${base}`);
  }
  const partIds: string[] = [];
  for (let i = 0; i < (base.parts?.length || 0); i++) {
    if (base.parts?.[i]?.id && partIds.includes(base.parts?.[i]?.id)) {
      throw new Error(
        `[${OP_TYPES.BASE}] Duplicate base part id found: ${base.parts?.[i]?.id}`
      );
    } else if (base.parts?.[i]?.id) {
      partIds.push(base.parts?.[i]?.id);
    }
  }
  return base;
};
