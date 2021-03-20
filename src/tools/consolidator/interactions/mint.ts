import { decodeAddress } from "@polkadot/keyring";
import { Collection as C100 } from "../../..";
import { u8aToHex } from "@polkadot/util";
import { Remark } from "../remark";
import { OP_TYPES } from "../../constants";

export const getCollectionFromRemark = (remark: Remark) => {
  const collection = C100.fromRemark(remark.remark, remark.block);
  if (typeof collection === "string") {
    throw new Error(
      `[${OP_TYPES.MINT}] Dead before instantiation: ${collection}`
    );
  }
  return collection;
};

export const validateMintIds = (collection: C100, remark: Remark) => {
  const pubkey = decodeAddress(remark.caller);
  const id = C100.generateId(u8aToHex(pubkey), collection.symbol);
  if (id.toLowerCase() !== collection.id.toLowerCase()) {
    throw new Error(
      `Caller's pubkey ${u8aToHex(pubkey)} (${id}) does not match generated ID`
    );
  }
};
