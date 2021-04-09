import { OP_TYPES } from "../../constants";
import { Change } from "../../../rmrk1.0.0/changelog";
import { Remark } from "../remark";
import { Send } from "../../../rmrk1.0.0/classes/send";
import { NFT } from "../../..";
import { isValidAddress } from "../../utils";

export const sendInteraction = (
  remark: Remark,
  sendEntity: Send,
  nft?: NFT
): void => {
  if (!nft) {
    throw new Error(
      `[${OP_TYPES.SEND}] Attempting to send non-existant NFT ${sendEntity.id}`
    );
  }

  if (nft.burned != "") {
    throw new Error(
      `[${OP_TYPES.SEND}] Attempting to send burned NFT ${sendEntity.id}`
    );
  }

  // Check if allowed to issue send - if owner == caller
  if (nft.owner != remark.caller) {
    throw new Error(
      `[${OP_TYPES.SEND}] Attempting to send non-owned NFT ${sendEntity.id}, real owner: ${nft.owner}`
    );
  }

  if (nft.transferable === 0 || nft.transferable >= remark.block) {
    throw new Error(
      `[${OP_TYPES.SEND}] Attempting to send non-transferable NFT ${sendEntity.id}.`
    );
  }

  // @todo add check to make sure address is not only valid, but that format matches the chain
  // do this by decoding, and then encoding back with SS58 prefix, and comparing original vs obtained string
  // take into account Development chain which has null for an SS58 prefix and needs to be normalized against SS58 prefix 0
  if (!isValidAddress(sendEntity.recipient)) {
    throw new Error(
      `[${OP_TYPES.SEND}] Invalid recipient: not valid address: ${sendEntity.recipient}.`
    );
  }

  nft.updatedAtBlock = remark.block;
  nft.addChange({
    field: "owner",
    old: nft.owner,
    new: sendEntity.recipient,
    caller: remark.caller,
    block: remark.block,
    opType: OP_TYPES.SEND,
  } as Change);

  nft.owner = sendEntity.recipient;

  // Cancel LIST, if any
  if (nft.forsale > BigInt(0)) {
    nft.addChange({
      field: "forsale",
      old: nft.forsale,
      new: BigInt(0),
      caller: remark.caller,
      block: remark.block,
      opType: OP_TYPES.SEND,
    } as Change);
    nft.forsale = BigInt(0);
  }
};
