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
  is,
  enums,
  union,
  array,
} from "superstruct";
import { getRemarkData } from "./utils";

const PartStruct = type({
  type: enums(["slot", "fixed"]),
  unequip: optional(enums(["unequip", "burn"])),
  z: optional(number()),
  src: optional(pattern(string(), new RegExp("^(https?|ipfs)://.*$"))),
  id: string(),
  equippable: union([string(), array(string())]),
});

const NftclassStruct = type({
  max: number(),
  issuer: string(),
  symbol: string(),
  id: string(),
  metadata: optional(pattern(string(), new RegExp("^(https?|ipfs)://.*$"))),
});

const NFTStruct = type({
  nftclass: string(),
  symbol: string(),
  transferable: number(),
  sn: string(),
  metadata: optional(pattern(string(), new RegExp("^(https?|ipfs)://.*$"))),
});

const IsBigInt = define("BigInt", (value: any) => {
  try {
    if (!is(value, string())) {
      return false;
    }

    const priceBigInt = BigInt(parseInt(value));
    return typeof priceBigInt === "bigint";
  } catch (error) {
    return false;
  }
});

const LISTStruct = type({
  id: string(),
  price: IsBigInt,
});

const BUYStruct = type({
  id: string(),
});

const CONSUMEStruct = type({
  id: string(),
});

const SENDStruct = type({
  id: string(),
  recipient: string(),
});

const EMOTEStruct = type({
  id: string(),
  unicode: string(),
  namespace: enums(["rmrk1", "rmrk2", "pubkey"]),
});

const BaseStruct = type({
  issuer: string(),
  type: enums(["svg"]),
  id: string(),
  parts: array(PartStruct),
});

const CHANGEISSUERStruct = type({
  id: string(),
  issuer: string(),
});

export const validateRemarkBase = (remark: string, opType: OP_TYPES) => {
  const [prefix, op_type, version] = remark.split("::");
  if (prefix.toUpperCase() !== PREFIX) {
    throw new Error("Invalid remark - does not start with RMRK");
  }
  if (op_type !== opType) {
    throw new Error(`The op code needs to be ${opType}, but it is ${op_type}`);
  }
  if (version !== VERSION) {
    throw new Error(
      `This remark was issued under version ${version} instead of ${VERSION}`
    );
  }
};

export const validateNftclass = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, dataString] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.CREATE);
    const obj = getRemarkData(dataString);
    if (!obj.metadata) {
      throw new Error("NFT Class is missing metadata");
    }
    return assert(obj, NftclassStruct);
  } catch (error) {
    throw new Error(
      error?.message || "Something went wrong during remark validation"
    );
  }
};

export const validateNFT = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, dataString] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.MINT);
    const obj = getRemarkData(dataString);
    if (!obj.metadata) {
      throw new Error("NFT is missing metadata");
    }
    return assert(obj, NFTStruct);
  } catch (error) {
    throw new Error(
      error?.message || "Something went wrong during remark validation"
    );
  }
};

export const validateBase = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, dataString] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.BASE);
    const obj = getRemarkData(dataString);
    return assert(obj, BaseStruct);
  } catch (error) {
    throw new Error(
      error?.message || "Something went wrong during Base remark validation"
    );
  }
};

export const validateList = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, id, price] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.LIST);
    return assert({ id, price }, LISTStruct);
  } catch (error) {
    throw new Error(
      error?.message || "Something went wrong during remark validation"
    );
  }
};

export const validateSend = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, id, recipient] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.SEND);
    if (/\s/g.test(recipient)) {
      throw new Error(
        "Invalid remark - No whitespaces are allowed in recipient"
      );
    }
    return assert({ id, recipient }, SENDStruct);
  } catch (error) {
    throw new Error(
      error?.message || "Something went wrong during remark validation"
    );
  }
};

export const validateEmote = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, id, unicode] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.EMOTE);
    return assert({ id, unicode }, EMOTEStruct);
  } catch (error) {
    throw new Error(
      error?.message || "Something went wrong during remark validation"
    );
  }
};

export const validateChangeIssuer = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, id, issuer] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.CHANGEISSUER);
    return assert({ id, issuer }, CHANGEISSUERStruct);
  } catch (error) {
    throw new Error(
      error?.message || "Something went wrong during remark validation"
    );
  }
};

export const validateBuy = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, id] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.BUY);
    return assert({ id }, BUYStruct);
  } catch (error) {
    throw new Error(
      error?.message || "Something went wrong during remark validation"
    );
  }
};

export const validateConsume = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, id] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.CONSUME);
    return assert({ id }, CONSUMEStruct);
  } catch (error) {
    console.log("StructError is:", error);
    throw new Error(
      error?.message || "Something went wrong during remark validation"
    );
  }
};
