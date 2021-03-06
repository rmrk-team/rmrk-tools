import { OP_TYPES, PREFIX, VERSION } from "./constants";
import {
  assert,
  object,
  define,
  string,
  pattern,
  number,
  any,
  optional,
  type,
} from "superstruct";
import { getRemarkData } from "./utils";

const DataStruct = object({
  protocol: string(),
  data: any(),
  type: string(),
});

const CollectionStruct = type({
  name: string(),
  max: number(),
  issuer: string(),
  symbol: string(),
  id: string(),
  metadata: optional(pattern(string(), new RegExp("^(https?|ipfs)://.*$"))),
  data: optional(DataStruct),
});

const NFTStruct = type({
  name: string(),
  collection: string(),
  instance: string(),
  transferable: number(),
  sn: string(),
  data: optional(DataStruct),
  metadata: optional(pattern(string(), new RegExp("^(https?|ipfs)://.*$"))),
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
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, dataString] = remark.split("::");

  try {
    validateBase(remark, OP_TYPES.MINT);
    const obj = getRemarkData(dataString);
    return assert(obj, CollectionStruct);
  } catch (error) {
    console.log("StructError is:", error);
    return new Error(
      error?.message || "Something went wrrong during remark validation"
    );
  }
};

export const validateNFT = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, dataString] = remark.split("::");

  try {
    validateBase(remark, OP_TYPES.MINTNFT);
    const obj = getRemarkData(dataString);
    return assert(obj, NFTStruct);
  } catch (error) {
    console.log("StructError is:", error);
    return new Error(
      error?.message || "Something went wrrong during remark validation"
    );
  }
};
