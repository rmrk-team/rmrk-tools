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
  literal,
  any,
  object,
  record,
  boolean,
} from "superstruct";
import { getRemarkData } from "./utils";
import { collectionRegexPattern } from "../classes/equippable";
import { PropertiesStruct } from "./validate-metadata";
import { IProperties, IRoyaltyAttribute } from "./types";

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
  src: optional(pattern(string(), new RegExp("^(https?|ipfs)://.*$"))),
  slot: optional(pattern(string(), new RegExp(/^base-\S+\.{1}(.+)$/))),
  metadata: optional(pattern(string(), new RegExp("^(https?|ipfs)://.*$"))),
  thumb: optional(pattern(string(), new RegExp("^(https?|ipfs)://.*$"))),
});

const IsBigInt = define("BigInt", (value: any) => {
  try {
    if (!is(value, string())) {
      return false;
    }

    const priceBigInt = BigInt(parseInt(value));
    return typeof priceBigInt === "bigint";
  } catch (error: any) {
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
  baseslot: union([
    pattern(string(), new RegExp(/^$/)),
    pattern(string(), new RegExp(/^base-\S+\.{1}(.+)$/)),
  ]), // Allow only 1 dot
});

const BUYStruct = type({
  id: string(),
});

const BURNStruct = type({
  id: string(),
});

const DESTROYStruct = type({
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
  issuer: optional(string()),
  type: optional(string()),
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

const THEMEADDStruct = type({
  baseId: string(),
  themeId: string(),
  theme: record(string(), union([string(), boolean()])),
});

const LOCKStruct = type({
  id: string(),
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
  } catch (error: any) {
    throw new Error(
      error?.message || "Something went wrong during remark validation"
    );
  }
};

export const validateRoyaltiesPropertyValue = (
  properties: IProperties | undefined
) => {
  if (properties as IProperties | undefined) {

    const royalties = Object.values(properties as IProperties).find(
      (property) => property && property.type === "royalty"
    );

    // Royalties cannot be more than 100 and less than 0
    if (
      (royalties as IRoyaltyAttribute)?.value?.royaltyPercentFloat &&
      ((royalties as IRoyaltyAttribute)?.value?.royaltyPercentFloat < 0 ||
        (royalties as IRoyaltyAttribute)?.value?.royaltyPercentFloat > 100)
    ) {
      throw new Error("Royalty percentage value have to be between 0 and 100");
    }
  }
  return true;
};

export const validateNFT = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, dataString] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.MINT);
    const obj = getRemarkData(dataString);

    validateRoyaltiesPropertyValue(obj?.properties);

    return assert(obj, NFTStruct);
  } catch (error: any) {
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
  } catch (error: any) {
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
  } catch (error: any) {
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
  } catch (error: any) {
    throw new Error(
      error?.message || "Something went wrong during RESADD remark validation"
    );
  }
};

export const validateSetPriority = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, id, priority] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.SETPRIORITY);
    if (!id) {
      throw new Error("No NFT id specified for SETPRIORITY");
    }
    return true;
    // const obj = getRemarkData(priority);
    // return assert(obj, ResourceStruct);
  } catch (error: any) {
    throw new Error(
      error?.message ||
        "Something went wrong during SETPRIORITY remark validation"
    );
  }
};

export const validateSetAttribute = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, id, key, property, freeze] = remark.split(
    "::"
  );

  try {
    validateRemarkBase(remark, OP_TYPES.SETPROPERTY);
    if (!id) {
      throw new Error("No NFT id specified for SETPROPERTY");
    }
    const obj = getRemarkData(property);

    validateRoyaltiesPropertyValue({ [key]: obj });
    return assert(obj, any());
  } catch (error: any) {
    throw new Error(
      error?.message ||
        "Something went wrong during SETPROPERTY remark validation"
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
  } catch (error: any) {
    throw new Error(
      error?.message || "Something went wrong during remark validation"
    );
  }
};

export const validateEmote = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, namespace, id, unicode] = remark.split(
    "::"
  );

  try {
    validateRemarkBase(remark, OP_TYPES.EMOTE);
    return assert({ id, unicode, namespace }, EMOTEStruct);
  } catch (error: any) {
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
  } catch (error: any) {
    throw new Error(
      error?.message ||
        "Something went wrong during EQUIPPABLE remark validation"
    );
  }
};

export const validateThemeadd = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, baseId, themeId, theme] = remark.split(
    "::"
  );

  try {
    const obj = getRemarkData(theme);
    validateRemarkBase(remark, OP_TYPES.THEMEADD);
    return assert({ baseId, themeId, theme: obj }, THEMEADDStruct);
  } catch (error: any) {
    throw new Error(
      error?.message || "Something went wrong during THEMEADD remark validation"
    );
  }
};

export const validateChangeIssuer = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, id, issuer] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.CHANGEISSUER);
    return assert({ id, issuer }, CHANGEISSUERStruct);
  } catch (error: any) {
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
  } catch (error: any) {
    throw new Error(
      error?.message || "Something went wrong during remark validation"
    );
  }
};

export const validateBurn = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, id] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.BURN);
    return assert({ id }, BURNStruct);
  } catch (error: any) {
    console.log("StructError is:", error);
    throw new Error(
      error?.message || "Something went wrong during remark validation"
    );
  }
};

export const validateDestroy = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, id] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.DESTROY);
    return assert({ id }, DESTROYStruct);
  } catch (error: any) {
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
  } catch (error: any) {
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
  } catch (error: any) {
    console.log("StructError is:", error);
    throw new Error(
      error?.message || "Something went wrong during EQUIP remark validation"
    );
  }
};

export const validateLock = (remark: string): any => {
  // With array destructuring it's important to not remove unused destructured variables, as order is important
  const [_prefix, _op_type, _version, id] = remark.split("::");

  try {
    validateRemarkBase(remark, OP_TYPES.LOCK);
    return assert({ id }, LOCKStruct);
  } catch (error: any) {
    console.log("StructError is:", error);
    throw new Error(
      error?.message || "Something went wrong during remark validation"
    );
  }
};
