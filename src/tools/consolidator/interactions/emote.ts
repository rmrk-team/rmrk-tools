import { OP_TYPES } from "../../constants";
import { Remark } from "../remark";
import { Emote } from "../../../rmrk1.0.0/classes/emote";
import { NFT } from "../../..";

export const emoteInteraction = (
  remark: Remark,
  emoteEntity: Emote,
  nft?: NFT
): void => {
  if (!nft) {
    throw new Error(
      `[${OP_TYPES.EMOTE}] Attempting to emote on non-existant NFT ${emoteEntity.id}`
    );
  }

  if (nft.burned != "") {
    throw new Error(
      `[${OP_TYPES.EMOTE}] Cannot emote to a burned NFT ${emoteEntity.id}`
    );
  }

  if (!nft.reactions[emoteEntity.unicode]) {
    nft.reactions[emoteEntity.unicode] = [];
  }
  const index = nft.reactions[emoteEntity.unicode].indexOf(remark.caller, 0);

  const removing = index > -1;
  if (removing) {
    nft.reactions[emoteEntity.unicode].splice(index, 1);
  } else {
    nft.reactions[emoteEntity.unicode].push(remark.caller);
  }

  nft.addChange({
    field: "reactions",
    old: removing,
    new: !removing,
    caller: remark.caller,
    block: remark.block,
    opType: OP_TYPES.EMOTE,
  });
};
