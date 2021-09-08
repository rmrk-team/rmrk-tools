import { decodeAddress } from "@polkadot/keyring";
import { Collection as C100 } from "../../../index";
import { u8aToHex } from "@polkadot/util";
import { Remark } from "../remark";

export const validateMintIds = (collection: C100, remark: Remark) => {
  const pubkey = decodeAddress(remark.caller);
  const pubkeyString = u8aToHex(pubkey);
  const pubkeyStart = pubkeyString.substr(2, 8);
  const pubkeyEnd = pubkeyString.substring(pubkeyString.length - 8);
  const id = C100.generateId(u8aToHex(pubkey), collection.symbol);
  const idStart = id.substr(0, 8);
  const idEnd = id.substring(pubkeyString.length - 8);
  if (idStart === pubkeyStart && idEnd === pubkeyEnd) {
    throw new Error(
      `Caller's pubkey ${u8aToHex(pubkey)} (${id}) does not match generated ID`
    );
  }
};
