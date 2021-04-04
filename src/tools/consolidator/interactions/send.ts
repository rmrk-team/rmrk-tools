import { OP_TYPES } from "../../constants";
import { Change } from "../../../rmrk1.0.0/changelog";
import { Remark } from "../remark";
import { Send } from "../../../rmrk1.0.0/classes/send";
import { NFT } from "../../..";

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
