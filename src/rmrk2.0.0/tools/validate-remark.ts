import { OP_TYPES, PREFIX, VERSION } from "./constants";
import {
  assert,
  define,
  string,
  pattern,
  number,
  optional,
  type,
  is,
  enums,
  union,
  array,
} from "superstruct";
import { getRemarkData } from "./utils";
import { collectionRegexPattern } from "../classes/equippable";

const PartStruct = type({
  type: enums(["slot", "fixed"]),
  unequip: optional(enums(["unequip", "burn"])),
  z: optional(number()),
  src: optional(pattern(string(), new RegExp("^(https?|ipfs)://.*$"))),
  id: string(),
  equippable: optional(union([string(), array(string())])),
});

const CollectionStruct = type({
  max: number(),
  issuer: string(),
  symbol: string(),
  id: string(),
  metadata: optional(pattern(string(), new RegExp("^(https?|ipfs)://.*$"))),
});

const NFTStruct = type({
  collection: string(),
  symbol: string(),
  transferable: number(),
  sn: string(),
  metadata: optional(pattern(string(), new RegExp("^(https?|ipfs)://.*$"))),
});

const ResourceStruct = type({
  base: optional(pattern(string(), new RegExp("^base-"))),
  src: optional(string()),
  slot: optional(pattern(string(), new RegExp(/^base-\S+\.{1}\S+$/))),
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

const ACCEPTStruct = type({
  id: string(),
  nftId: string(),
  entity: enums(["NFT", "RES"]),
});

const EQUIPStruct = type({
  id: string(),
  baseslot: union([pattern(string(), new RegExp(/^$/)), pattern(string(), new RegExp(/^base-\S+\.{1}\S+$/))]), // Allow only 1 dot
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
  namespace: enums(["RMRK1", "RMRK2", "PUBKEY"]),
});

const BaseStruct = type({
  issuer: string(),
  type: enums(["svg"]),
  symbol: string(),
  parts: array(PartStruct),
});

const CHANGEISSUERStruct = type({
  id: string(),
  issuer: string(),
});

const EQUIPPABLEStruct = type({
  id: string(),
  slot: string(),
  classes: pattern(string(), new RegExp(collectionRegexPattern)),
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

export const validateCollection = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, dataString] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.CREATE);
    const obj = getRemarkData(dataString);
    if (!obj.metadata) {
      throw new Error("NFT Collection is missing metadata");
    }
    return assert(obj, CollectionStruct);
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

export const validateResadd = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, id, resource] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.RESADD);
    if (!id) {
      throw new Error("No NFT id specified for RESADD");
    }
    const obj = getRemarkData(resource);
    return assert(obj, ResourceStruct);
  } catch (error) {
    throw new Error(
      error?.message || "Something went wrong during RESADD remark validation"
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

export const validateEquippable = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, id, slot, classes] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.EQUIPPABLE);
    return assert({ id, slot, classes }, EQUIPPABLEStruct);
  } catch (error) {
    throw new Error(
      error?.message ||
        "Something went wrong during EQUIPPABLE remark validation"
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

export const validateAccept = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, nftId, entity, id] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.ACCEPT);
    return assert({ id, nftId, entity }, ACCEPTStruct);
  } catch (error) {
    console.log("StructError is:", error);
    throw new Error(
      error?.message || "Something went wrong during ASCCEPT remark validation"
    );
  }
};

export const validateEquip = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, id, baseslot = ""] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.EQUIP);
    return assert({ id, baseslot }, EQUIPStruct);
  } catch (error) {
    console.log("StructError is:", error);
    throw new Error(
      error?.message || "Something went wrong during EQUIP remark validation"
    );
  }
};
