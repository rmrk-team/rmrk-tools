import { OP_TYPES } from "../../constants";
import { Remark } from "../remark";
import { Emote } from "../../../rmrk1.0.0/classes/emote";
import { NFT } from "../../..";
import { Change } from "../../../rmrk1.0.0/changelog";

const addEmoteChange = (
  remark: Remark,
  emoteEntity: Emote,
  nft: NFT,
  addAction = true
) => {
  nft.addChange({
    field: "reactions",
    old: "",
    new: `${addAction ? "+" : "-"}${emoteEntity.unicode}`,
    caller: remark.caller,
    block: remark.block,
    opType: OP_TYPES.EMOTE,
  } as Change);
};

export const emoteInteraction = (
  remark: Remark,
  emoteEntity: Emote,
  nft?: NFT,
  emitEmoteChanges?: boolean
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

  nft.updatedAtBlock = remark.block;
  if (!nft.reactions[emoteEntity.unicode]) {
    nft.reactions[emoteEntity.unicode] = [];
  }
  const index = nft.reactions[emoteEntity.unicode].indexOf(remark.caller, 0);

  const removing = index > -1;
  if (removing) {
    nft.reactions[emoteEntity.unicode].splice(index, 1);

    if (emitEmoteChanges) {
      addEmoteChange(remark, emoteEntity, nft, false);
    }
  } else {
    nft.reactions[emoteEntity.unicode].push(remark.caller);

    if (emitEmoteChanges) {
      addEmoteChange(remark, emoteEntity, nft, true);
    }
  }
};
