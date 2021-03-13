import { OP_TYPES, PREFIX, VERSION } from "./constants";
import { assert, object, define, string, pattern, number, any, optional, type, is, } from "superstruct";
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
const IsBigInt = define("BigInt", (value) => {
    try {
        if (!is(value, string())) {
            return false;
        }
        const priceBigInt = BigInt(parseInt(value));
        return typeof priceBigInt === "bigint";
    }
    catch (error) {
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
const SENDStruct = type({
    id: string(),
    recipient: string(),
});
const EMOTEStruct = type({
    id: string(),
    unicode: string(),
});
const CHANGEISSUERStruct = type({
    id: string(),
    issuer: string(),
});
export const validateBase = (remark, opType) => {
    const [prefix, op_type, version] = remark.split("::");
    if (prefix.toUpperCase() !== PREFIX) {
        throw new Error("Invalid remark - does not start with RMRK");
    }
    if (op_type !== opType) {
        throw new Error(`The op code needs to be ${opType}, but it is ${op_type}`);
    }
    if (version !== VERSION) {
        throw new Error(`This remark was issued under version ${version} instead of ${VERSION}`);
    }
};
export const validateCollection = (remark) => {
    // With array destructuring it's important to not remove unused destructured variables, as order is important
    const [_prefix, _op_type, _version, dataString] = remark.split("::");
    try {
        validateBase(remark, OP_TYPES.MINT);
        const obj = getRemarkData(dataString);
        return assert(obj, CollectionStruct);
    }
    catch (error) {
        console.log("StructError is:", error);
        throw new Error((error === null || error === void 0 ? void 0 : error.message) || "Something went wrong during remark validation");
    }
};
export const validateNFT = (remark) => {
    // With array destructuring it's important to not remove unused destructured variables, as order is important
    const [_prefix, _op_type, _version, dataString] = remark.split("::");
    try {
        validateBase(remark, OP_TYPES.MINTNFT);
        const obj = getRemarkData(dataString);
        return assert(obj, NFTStruct);
    }
    catch (error) {
        console.log("StructError is:", error);
        throw new Error((error === null || error === void 0 ? void 0 : error.message) || "Something went wrong during remark validation");
    }
};
export const validateList = (remark) => {
    // With array destructuring it's important to not remove unused destructured variables, as order is important
    const [_prefix, _op_type, _version, id, price] = remark.split("::");
    try {
        validateBase(remark, OP_TYPES.LIST);
        return assert({ id, price }, LISTStruct);
    }
    catch (error) {
        console.log("StructError is:", error);
        throw new Error((error === null || error === void 0 ? void 0 : error.message) || "Something went wrong during remark validation");
    }
};
export const validateSend = (remark) => {
    // With array destructuring it's important to not remove unused destructured variables, as order is important
    const [_prefix, _op_type, _version, id, recipient] = remark.split("::");
    try {
        validateBase(remark, OP_TYPES.SEND);
        return assert({ id, recipient }, SENDStruct);
    }
    catch (error) {
        console.log("StructError is:", error);
        throw new Error((error === null || error === void 0 ? void 0 : error.message) || "Something went wrong during remark validation");
    }
};
export const validateEmote = (remark) => {
    // With array destructuring it's important to not remove unused destructured variables, as order is important
    const [_prefix, _op_type, _version, id, unicode] = remark.split("::");
    try {
        validateBase(remark, OP_TYPES.EMOTE);
        return assert({ id, unicode }, EMOTEStruct);
    }
    catch (error) {
        console.log("StructError is:", error);
        throw new Error((error === null || error === void 0 ? void 0 : error.message) || "Something went wrong during remark validation");
    }
};
export const validateChangeIssuer = (remark) => {
    // With array destructuring it's important to not remove unused destructured variables, as order is important
    const [_prefix, _op_type, _version, id, issuer] = remark.split("::");
    try {
        validateBase(remark, OP_TYPES.CHANGEISSUER);
        return assert({ id, issuer }, CHANGEISSUERStruct);
    }
    catch (error) {
        console.log("StructError is:", error);
        throw new Error((error === null || error === void 0 ? void 0 : error.message) || "Something went wrong during remark validation");
    }
};
export const validateBuy = (remark) => {
    // With array destructuring it's important to not remove unused destructured variables, as order is important
    const [_prefix, _op_type, _version, id] = remark.split("::");
    try {
        validateBase(remark, OP_TYPES.BUY);
        return assert({ id }, BUYStruct);
    }
    catch (error) {
        console.log("StructError is:", error);
        throw new Error((error === null || error === void 0 ? void 0 : error.message) || "Something went wrong during remark validation");
    }
};
//# sourceMappingURL=validate-remark.js.map