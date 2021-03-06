import { OP_TYPES, PREFIX, VERSION } from "./constants";
import { assert, object, define, string, pattern, number } from "superstruct";
import { getRemarkData } from "./utils";

const CollectionData = object({
  name: string(),
  max: number(),
  issuer: string(),
  symbol: string(),
  id: string(),
  metadata: pattern(string(), new RegExp("^(https?|ipfs)://.*$")),
});

export const validateBase = (remark: string, opType: OP_TYPES) => {
  const [prefix, op_type, version] = remark.split("::");
  if (prefix !== PREFIX) {
    throw new Error("Invalid remark - does not start with RMRK");
  }
  if (version !== VERSION) {
    throw new Error(
      `This remark was issued under version ${version} instead of ${VERSION}`
    );
  }
  if (op_type !== opType) {
    throw new Error(`The op code needs to be ${opType}, but it is ${op_type}`);
  }
};

export const validateCollection = (remark: string): any => {
  const [prefix, op_type, version, dataString] = remark.split("::");
  validateBase(remark, OP_TYPES.MINT);
  const obj = getRemarkData(dataString);

  try {
    return assert(obj, CollectionData);
  } catch (error) {
    console.log("StructError is:", error);
    return new Error(
      error?.message || "Something went wrrong during remark validation"
    );
  }
};
