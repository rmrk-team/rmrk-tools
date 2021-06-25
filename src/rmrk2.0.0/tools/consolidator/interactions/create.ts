import { decodeAddress } from "@polkadot/keyring";
import { NftClass } from "../../../classes/nft-class";
import { u8aToHex } from "@polkadot/util";
import { Remark } from "../remark";
import { OP_TYPES } from "../../constants";

export const getCollectionFromRemark = (remark: Remark) => {
  const collection = NftClass.fromRemark(remark.remark, remark.block);
  if (typeof collection === "string") {
    throw new Error(
      `[${OP_TYPES.CREATE}] Dead before instantiation: ${collection}`
    );
  }
  return collection;
};

export const validateMintIds = (nftClass: NftClass, remark: Remark) => {
  const pubkey = decodeAddress(remark.caller);
  const pubkeyString = u8aToHex(pubkey);
  const pubkeyStart = pubkeyString.substr(2, 8);
  const pubkeyEnd = pubkeyString.substring(pubkeyString.length - 8);
  const id = NftClass.generateId(u8aToHex(pubkey), nftClass.symbol);
  const idStart = id.substr(0, 8);
  const idEnd = id.substring(pubkeyString.length - 8);
  if (idStart === pubkeyStart && idEnd === pubkeyEnd) {
    throw new Error(
      `Caller's pubkey ${u8aToHex(pubkey)} (${id}) does not match generated ID`
    );
  }
};
